import type { DictWord } from '../types'
import dictTxt from '../data/dict.txt?raw'

type Dict = Record<string, string>

export const dict: Dict = (() => {
  const reg = /([a-z]+)\s+(\S*)[$|\n]/g
  const dictObj: Record<string, string> = {}
  let res = reg.exec(dictTxt)
  while (res && res.length >= 3) {
    dictObj[res[1]] = res[2]
    res = reg.exec(dictTxt)
  }
  return dictObj
})()

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
