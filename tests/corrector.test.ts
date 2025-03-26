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
  expect(calcDamerauLevenshteinDistance('ab', 'ba')).toEqual(1)
  expect(calcDamerauLevenshteinDistance('chnog', 'chong')).toEqual(1)
  expect(calcDamerauLevenshteinDistance('zhgno', 'zhong')).toEqual(2)
})

it('damerau levenshtein distance corrector', () => {
  expect(damerauLevenshteinDistanceCorrector('chnog', pinyinSet, 2)[0]).toEqual('chong')
  expect(damerauLevenshteinDistanceCorrector('zhoong', pinyinSet, 2)[0]).toEqual('zhong')
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
