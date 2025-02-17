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
  return JSON.stringify(compressedDic)
}

function compressDict() {
  const __dirname = fileURLToPath(import.meta.url)
  const dictString = fs.readFileSync(path.resolve(__dirname, '../../dict/google-pinyin-dict.txt'), { encoding: 'utf-8' })
  fs.writeFileSync(path.resolve(__dirname, '../../src/data/dict.txt'), compress(dictString))
}

compressDict()
