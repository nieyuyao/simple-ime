import { expect, it } from 'vitest'
import { cut } from '../src/engine/pinyin'

it('split text according to pinyin dict', () => {
  expect(cut('nihao')).toEqual([
    ['ni', 'ha', 'o'],
    ['ni', 'hao'],
  ])
  expect(cut('jian')).toEqual([['ji', 'an'], ['jian']])
  expect(cut('kongjian')).toEqual([
    ['kong', 'ji', 'an'],
    ['kong', 'jian'],
  ])
  expect(cut('nii')).toEqual([['ni', 'i']])
  expect(cut('iii')).toEqual([['i', 'i', 'i']])
  expect(cut('niaoiii')).toEqual([['niao', 'i', 'i', 'i']])
  expect(cut('qiiang')).toEqual([['qi', 'i', 'ang']])
  expect(cut('qiang')).toEqual([['qi', 'ang'], ['qiang']])
  expect(cut('wowowo')).toEqual([['wo', 'wo', 'wo']])
})

it('split text has quotes', () => {
  expect(cut('kong\'jian')).toEqual([
    ['kong', '\'ji', 'an'],
    ['kong', '\'jian'],
  ])
  expect(cut('kong\'\'jian')).toEqual([
    ['kong', '\'\'ji', 'an'],
    ['kong', '\'\'jian'],
  ])
  expect(cut('\'kongjian')).toEqual([
    ['\'kong', 'ji', 'an'],
    ['\'kong', 'jian'],
  ])
  expect(cut('kongjian\'')).toEqual([
    ['kong', 'ji', 'an\''],
    ['kong', 'jian\''],
  ])
  expect(cut('\'nii')).toEqual([['\'ni', 'i']])
  expect(cut('\'\'ni\'\'i')).toEqual([['\'\'ni', '\'\'i']])
  expect(cut('\'\'ni\'\'i\'\'')).toEqual([['\'\'ni', '\'\'i\'\'']])
  expect(cut('i\'\'ni')).toEqual([['i', '\'\'ni']])
})
