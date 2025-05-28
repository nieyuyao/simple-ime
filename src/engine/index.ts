import type { Candidate, DictWord } from '../types'
import { LRUCache } from 'lru-cache'
import { getWordsFormDict } from './dict'
import { getFuzzyMatchedWords } from './fuzzy'
import { split } from './pinyin'

enum Category {
  Backward = 0b0001,
  Forward = 0b0010,
}

interface Result {
  segments: string[]
  candidates: Candidate[]
}

const options: LRUCache.Options<any, any, any> = {
  max: 500,
  ttl: 1000 * 60 * 5,
}

const cache = new LRUCache<string, Result>(options)

interface LookUpOptions {
  limit: number
  corrected?: string[]
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
    if (corrected) {
      pinyin += corrected[i]
    }
    else {
      const matched = segments[i].match(/[^']+/)
      pinyin += matched ? matched[0] : ''
    }
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
      j = i + 1
      i = end + 1
      if (words.length === 0) {
        words = getFuzzyMatchedWords(segments.slice(j - 1, j).map(s => s.replace(/'/, '')))
        if (words.length > 0) {
          j = i + 2
        }
      }
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
  let lastWords: DictWord[] = []
  let lastText = ''
  for (let i = 0; i <= end; i++) {
    const { pinyin, text } = mergeSegments(segments, j, i, opts.corrected)
    let words = getWordsFormDict(pinyin)
    if (words.length <= 0) {
      if (i - j === 1) {
        words = getFuzzyMatchedWords(segments.slice(j, i + 1).map(s => s.replace(/'/, '')))
        if (words.length) {
          collect = joinCandidates(collect, words.map((w) => {
            return {
              ...w,
              matchLength: text.length,
            }
          }))
          j = i + 1
          continue
        }
      }
      if (i === j) {
        collect = joinCandidates(collect, [
          {
            f: 0,
            w: pinyin,
            matchLength: pinyin.length,
          },
        ])
        j = i + 1
      }
      else {
        collect = joinCandidates(collect, lastWords.map((w) => {
          return {
            ...w,
            matchLength: lastText.length,
          }
        }))
        j = i
        i--
      }
    }
    else if (i === end) {
      collect = joinCandidates(collect, words.map((w) => {
        return {
          ...w,
          matchLength: text.length,
        }
      }))
    }
    lastWords = words
    lastText = text
    if (collect.length > opts.limit && opts.limit !== -1) {
      collect.splice(opts.limit, collect.length - opts.limit)
    }
  }
  return collect
}

export function requestCandidates(
  text: string,
  category: number = Category.Backward | Category.Forward,
): Result {
  if (cache.has(text)) {
    return cache.get(text)!
  }
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
  const result = {
    segments,
    candidates: [
      ...bestResult,
      ...segmentedResult,
    ],
  }
  cache.set(text, result)
  return result
}
