import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Trie } from 'dawg-lookup'

function genPackedTire() {
  const __dirname = fileURLToPath(import.meta.url)
  const pinyinSetTxt = fs.readFileSync(path.resolve(__dirname, '../../src/data/pinyin.txt'), { encoding: 'utf-8' })
  const pinyins = pinyinSetTxt.split('\n').join(' ')
  const trie = new Trie(pinyins)
  const packed = trie.pack()
  const triePath = path.resolve(__dirname, '../../src/data/packed-pinyin-trie.txt')
  fs.writeFileSync(triePath, packed, { encoding: 'utf-8' })
}

genPackedTire()
