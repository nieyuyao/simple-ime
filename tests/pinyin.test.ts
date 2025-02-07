import { expect, it } from 'vitest'
import { findNextConvertPinyin } from '../src/utils/pinyin'

it('findNextConvertPinyin', () => {
  expect(findNextConvertPinyin('nihao\'\'')).toEqual({ pinyin: 'nihao', quotes: 2 })
})
