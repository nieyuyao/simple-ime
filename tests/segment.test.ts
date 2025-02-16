import { expect, it } from 'vitest'
import { segmentPinyin } from '../src/utils/pinyin'

it('segment pinyin', () => {
  expect(segmentPinyin('nihao')).toEqual('nihao')
  expect(segmentPinyin('nihaode')).toEqual('nihao\'de')
  expect(segmentPinyin('nihao\'\'de')).toEqual('nihao\'\'de')
  expect(segmentPinyin('ni\'\'hao\'\'de')).toEqual('ni\'\'hao\'\'de')
  expect(segmentPinyin('xi\'an')).toEqual('xi\'an')
  expect(segmentPinyin('iii')).toEqual('i\'i\'i')
})
