import type { DictWord, PinyinSyllables } from '../types'
import { PTrie } from 'dawg-lookup'
import packedPinyinSetTrieTxt from '../data/packed-pinyin-trie.txt?raw'
import { getWordsFormDict } from './dict'

export const trie = new PTrie(packedPinyinSetTrieTxt)

/**
 * @example inputs nh and returns nihao
 */
export function getFuzzyMatchedSyllable(w: string): PinyinSyllables {
  const completions = trie.completions(w)
  return completions
}

export function getFuzzyMatchedPinyin(segments: string[]): PinyinSyllables[] {
  const pinyins: PinyinSyllables[] = []
  let i = 0
  while (i < segments.length) {
    const len = pinyins.length
    const syllables = getFuzzyMatchedSyllable(segments[i])
    if (len === 0) {
      for (let k = 0; k < syllables.length; k++) {
        pinyins.push([syllables[k]])
      }
    }
    else {
      for (let j = 0; j < len; j++) {
        let res: PinyinSyllables = []
        for (let k = 0; k < syllables.length; k++) {
          res = [...pinyins[j], syllables[k]]
          pinyins.push([...res])
        }
      }
      pinyins.splice(0, len)
    }
    i++
  }
  return pinyins
}

export function getFuzzyMatchedWords(segments: string[]): DictWord[] {
  const pinyins = getFuzzyMatchedPinyin(segments)
  const res: DictWord[] = []
  pinyins.forEach((syllables) => {
    const pinyin = syllables.join('')
    res.push(...getWordsFormDict(pinyin))
  })
  return res.sort((a, b) => b.f - a.f).slice(0, 2)
}
