import type { Syllable } from '../types'
import { PTrie } from 'dawg-lookup'
import packedPinyinSetTrieTxt from '../data/packed-pinyin-trie.txt?raw'

export const trie = new PTrie(packedPinyinSetTrieTxt)

/**
 * @example inputs nh and returns nihao
 */
export function getFuzzyMatchedSyllable(w: string): Syllable {
  const found = trie.completions(w)
  return found
}
