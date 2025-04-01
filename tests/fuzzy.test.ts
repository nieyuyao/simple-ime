import { expect, it } from 'vitest'
import { getFuzzyMatchedPinyin, getFuzzyMatchedSyllable, getFuzzyMatchedWords } from '../src/engine/fuzzy'

it('fuzzy completions', () => {
  expect(getFuzzyMatchedSyllable('ni')).toEqual([
    'ni',
    'nian',
    'niang',
    'niao',
    'nie',
    'nin',
    'ning',
    'niu',
  ])
  expect(getFuzzyMatchedSyllable('zho')).toEqual([
    'zhong',
    'zhou',
  ])
})

it('fuzzy matched pinyin', () => {
  expect(getFuzzyMatchedPinyin(['zho', 'guo'])).toEqual([
    ['zhong', 'guo'],
    ['zhou', 'guo'],
  ])
})

it('fuzzy matched words', () => {
  expect(getFuzzyMatchedWords(['niiii'])).toEqual([])
  expect(getFuzzyMatchedWords(['zhe', 'g']).map(w => w.w)).toEqual(['这个', '整个'])
})
