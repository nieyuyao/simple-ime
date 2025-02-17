import { expect, it } from 'vitest'
import { segmentPinyinByDict, segmentPinyinByTire } from '../src/utils/pinyin'

it('segment pinyin according to trie', () => {
  expect(segmentPinyinByTire('nihao')).toBe('nihao')
  expect(segmentPinyinByTire('nihaode')).toBe('nihao\'de')
  expect(segmentPinyinByTire('nichifanleme')).toBe('ni\'chifan\'le\'me')
  expect(segmentPinyinByTire('nihao\'\'de')).toBe('nihao\'\'de')
  expect(segmentPinyinByTire('ni\'\'hao\'\'de')).toBe('ni\'\'hao\'\'de')
  expect(segmentPinyinByTire('xian')).toBe('xian')
  expect(segmentPinyinByTire('xi\'an')).toBe('xi\'an')
  expect(segmentPinyinByTire('woqu')).toBe('woqu')
  expect(segmentPinyinByTire('iii')).toBe('i\'i\'i')
})

it('segment pinyin according to dict', () => {
  expect(segmentPinyinByDict('nihao')).toBe('ni\'hao')
  expect(segmentPinyinByDict('nihaode')).toBe('ni\'hao\'de')
  expect(segmentPinyinByDict('nichifanleme')).toBe('ni\'chifan\'le\'me')
  expect(segmentPinyinByDict('nihao\'\'de')).toBe('ni\'hao\'\'de')
  expect(segmentPinyinByDict('ni\'\'hao\'\'de')).toBe('ni\'\'hao\'\'de')
  expect(segmentPinyinByDict('xian')).toBe('xian')
  expect(segmentPinyinByDict('xi\'an')).toBe('xi\'an')
  expect(segmentPinyinByDict('woqu')).toBe('wo\'qu')
  expect(segmentPinyinByDict('iii')).toBe('i\'i\'i')
})
