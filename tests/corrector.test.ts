import { expect, it } from 'vitest'
import {
  calcDamerauLevenshteinDistance,
  calcLevenshteinDistance,
  damerauLevenshteinDistanceCorrector,
  levenshteinDistanceCorrector,
  nearSwapCorrector,
} from '../src/engine/corrector'
import { pinyinSet } from '../src/engine/pinyin'

it('calc damerau levenshtein distance', () => {
  expect(calcDamerauLevenshteinDistance('', '')).toEqual(0)
  expect(calcDamerauLevenshteinDistance('', 'a')).toEqual(1)
  expect(calcDamerauLevenshteinDistance('a', 'a')).toEqual(0)
  expect(calcDamerauLevenshteinDistance('b', 'a')).toEqual(1)
  expect(calcDamerauLevenshteinDistance('ab', 'ba')).toEqual(0)
  expect(calcDamerauLevenshteinDistance('ano', 'aon')).toEqual(0)
  expect(calcDamerauLevenshteinDistance('zhgno', 'zhong')).toEqual(2)
  expect(calcDamerauLevenshteinDistance('aabccc', '')).toEqual(6)
  expect(calcDamerauLevenshteinDistance('aabccc', 'aab')).toEqual(3)
  expect(calcDamerauLevenshteinDistance('aabccc', 'aba')).toEqual(3)
  expect(calcDamerauLevenshteinDistance('aabcda', 'abadca')).toEqual(0)
})

it('damerau levenshtein distance corrector', () => {
  expect(damerauLevenshteinDistanceCorrector('', pinyinSet, 2)).toEqual([])
  expect(damerauLevenshteinDistanceCorrector('chnog', pinyinSet, 2)[0]).toEqual('chong')
  expect(damerauLevenshteinDistanceCorrector('zhoong', pinyinSet, 2)[0]).toEqual('zhong')
  expect(damerauLevenshteinDistanceCorrector('ac', pinyinSet, 2)[0]).toEqual('ca')
})

it('calc levenshtein distance', () => {
  expect(calcLevenshteinDistance('', '')).toEqual(0)
  expect(calcLevenshteinDistance('', 'a')).toEqual(1)
  expect(calcLevenshteinDistance('a', 'a')).toEqual(0)
  expect(calcLevenshteinDistance('b', 'a')).toEqual(1)
  expect(calcLevenshteinDistance('ab', 'ba')).toEqual(2)
  expect(calcLevenshteinDistance('chnog', 'chong')).toEqual(2)
  expect(calcLevenshteinDistance('zhgno', 'zhong')).toEqual(2)
})

it('levenshtein distance corrector', () => {
  expect(levenshteinDistanceCorrector('chnog', pinyinSet, 2)[0]).toEqual('chang')
  expect(damerauLevenshteinDistanceCorrector('zhoong', pinyinSet, 2)[0]).toEqual('zhong')
})

it('nearly swap corrector', () => {
  expect(nearSwapCorrector('chnog', pinyinSet)[0]).toEqual('chong')
  expect(nearSwapCorrector('zhnog', pinyinSet)[0]).toEqual('zhong')
})
