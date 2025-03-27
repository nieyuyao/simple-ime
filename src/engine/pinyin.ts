import pinyinText from '../data/pinyin.txt?raw'
import { damerauLevenshteinDistanceCorrector } from './corrector'

export const pinyinSet = new Set<string>(pinyinText.split('\n'))

export function appendAns(ans: string[][], compAns: string[][]) {
  const ansLength = ans.length
  if (ansLength === 0) {
    compAns.forEach(pinyinSeq => ans.push(pinyinSeq))
    return ans
  }
  for (let i = 0; i < ansLength; i++) {
    for (let j = 0; j < compAns.length; j++) {
      ans.push([...ans[i], ...compAns[j]])
    }
  }
  ans.splice(0, ansLength)
  return ans
}

export function splitSyllablesExhaustive(text: string): string[][] {
  const ans: string[][] = []
  if (text.includes('\'')) {
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
      appendAns(ans, compAns)
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

export function splitSyllablesByExistPinyin(text: string, callback?: (quotes: string, collector: string[], indexes: number[]) => void) {
  const reg = /[^']+/g
  let exceed = reg.exec(text)
  let lastIndex = 0
  const segs: string[] = []
  const indexes: number[] = []
  const res: string[] = []
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
    res[res.length - 1] += text.substring(lastIndex, text.length)
  }
  return res
}

export function splitSyllablesByExistPinyinWithCorrector(text: string) {
  const corrected: string[] = []
  const res: string[] = []
  splitSyllablesByExistPinyin(text, (quotes: string, collector: string[], indexes: number[]) => {
    let j = 0
    let k = 0
    const len = corrected.length
    for (let i = 0; i < collector.length; i++) {
      if (i === indexes[k] || i === collector.length - 1) {
        const end = i === indexes[k] ? i : i + 1
        const pinyin = collector.slice(j, end).join('')
        let correctRes: string[] = []
        if (pinyin.length >= 3) {
          correctRes = damerauLevenshteinDistanceCorrector(pinyin, pinyinSet, 2)
        }
        if (correctRes.length) {
          corrected.push(correctRes[0])
          res.push(pinyin)
        }
        else {
          const slice = collector.slice(j, end).map(s => s)
          corrected.push(...slice)
          res.push(...slice)
        }
        if (i === indexes[k]) {
          corrected.push(collector[i])
          res.push(collector[i])
        }
        k++
        j = i + 1
      }
    }
    corrected[len] = quotes + corrected[len]
    res[len] = quotes + res[len]
  })
  return { result: res, corrected }
}

export function split(
  text: string,
  options?: { useCorrector: boolean },
): { result: string[], corrected?: string[] } {
  const validatedSyllablesList = splitSyllablesExhaustive(text)
  if (validatedSyllablesList.length > 0) {
    return { result: validatedSyllablesList.sort((a, b) => a.length - b.length)[0] }
  }
  const useCorrector = Boolean(options?.useCorrector)
  if (!useCorrector) {
    return { result: splitSyllablesByExistPinyin(text) }
  }
  return splitSyllablesByExistPinyinWithCorrector(text)
}
