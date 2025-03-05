import type { DictWord } from '../src/engine'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Trie } from 'dawg-lookup'
import { compress, deserializeDict } from './compress-dict.js'

function splitDict() {
  const __dirname = fileURLToPath(import.meta.url)
  const baseDictContent = fs.readFileSync(path.resolve(__dirname, '../../dict/google-pinyin-dict.txt'), { encoding: 'utf-8' })
  const baseDict = deserializeDict(baseDictContent)
  const dict: Record<string, Array<DictWord>> = {}
  const pinyinList: string[] = []
  Object.keys(baseDict).forEach((pinyin) => {
    baseDict[pinyin].forEach((candidate) => {
      if (candidate.f >= 1000) {
        if (!dict[pinyin]) {
          dict[pinyin] = []
        }
        dict[pinyin].push({ ...candidate })
        pinyinList.push(pinyin)
      }
    })
  })
  if (!fs.existsSync(path.resolve(__dirname, '../../temp'))) {
    fs.mkdirSync(path.resolve(__dirname, '../../temp'))
  }
  const trie = new Trie(pinyinList.join(' '))
  fs.writeFileSync(path.resolve(__dirname, '../../temp/dict.txt'), JSON.stringify(compress(dict)))
  fs.writeFileSync(path.resolve(__dirname, '../../temp/packed-trie.txt'), trie.pack())
}

splitDict()
