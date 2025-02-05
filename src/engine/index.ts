import { PTrie } from 'dawg-lookup'
import dictTxt from '../data/dict.txt?raw'
import packedTrieTxt from '../data/packed-trie.txt?raw'

type Dict = Record<string, string>

const trie = new PTrie(packedTrieTxt)

const dict: Dict = JSON.parse(dictTxt)

type ResultList = ({ w: string, f: number, matchLen: number })[]

function splitDictContent(content: string, list: ResultList, matchLen: number) {
  const splits = content.split(',')
  for (let i = 0; i < splits.length; i += 2) {
    list.push({
      w: splits[i],
      f: +splits[i + 1],
      matchLen,
    })
  }
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
        splitDictContent(dict[key], list, pinyin.length)
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

export function getCandidates(pinyin: string): [string[], number[]] {
  const list = lookupCandidates(pinyin)
  const candidates = list.map(item => item.w)
  const matchLens = list.map(item => item.matchLen)
  return [candidates, matchLens]
}
