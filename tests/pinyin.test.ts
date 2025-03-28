import { expect, it } from 'vitest'
import { split, splitSyllablesByExistPinyin, splitSyllablesExhaustive } from '../src/engine/pinyin'

it('split text according to pinyin dict', () => {
  expect(splitSyllablesExhaustive('nihao')).toEqual([
    ['ni', 'ha', 'o'],
    ['ni', 'hao'],
  ])
  expect(splitSyllablesExhaustive('jian')).toEqual([['ji', 'an'], ['jian']])
  expect(splitSyllablesExhaustive('kongjian')).toEqual([
    ['kong', 'ji', 'an'],
    ['kong', 'jian'],
  ])
  expect(splitSyllablesExhaustive('wowowo')).toEqual([['wo', 'wo', 'wo']])
  expect(splitSyllablesExhaustive('qiang')).toEqual([['qi', 'ang'], ['qiang']])
  // includes invalidate syllables
  expect(splitSyllablesByExistPinyin('nii')).toEqual(['ni', 'i'])
  expect(splitSyllablesByExistPinyin('iii')).toEqual(['i', 'i', 'i'])
  expect(splitSyllablesByExistPinyin('niaoiii')).toEqual(['niao', 'i', 'i', 'i'])
  expect(splitSyllablesByExistPinyin('qiiang')).toEqual(['qi', 'i', 'ang'])
})

it('split text has quotes', () => {
  expect(splitSyllablesExhaustive("kong'jian")).toEqual([
    ['kong', "'ji", 'an'],
    ['kong', "'jian"],
  ])
  expect(splitSyllablesExhaustive("kong''jian")).toEqual([
    ['kong', "''ji", 'an'],
    ['kong', "''jian"],
  ])
  expect(splitSyllablesExhaustive("'kongjian")).toEqual([
    ["'kong", 'ji', 'an'],
    ["'kong", 'jian'],
  ])
  expect(splitSyllablesExhaustive("kongjian'")).toEqual([
    ['kong', 'ji', "an'"],
    ['kong', "jian'"],
  ])
  expect(splitSyllablesByExistPinyin("'nii")).toEqual(["'ni", 'i'])
  expect(splitSyllablesByExistPinyin("''ni''i")).toEqual(["''ni", "''i"])
  expect(splitSyllablesByExistPinyin("''ni''i''")).toEqual(["''ni", "''i''"])
  expect(splitSyllablesByExistPinyin("i''ni")).toEqual(['i', "''ni"])
})

it('split text using corrector', () => {
  expect(split('n', { useCorrector: true })).toEqual({ result: ['n'], corrected: ['n'] })
  expect(split('chnog', { useCorrector: true })).toEqual({
    result: ['chnog'],
    corrected: ['chong'],
  })
  expect(split('zhnog', { useCorrector: true })).toEqual({
    result: ['zhnog'],
    corrected: ['zhong'],
  })
  expect(split('zhnoog', { useCorrector: true })).toEqual({
    result: ['zhnoog'],
    corrected: ['zhong'],
  })
  expect(split('zhnoogguo', { useCorrector: true })).toEqual({
    result: ['zhnoog', 'guo'],
    corrected: ['zhong', 'guo'],
  })
  expect(split('chagjiang', { useCorrector: true })).toEqual({
    result: ['cha', 'gjiang'],
    corrected: ['cha', 'jiang'],
  })
  expect(split('znogshi', { useCorrector: true })).toEqual({
    result: ['znog', 'shi'],
    corrected: ['zong', 'shi'],
  })
  expect(split("chnog'chnog", { useCorrector: true })).toEqual({
    result: ['chnog', "'chnog"],
    corrected: ['chong', 'chong'],
  })
  expect(split('chnag', { useCorrector: true })).toEqual({
    result: ['chnag'],
    corrected: ['chang'],
  })
  expect(split("chau'", { useCorrector: true })).toEqual({
    result: ["chau'"],
    corrected: ['chua'],
  })

  expect(split("c'''ac", { useCorrector: true })).toEqual({
    result: ['c', "'''ac"],
    corrected: ['c', 'ca'],
  })

  expect(
    split('woshuashianianaianiapalapizpznbvhgjk', { useCorrector: true }).corrected!.length,
  ).toBeLessThanOrEqual(split('woshuashianianaianiapalapizpznbvhgjk').result.length)
})
