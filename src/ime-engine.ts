import { PTrie } from 'dawg-lookup'
import { flatten } from 'lodash-es'
import { type Candidate, dict, packedTrie } from './data/google_pinyin_dict_utf8_55320'

const trie = new PTrie(packedTrie)

/**
 * @param {string} input
 * @returns
 */
export function getCandidates(input: string): [string[], number[]] {
  let list: (Candidate & { matchLen: number })[] = []
  if (input) {
    const value = dict[input]
    // Best Candidate
    if (value) {
      // full pinyin match, or abbr match.
      list = value.map((item) => {
        return {
          ...item,
          matchLen: input.length,
        }
      })
    }
    else if (input.length >= 1) {
      const completions = trie.completions(input)
      const tempList = completions.map((key) => {
        return dict[key]
          ? dict[key].map((item) => {
              return {
                ...item,
                matchLen: key.length,
              }
            })
          : undefined
      })
      // pinyin prefix match, using prepared packed trie data.
      list = flatten(tempList)
    }

    if (list.length <= 0 && input.length >= 1) {
      for (let i = input.length - 1; i >= 1; i--) {
        let subInput = input.substring(0, i)
        if (dict[subInput]) {
          subInput = subInput.substring(0, i)
          const value = dict[subInput]
          if (value) {
            list = value.map((item) => {
              return {
                ...item,
                matchLen: subInput.length,
              }
            })
          }
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
