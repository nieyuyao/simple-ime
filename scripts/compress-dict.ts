import type { DictWord } from '../src/types'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function deserializeDict(content: string) {
  const dict = JSON.parse(content) as Record<string, Array<DictWord>>
  Object.keys(dict).forEach((pinyin) => {
    const candidates = dict[pinyin]
    candidates.sort((a, b) => b.f - a.f)
  })
  return dict
}

export function compress(dict: Record<string, Array<DictWord>>) {
  const compressedDic: Record<string, string> = {}
  Object.keys(dict).forEach((pinyin) => {
    const candidates = dict[pinyin]
    candidates.sort((a, b) => b.f - a.f)
    candidates.forEach((candidate) => {
      if (!compressedDic[pinyin]) {
        compressedDic[pinyin] = ''
      }
      compressedDic[pinyin] += `${candidate.w}${Math.floor(candidate.f)}`
    })
  })
  return compressedDic
}

function compressDict() {
  const __dirname = fileURLToPath(import.meta.url)
  const dictString = fs.readFileSync(path.resolve(__dirname, '../../dict/google-pinyin-dict.txt'), { encoding: 'utf-8' })
  // process emoji txt
  const emojiText = fs.readFileSync(path.resolve(__dirname, '../../dict/emoji.txt'), { encoding: 'utf-8' })
  const reg = /(\S+)\t(.*)\t/g
  let res = reg.exec(emojiText)
  const dict = deserializeDict(dictString)
  while (res) {
    const emoji = res[1]
    const pinyin = res[2].split(/\s+/).join('')
    if (dict[pinyin]) {
      const idx = dict[pinyin].findIndex(dw => dw.f < 1000)
      if (idx === 0) {
        dict[pinyin].length === 1
          ? dict[pinyin].push({ w: emoji, f: 1000 })
          : dict[pinyin].splice(1, 0, { w: emoji, f: dict[pinyin][0].f - 1 })
      }
      else if (idx > -1) {
        dict[pinyin].splice(idx, 0, { w: emoji, f: 1000 })
      }
      else {
        dict[pinyin].push({ w: emoji, f: 1000 })
      }
    }
    else {
      dict[pinyin] = [{ w: emoji, f: 1000 }]
    }
    res = reg.exec(emojiText)
  }
  fs.writeFileSync(path.resolve(__dirname, '../../src/data/dict.txt'), JSON.stringify(compress(dict)))
}

compressDict()
