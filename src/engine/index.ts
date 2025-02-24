import { PTrie } from 'dawg-lookup'
import dictTxt from '../data/dict.txt?raw'
import packedTrieTxt from '../data/packed-trie.txt?raw'
import { cut } from './pinyin'

enum Category {
  Backward = 0b0001,
  Forward = 0b0010,
}

type Dict = Record<string, string>

interface Candidate {
  w: string
  matchLength: number
  f: number
}

interface DictWord {
  w: string
  f: number
}

export const dict: Dict = JSON.parse(dictTxt)

export const trie = new PTrie(packedTrieTxt)

function getWordsFormDict(pinyin: string): DictWord[] {
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
  return list.sort((a, b) => b.f - a.f)
}

export function mergeSegments(
  segments: string[],
  start = 0,
  end = 0
): { pinyin: string; originalPinyin: string } {
  let originalPinyin = ''
  let pinyin = ''
  for (let i = start; i <= end; i++) {
    const matched = segments[i].match(/[^']+/)
    pinyin += matched ? matched[0] : ''
    originalPinyin += segments[i]
  }
  return { pinyin, originalPinyin }
}

const joinCandidates = (
  a: Candidate[],
  b: Candidate[]
): Candidate[] => {
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

export function backwardLookupCandidates(segments: string[], end: number): Candidate[] {
  let collect: Candidate[] = []
  let j = 0
  for (let i = end; i >= j; i--) {
    const { pinyin, originalPinyin } = mergeSegments(segments, j, i)
    let words = getWordsFormDict(pinyin)
    if (i === j) {
      words = words.length ? words : [
        {
          f: 0,
          w: pinyin,
        }
      ]
      collect = joinCandidates(collect, words.map(w => {
        return {
          ...w,
          matchLength: originalPinyin.length
        }
      }))
      j = i + 1
      i = segments.length
    }
    else if (words.length) {
      collect = joinCandidates(collect, words.map(w => {
        return {
          ...w,
          matchLength: originalPinyin.length
        }
      }))
      j = i + 1
      i = segments.length
    }
  }

  return collect
}

export function forwardLookupCandidates(segments: string[], end: number): Candidate[] {
  let j = 0
  let collect: Candidate[] = []
  for (let i = 0; i <= end; i++) {
    const { pinyin: combinePinyin, originalPinyin } = mergeSegments(segments, j, i)
    const words = getWordsFormDict(combinePinyin)
    if (words.length <= 0) {
      const { pinyin: lastCombinePinyin, originalPinyin: lastCombineOriginalPinyin } = mergeSegments(segments, j, i - 1)
      let lastWords =  getWordsFormDict(lastCombinePinyin)
      if (lastWords.length <= 0) {
        lastWords = [
          {
            f: 0,
            w: lastCombinePinyin,
          }
        ]
      }
      collect = joinCandidates(collect, getWordsFormDict(lastCombinePinyin).map(w => {
        return {
          ...w,
          matchLength: lastCombineOriginalPinyin.length
        }
      }))
      j = i

      if (i === end) {
        const matched = segments[i].match(/[^']+/)
        collect = joinCandidates(collect, [
         {
          f: 0,
          w: matched ? matched[0] : '',
          matchLength: segments[i].length
         }
        ])
      }
    }
    else if (i === segments.length - 1) {
      collect = joinCandidates(collect, words.map(w => {
        return {
          ...w,
          matchLength: originalPinyin.length
        }
      }))
    }
  }
  return collect
}

export function requestCandidates(
  text: string,
  category: number = Category.Backward | Category.Forward
): Candidate[] {
  const segmentsList = cut(text)
  segmentsList.sort((a, b) => a.length - b.length)
  const segments = segmentsList[0]
  let result: Candidate[] = []
  const already = new Set<string>()
  if (category & Category.Backward) {
    // Best Candidates
    result.push(...backwardLookupCandidates(segments, segments.length - 1))
    // Segment Candidates
    result.push(...backwardLookupCandidates(segments, 0))
  }
  if (category & Category.Forward) {
    // Best Candidates
    result.push(...forwardLookupCandidates(segments, segments.length - 1))
    // Segment Candidates
    result.push(...forwardLookupCandidates(segments, 0))
  }
  result = result.filter(cand => {
    const key = `${cand.w}${cand.f}`
    if (already.has(key)) {
      return false
    }
    already.add(key)
    return true
  })

  return result.sort((a, b) => b.f - a.f)
}