import type { DictWord } from '../types'
import dictTxt from '../data/dict.txt?raw'

type Dict = Record<string, string>

export const dict: Dict = JSON.parse(dictTxt)

export function getWordsFormDict(pinyin: string): DictWord[] {
  const reg = /(\D+)(\d+)/g
  const content = dict[pinyin]
  if (!content) {
    return []
  }
  let res = reg.exec(content)
  const list: DictWord[] = []
  while (res && res.length >= 3) {
    list.push({
      w: res[1],
      f: +res[2],
    })
    res = reg.exec(content)
  }
  return list
}
