import type { Candidate, DictWord } from '../types'
import dictTxt from '../data/dict.txt?raw'
import { split } from './pinyin'

enum Category {
  Backward = 0b0001,
  Forward = 0b0010,
}

type Dict = Record<string, string>

export const dict: Dict = JSON.parse(dictTxt)

interface LookUpOptions {
  limit: number
  corrected?: string[]
}

export function getWordsFormDict(pinyin: string): DictWord[] {
  const reg = /(\D+)(\d+)/g
  const content = dict[pinyin]
  if (!content) {
    return []
  }
  let res = reg.exec(content)
  const list: DictWord[] = []
  while (res && res.length >= 3) {
    list.push({
      w: res[1],
      f: +res[2],
    })
    res = reg.exec(content)
  }
  return list
}

export function mergeSegments(
  segments: string[],
  start: number,
  end: number,
  corrected?: string[],
): { pinyin: string, text: string } {
  let text = ''
  let pinyin = ''
  for (let i = start; i <= end; i++) {
    const matched = corrected ? corrected[i].match(/[^']+/) : segments[i].match(/[^']+/)
    pinyin += matched ? matched[0] : ''
    text += segments[i]
  }
  return { pinyin, text }
}

function joinCandidates(a: Candidate[], b: Candidate[]): Candidate[] {
  if (a.length <= 0) {
    return b
  }
  const result: Candidate[] = []
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result.push({
        f: a[i].f + b[j].f,
        w: a[i].w + b[j].w,
        matchLength: a[i].matchLength + b[j].matchLength,
      })
    }
  }
  return result
}

export function backwardLookupCandidates(segments: string[], end: number, opts: LookUpOptions): Candidate[] {
  let collect: Candidate[] = []
  let j = 0
  for (let i = end; i >= j; i--) {
    const { pinyin, text } = mergeSegments(segments, j, i, opts.corrected)
    let words = getWordsFormDict(pinyin)
    if (i === j) {
      words = words.length
        ? words
        : [
            {
              f: 0,
              w: pinyin,
            },
          ]
      collect = joinCandidates(collect, words.map((w) => {
        return {
          ...w,
          matchLength: text.length,
        }
      }))
      j = i + 1
      i = end + 1
    }
    else if (words.length) {
      collect = joinCandidates(collect, words.map((w) => {
        return {
          ...w,
          matchLength: text.length,
        }
      }))
      j = i + 1
      i = end + 1
    }
    if (collect.length > opts.limit && opts.limit !== -1) {
      collect.splice(opts.limit, collect.length - opts.limit)
    }
  }

  return collect
}

export function forwardLookupCandidates(segments: string[], end: number, opts: LookUpOptions): Candidate[] {
  let j = 0
  let collect: Candidate[] = []
  for (let i = 0; i <= end; i++) {
    const { pinyin: combinePinyin, text } = mergeSegments(segments, j, i)
    const words = getWordsFormDict(combinePinyin)
    if (words.length <= 0) {
      const { pinyin: lastCombinePinyin, text: lastCombineText } = mergeSegments(segments, j, i - 1)
      let lastWords = getWordsFormDict(lastCombinePinyin)
      if (lastWords.length <= 0) {
        lastWords = [
          {
            f: 0,
            w: lastCombinePinyin,
          },
        ]
      }
      collect = joinCandidates(collect, getWordsFormDict(lastCombinePinyin).map((w) => {
        return {
          ...w,
          matchLength: lastCombineText.length,
        }
      }))
      j = i
      if (i === end) {
        const matched = opts.corrected ? opts.corrected[i].match(/[^']+/) : segments[i].match(/[^']+/)
        collect = joinCandidates(collect, [
          {
            f: 0,
            w: matched ? matched[0] : '',
            matchLength: segments[i].length,
          },
        ])
      }
    }
    else if (i === end) {
      collect = joinCandidates(collect, words.map((w) => {
        return {
          ...w,
          text,
          matchLength: text.length,
        }
      }))
    }
    if (collect.length > opts.limit && opts.limit !== -1) {
      collect.splice(opts.limit, collect.length - opts.limit)
    }
  }
  return collect
}

export function requestCandidates(
  text: string,
  category: number = Category.Backward | Category.Forward,
): {
    segments: string[]
    candidates: Candidate[]
  } {
  const { result: segments, corrected } = split(text, { useCorrector: true })
  if (corrected && corrected.length !== segments.length) {
    console.warn('length of corrected and splitted must be equal')
    return { segments: [], candidates: [] }
  }
  const already = new Set<string>()
  let bestResult: Candidate[] = []
  let segmentedResult: Candidate[] = []
  if (category & Category.Backward) {
    // Best Candidates
    bestResult.push(...backwardLookupCandidates(segments, segments.length - 1, { limit: 2, corrected }))
    // Segmented Candidates
    for (let i = 0; i < segments.length - 2; i++) {
      segmentedResult.push(...backwardLookupCandidates(segments, i, { limit: 2, corrected }))
    }
  }
  if (category & Category.Forward) {
    // Best Candidates
    bestResult.push(...forwardLookupCandidates(segments, segments.length - 1, { limit: 2, corrected }))
    // Segmented Candidates
    for (let i = 0; i < segments.length - 2; i++) {
      segmentedResult.push(...forwardLookupCandidates(segments, i, { limit: 2, corrected }))
    }
  }
  // Dict Candidates
  for (let i = 0; i < Math.min(segments.length, 6); i++) {
    const { pinyin, text } = mergeSegments(segments, 0, i, corrected)
    const words = getWordsFormDict(pinyin)
    words.forEach((w) => {
      segmentedResult.push({
        ...w,
        matchLength: text.length,
      })
    })
  }
  const filter = (cand: Candidate) => {
    if (already.has(cand.w)) {
      return false
    }
    already.add(cand.w)
    return true
  }
  bestResult = bestResult.filter(filter)
  bestResult.sort((a, b) => b.f - a.f)
  segmentedResult = segmentedResult.filter(filter)
  segmentedResult.sort((a, b) => b.f - a.f)
  return {
    segments,
    candidates: [
      ...bestResult,
      ...segmentedResult,
    ],
  }
}
