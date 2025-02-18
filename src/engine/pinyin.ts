import pinyinText from '../data/pinyin.txt?raw'
import { dict } from '../engine'

// eslint-disable-next-line unused-imports/no-unused-vars
const pinyinFrequencyDict = Object.keys(dict).reduce((acc, pinyin) => {
  const phrases = dict[pinyin]
  const reg = /(\D+)(\d+)/g
  let res = reg.exec(phrases)
  let freq = 0
  while (res && res.length >= 3) {
    freq = Math.max(+res[2], freq)
    res = reg.exec(phrases)
  }
  acc[pinyin] = freq
  return acc
}, {} as Record<string, number>)

const pinyinSet = new Set<string>(pinyinText.split('\n'))

export function appendAns(ans: string[][], compAns: string[][]) {
  const ansLength = ans.length
  if (ansLength === 0) {
    compAns.forEach(pinyinSeq => ans.push(pinyinSeq))
    return ans
  }
  for (let i = 0; i < ansLength; i++) {
    for (let j = 0; j < compAns.length; j++) {
      ans.push([
        ...ans[i],
        ...compAns[j],
      ])
    }
  }
  ans.splice(0, ansLength)
  return ans
}

export function cut(pinyin: string) {
  const splits = cut(pinyin)
  if (splits.length > 0) {
    return splits
  }
  let i = 0
  const split: string[] = []

  while (i < pinyin.length) {
    let j = Math.min(i + 4, pinyin.length - 1)
    for (; j >= i + 1; j--) {
      const sub = pinyin.substring(i, j + 1)
      if (pinyinSet.has(sub)) {
        split.push(sub)
        i = j + 1
        break
      }
    }
    if (j === i) {
      split.push(pinyin.charAt(i))
      i++
    }
  }
  splits.push(split)
  return splits
}
