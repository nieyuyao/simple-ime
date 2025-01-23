import { PTrie } from 'dawg-lookup'
import { flatten } from 'lodash-es'
import dictTxt from './data/dict.txt?raw'
import packedTrieTxt from './data/packed-trie.txt?raw'

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

export function getCandidates(input: string): [string[], number[]] {
  let list: ResultList = []
  if (input) {
    const value = dict[input]
    // Best Candidate
    if (value) {
      splitDictContent(value, list, input.length)
    }
    else if (input.length >= 1) {
      const completions = trie.completions(input) as string[]
      completions.forEach((key) => {
        if (!dict[key]) {
          return
        }
        splitDictContent(dict[key], list, key.length)
      })
    }

    if (list.length <= 0 && input.length >= 1) {
      for (let i = input.length - 1; i >= 1; i--) {
        let subInput = input.substring(0, i)
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

  const candidates = list.map(item => item.w)
  const matchLens = list.map(item => item.matchLen)

  return [candidates, matchLens]
}
