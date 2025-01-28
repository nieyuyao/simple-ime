import { expect, it } from 'vitest'
import { findNextConvertPinyin } from '../utils/pinyin'

it('findNextConvertPinyin', () => {
  expect(findNextConvertPinyin('nihao\'\'')).toEqual({ pinyin: 'nihao', suffixQuotes: 2 })
})
