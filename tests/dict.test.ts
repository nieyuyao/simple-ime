import { expect, it } from 'vitest'
import { dict } from '../src/engine/dict'

it('whether dict text is correct', () => {
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
