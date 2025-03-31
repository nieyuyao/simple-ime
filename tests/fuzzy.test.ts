import { expect, it } from 'vitest'
import { getFuzzyMatchedSyllable } from '../src/engine/fuzzy'

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
