import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface Candidate { w: string, f: number }

export function splitDict() {
  const __dirname = fileURLToPath(import.meta.url)
  const dictString = fs.readFileSync(path.resolve(__dirname, '../../../dict/google-pinyin-dict.txt'), { encoding: 'utf-8' })
  const dict = JSON.parse(dictString) as Record<string, Array<Candidate>>
  const coreDict: Record<string, Array<[string, number]>> = {}
  Object.keys(dict).forEach((pinyin) => {
    dict[pinyin].forEach((candidate) => {
      if (candidate.f >= 1000) {
        if (!coreDict[pinyin]) {
          coreDict[pinyin] = []
        }
        coreDict[pinyin].push([candidate.w, candidate.f])
      }
    })
  })

  fs.writeFileSync(path.resolve(__dirname, '../../data/dict.txt'), JSON.stringify(coreDict))
}

splitDict()
