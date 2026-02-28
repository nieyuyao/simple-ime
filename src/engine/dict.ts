import type { DictWord } from '../types'
import dictTxt from '../data/dict.txt?raw'

type Dict = Record<string, string>

export const dict: Dict = (() => {
  // 修复正则表达式，正确匹配拼音和对应的汉字
  const reg = /([a-z]+)\s+([^\n]*)/g
  const dictObj: Record<string, string> = {}
  let res = reg.exec(dictTxt)
  while (res && res.length >= 3) {
    // 去除内容末尾的换行符并存储
    dictObj[res[1]] = res[2].trim()
    res = reg.exec(dictTxt)
  }
  return dictObj
})()

export function getWordsFormDict(pinyin: string): DictWord[] {
  // 规范化输入的拼音：移除单引号，因为词库中不包含引号，然后转为小写
  const normalizedPinyin = pinyin
    .replace(/'/g, '') // 移除所有单引号
    .toLowerCase() // 统一转小写

  // 检查规范化后的拼音是否为空
  if (!normalizedPinyin.trim()) {
    return []
  }

  const content = dict[normalizedPinyin]
  if (!content) {
    return []
  }

  const reg = /(\D+)(\d+)/g
  const list: DictWord[] = []
  let res = reg.exec(content)
  while (res && res.length >= 3) {
    list.push({
      w: res[1],
      f: +res[2],
    })
    res = reg.exec(content)
  }
  return list
}
