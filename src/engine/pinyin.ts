import pinyinText from '../data/pinyin.txt?raw'
import { damerauLevenshteinDistanceCorrector } from './corrector'

export const pinyinSet = new Set<string>(pinyinText.split('\n'))

// [ni, hao, wo, chi, fan, le]
type Syllable = string[]

export function appendSyllables(ans: Syllable[], compAns: Syllable[]) {
  const len = ans.length
  if (len === 0) {
    compAns.forEach(pinyinSeq => ans.push(pinyinSeq))
    return ans
  }
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < compAns.length; j++) {
      ans.push([...ans[i], ...compAns[j]])
    }
  }
  ans.splice(0, len)
  return ans
}

export function splitSyllablesExhaustive(text: string): Syllable[] {
  const ans: Syllable[] = []
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
  callback?: (quotes: string, collector?: Syllable, indexes?: number[]) => void,
): Syllable {
  const reg = /[^']+/g
  let exceed = reg.exec(text)
  let lastIndex = 0
  const segs: Syllable = []
  const indexes: number[] = []
  const res: Syllable = []
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
  if (s.length < 3) {
    return []
  }
  return damerauLevenshteinDistanceCorrector(s, pinyinSet, 2)
}

export function splitSyllablesByExistPinyinWithCorrector(text: string) {
  const corrected: Syllable = []
  const result: Syllable = []
  const tempCorrected: Syllable = []
  const tempResult: Syllable = []
  const updateCorrected = (collector: Syllable, i: number, j: number) => {
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
  splitSyllablesByExistPinyin(text, (quotes: string, collector?: Syllable, indexes?: number[]) => {
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
    let correctRes: Syllable = []
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
): { result: Syllable, corrected?: Syllable } {
  const validatedSyllablesList = splitSyllablesExhaustive(text)
  if (validatedSyllablesList.length > 0) {
    return { result: validatedSyllablesList.sort((a, b) => a.length - b.length)[0] }
  }
  return options?.useCorrector
    ? splitSyllablesByExistPinyinWithCorrector(text)
    : { result: splitSyllablesByExistPinyin(text) }
}
