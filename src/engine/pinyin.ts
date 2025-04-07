import type { PinyinSyllables } from '../types'
import pinyinText from '../data/pinyin.txt?raw'
import { damerauLevenshteinDistanceCorrector } from './corrector'

export const pinyinSet = new Set<string>(pinyinText.split('\n'))

export function appendSyllables(syllables: PinyinSyllables[], appended: PinyinSyllables[]) {
  const len = syllables.length
  if (len === 0) {
    appended.forEach(pinyinSeq => syllables.push(pinyinSeq))
    return syllables
  }
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < appended.length; j++) {
      syllables.push([...syllables[i], ...appended[j]])
    }
  }
  syllables.splice(0, len)
  return syllables
}

export function splitSyllablesExhaustive(text: string): PinyinSyllables[] {
  const ans: PinyinSyllables[] = []
  if (text.includes("'")) {
    const reg = /[^']+/g
    let res = reg.exec(text)
    let lastIndex = 0
    while (res) {
      const index = res.index
      const compAns = splitSyllablesExhaustive(res[0])
      if (compAns.length <= 0) {
        return []
      }
      if (lastIndex !== index) {
        const quotes = text.substring(lastIndex, index)
        compAns.forEach((comp) => {
          comp[0] = quotes + comp[0]
        })
      }
      lastIndex = index + res[0].length
      appendSyllables(ans, compAns)
      res = reg.exec(text)
    }
    if (lastIndex !== text.length) {
      const tail = text.substring(lastIndex, text.length)
      ans.forEach((comp) => {
        comp[comp.length - 1] += tail
      })
    }
    return ans
  }
  else {
    for (let i = 0; i < text.length; i++) {
      const pre = text.substring(0, i + 1)
      if (pinyinSet.has(pre)) {
        const next = text.substring(i + 1)
        if (next) {
          const appendices = splitSyllablesExhaustive(next)
          appendices.forEach((append) => {
            ans.push([pre, ...append])
          })
        }
        else {
          ans.push([pre])
        }
      }
    }
  }
  return ans
}

export function splitSyllablesByExistPinyin(
  text: string,
  callback?: (quotes: string, collector?: PinyinSyllables, indexes?: number[]) => void,
): PinyinSyllables {
  const reg = /[^']+/g
  let exceed = reg.exec(text)
  let lastIndex = 0
  const segs: PinyinSyllables = []
  const indexes: number[] = []
  const res: PinyinSyllables = []
  while (exceed) {
    const index = exceed.index
    let quotes = ''
    if (lastIndex !== index) {
      quotes = text.substring(lastIndex, index)
    }
    lastIndex = index + exceed[0].length
    const sub = exceed![0]
    for (let i = 0; i < sub.length; i++) {
      let j = Math.min(i + 4, sub.length - 1)
      for (; j >= i + 1; j--) {
        const seg = sub.substring(i, j + 1)
        if (pinyinSet.has(seg)) {
          segs.push(seg)
          indexes.push(segs.length - 1)
          i = j + 1
          break
        }
      }
      if (j === i) {
        segs.push(sub.charAt(i))
      }
      else {
        i--
      }
    }
    callback?.(quotes, segs, indexes)
    segs[0] = quotes + segs[0]
    res.push(...segs)
    segs.length = 0
    indexes.length = 0
    exceed = reg.exec(text)
  }
  if (lastIndex !== text.length) {
    const trailingQuotes = text.substring(lastIndex, text.length)
    if (res.length) {
      res[res.length - 1] += trailingQuotes
    }
    else {
      res.push(trailingQuotes)
    }
    callback?.(trailingQuotes)
  }
  return res
}

function findCorrectedPinyin(s: string) {
  return s.length <= 1 ? [] : damerauLevenshteinDistanceCorrector(s, pinyinSet, 2)
}

export function splitSyllablesByExistPinyinWithCorrector(text: string) {
  const corrected: PinyinSyllables = []
  const result: PinyinSyllables = []
  const tempCorrected: PinyinSyllables = []
  const tempResult: PinyinSyllables = []
  const updateCorrected = (collector: PinyinSyllables, i: number, j: number) => {
    const s = collector.slice(j, i).join('')
    const res = findCorrectedPinyin(s)
    if (res.length) {
      tempCorrected.push(res[0])
      tempResult.push(s)
    }
    else {
      const slice = collector.slice(j, i)
      tempCorrected.push(...slice)
      tempResult.push(...slice)
    }
  }
  splitSyllablesByExistPinyin(text, (quotes: string, collector?: PinyinSyllables, indexes?: number[]) => {
    if (!collector || !indexes) {
      if (result.length) {
        result[result.length - 1] += quotes
      }
      else {
        result.push(quotes)
      }
      return
    }
    let j = 0
    let k = 0
    let correctRes: PinyinSyllables = []
    for (let i = 0; i < collector.length; i++) {
      if (i === indexes[k]) {
        const str = collector.slice(j, i + 1).join('')
        correctRes = findCorrectedPinyin(str)
        if (correctRes.length) {
          tempCorrected.push(correctRes[0])
          tempResult.push(str)
          k++
          j = i + 1
          continue
        }
        updateCorrected(collector, i, j)
        tempCorrected.push(collector[i])
        tempResult.push(collector[i])
        k++
        j = i + 1
      }
      else if (i === collector.length - 1) {
        if (tempCorrected.length) {
          const str = tempResult[tempResult.length - 1] + collector.slice(j, i + 1).join('')
          correctRes = findCorrectedPinyin(str)
          if (correctRes.length) {
            tempCorrected.splice(tempCorrected.length - 1, 1, correctRes[0])
            tempResult.splice(tempResult.length - 1, 1, str)
            break
          }
        }
        updateCorrected(collector, i + 1, j)
      }
    }
    tempResult[0] = quotes + tempResult[0]
    corrected.push(...tempCorrected)
    result.push(...tempResult)
    // clear temp
    tempResult.length = 0
    tempCorrected.length = 0
  })
  return { result, corrected }
}

export function split(
  text: string,
  options?: { useCorrector: boolean },
): { result: PinyinSyllables, corrected?: PinyinSyllables } {
  const validatedSyllablesList = splitSyllablesExhaustive(text)
  if (validatedSyllablesList.length > 0) {
    return { result: validatedSyllablesList.sort((a, b) => a.length - b.length)[0] }
  }
  return options?.useCorrector
    ? splitSyllablesByExistPinyinWithCorrector(text)
    : { result: splitSyllablesByExistPinyin(text) }
}
