import { PTrie } from 'dawg-lookup'
import dictTxt from '../data/dict.txt?raw'
import packedTrieTxt from '../data/packed-trie.txt?raw'

type Dict = Record<string, string>

type ResultList = ({ w: string, f: number, matchLen: number })[]

export const dict: Dict = JSON.parse(dictTxt)

export const trie = new PTrie(packedTrieTxt)

export function splitDictContent(content: string, list: ResultList, matchLen: number) {
  const reg = /(\D+)(\d+)/g
  let res = reg.exec(content)
  while (res && res.length >= 3) {
    list.push({
      w: res[1],
      f: +res[2],
      matchLen,
    })
    res = reg.exec(content)
  }
  return list
}

function lookupCandidates(pinyin: string): ResultList {
  let list: ResultList = []
  if (pinyin) {
    const value = dict[pinyin]
    // Best Candidate
    if (value) {
      splitDictContent(value, list, pinyin.length)
    }
    else if (pinyin.length >= 1) {
      const completions = trie.completions(pinyin) as string[]
      completions.forEach((key) => {
        if (!dict[key]) {
          return
        }
        splitDictContent(dict[key], list, Math.min(pinyin.length, key.length))
      })
    }

    if (list.length <= 0 && pinyin.length >= 1) {
      for (let i = pinyin.length - 1; i >= 1; i--) {
        let subInput = pinyin.substring(0, i)
        if (dict[subInput]) {
          subInput = subInput.substring(0, i)
          const value = dict[subInput]
          splitDictContent(value, list, subInput.length)
          break
        }
      }
    }

    // sort candidates by word frequency
    list = list.filter(item => !!item).sort((a, b) => b.f - a.f)
  }

  return list
}

export function getCandidates(text: string): [string[], number[]] {
  const list = lookupCandidates(text)
  const candidates = list.map(item => item.w)
  const matchLens = list.map(item => item.matchLen)
  if (candidates.length <= 0) {
    candidates.push(text, text.toUpperCase())
    matchLens.push(text.length, text.length)
  }
  return [candidates, matchLens]
}
