import { expect, it } from 'vitest'
import dictTxt from '../src/data/dict.txt?raw'

it('whether dict text is correct', () => {
  const dict = JSON.parse(dictTxt) as Record<string, string>
  expect(Object.values(dict).every((content) => {
    let accLen = 0
    const reg = /(\D+)(\d+)/g
    let res = reg.exec(content)
    while (res && res.length >= 3) {
      accLen += res[0].length
      res = reg.exec(content)
    }
    return accLen === content.length
  })).toBeTruthy()
})
