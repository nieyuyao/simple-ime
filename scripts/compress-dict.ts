import type { Candidate } from '../src/types'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function compress(content: string) {
  const dict = JSON.parse(content) as Record<string, Array<Candidate>>
  const compressedDic: Record<string, string> = {}
  Object.keys(dict).forEach((pinyin) => {
    dict[pinyin].forEach((candidate) => {
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
  const dict = compress(dictString)
  while (res) {
    const emoji = res[1]
    const pinyin = res[2].split(/\s+/).join('')
    if (dict[pinyin]) {
      dict[pinyin] = `${dict[pinyin]}100${emoji}`
    }
    else {
      dict[pinyin] = `100${emoji}`
    }
    res = reg.exec(emojiText)
  }
  fs.writeFileSync(path.resolve(__dirname, '../../src/data/dict.txt'), JSON.stringify(dict))
}

compressDict()
