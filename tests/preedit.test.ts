import { expect, it } from 'vitest'
import {
  deleteLetterAtCursorPosition,
  findConvertPinyinByCursorPosition,
  generateTextByCursorPosition,
  insertLetterAtCursorPosition,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  replaceTextAndUpdateCursorPosition,
} from '../src/ime/preedit'

it('insertLetterAtCursorPosition', () => {
  expect(insertLetterAtCursorPosition('niha', 'o', -1)).toBe(
    '<span>o</span><span class="sime-cursor"></span><span>niha</span>',
  )
  expect(insertLetterAtCursorPosition('niha', 'o', 0)).toBe(
    '<span>o</span><span class="sime-cursor"></span><span>niha</span>',
  )
  expect(insertLetterAtCursorPosition('', 'o', 0)).toBe(
    '<span>o</span><span class="sime-cursor"></span>',
  )
  expect(insertLetterAtCursorPosition('niha', 'o', 4)).toBe(
    '<span>nihao</span><span class="sime-cursor"></span>',
  )
  expect(insertLetterAtCursorPosition('niha', 'o', 10)).toBe(
    '<span>nihao</span><span class="sime-cursor"></span>',
  )
})

it('deleteLetterAtCursorPosition', () => {
  expect(deleteLetterAtCursorPosition('nihao', -1)).toBe(
    '<span class="sime-cursor"></span><span>nihao</span>',
  )
  expect(deleteLetterAtCursorPosition('nihao', 0)).toBe(
    '<span class="sime-cursor"></span><span>nihao</span>',
  )
  expect(deleteLetterAtCursorPosition('nihao', 5)).toBe(
    '<span>niha</span><span class="sime-cursor"></span>',
  )
  expect(deleteLetterAtCursorPosition('n', 1)).toBe('<span class="sime-cursor"></span>')
})

it('generateTextByCursorPosition', () => {
  expect(generateTextByCursorPosition('nihao', -1)).toBe(
    '<span class="sime-cursor"></span><span>nihao</span>',
  )
  expect(generateTextByCursorPosition('nihao', 0)).toBe(
    '<span class="sime-cursor"></span><span>nihao</span>',
  )
  expect(generateTextByCursorPosition('nihao', 1)).toBe(
    '<span>n</span><span class="sime-cursor"></span><span>ihao</span>',
  )
  expect(generateTextByCursorPosition('nihao', 5)).toBe(
    '<span>nihao</span><span class="sime-cursor"></span>',
  )
  expect(generateTextByCursorPosition('nihao', 10)).toBe(
    '<span>nihao</span><span class="sime-cursor"></span>',
  )
})

it('replaceTextAndUpdateCursorPosition', () => {
  expect(replaceTextAndUpdateCursorPosition('nihao', 0, 2, '你', 2)).toEqual({
    html: '<span>你</span><span class="sime-cursor"></span><span>hao</span>',
    cursorPosition: 1,
  })
  expect(replaceTextAndUpdateCursorPosition('nihao', 0, 2, '你哎', 2)).toEqual({
    html: '<span>你哎</span><span class="sime-cursor"></span><span>hao</span>',
    cursorPosition: 2,
  })
  expect(replaceTextAndUpdateCursorPosition('nihao', 0, 5, '你好', 5)).toEqual({
    html: '<span>你好</span><span class="sime-cursor"></span>',
    cursorPosition: 2,
  })
  expect(replaceTextAndUpdateCursorPosition('你好hao', 0, 2, 'nihao', 5)).toEqual({
    html: '<span>nihaohao</span><span class="sime-cursor"></span>',
    cursorPosition: 8,
  })
  expect(replaceTextAndUpdateCursorPosition('你好hao', 0, 2, 'nihao', 2)).toEqual({
    html: '<span>nihao</span><span class="sime-cursor"></span><span>hao</span>',
    cursorPosition: 5,
  })
  expect(replaceTextAndUpdateCursorPosition('你好hao', 2, 3, '好', 2)).toEqual({
    html: '<span>你好好</span><span class="sime-cursor"></span>',
    cursorPosition: 3,
  })
})

it('moveCursorPositionLeft', () => {
  expect(moveCursorPositionLeft(0, 1)).toBe<number>(0)
  expect(moveCursorPositionLeft(1, 2)).toBe<number>(1)
  expect(moveCursorPositionLeft(1, 1)).toBe<number>(1)
})

it('moveCursorPositionRight', () => {
  expect(moveCursorPositionRight('nihao', 1)).toBe<number>(2)
  expect(moveCursorPositionRight('nihao', 0)).toBe<number>(1)
  expect(moveCursorPositionRight('nihao', 5)).toBe<number>(5)
  expect(moveCursorPositionRight('你hao', 1)).toBe<number>(2)
  expect(moveCursorPositionRight('你hao', 2)).toBe<number>(3)
})

it('findNextConvertPinyinByCursorPosition', () => {
  expect(findConvertPinyinByCursorPosition('nihao', 0, 2)).toEqual({ origin: 'ni', pinyin: 'ni' })
  expect(findConvertPinyinByCursorPosition('ni\'hao', 0, 2)).toEqual({ origin: 'ni', pinyin: 'ni' })
  expect(findConvertPinyinByCursorPosition('ni\'hao', 0, 3)).toEqual({ origin: 'ni\'', pinyin: 'ni' })
  expect(findConvertPinyinByCursorPosition('ni\'\'hao', 0, 4)).toEqual({ origin: 'ni\'\'', pinyin: 'ni' })
  expect(findConvertPinyinByCursorPosition('你\'\'hao', 1, 3)).toEqual({ origin: '\'\'hao', pinyin: 'hao' })
  expect(findConvertPinyinByCursorPosition('你\'\'hao\'le', 1, 3)).toEqual({ origin: '\'\'hao\'', pinyin: 'hao' })
  expect(findConvertPinyinByCursorPosition('你\'\'hao\'le\'\'', 1, 3)).toEqual({ origin: '\'\'hao\'', pinyin: 'hao' })
  expect(findConvertPinyinByCursorPosition('你zenhao\'\'', 1, 4)).toEqual({ origin: 'zen', pinyin: 'zen' })
  expect(findConvertPinyinByCursorPosition('你zen\'\'hao\'\'', 1, 6)).toEqual({ origin: 'zen\'\'', pinyin: 'zen' })
  expect(findConvertPinyinByCursorPosition('你zen\'\'hao\'\'', 1, 5)).toEqual({ origin: 'zen\'', pinyin: 'zen' })
  expect(findConvertPinyinByCursorPosition('你好de', 2, 5)).toEqual({ origin: 'de', pinyin: 'de' })
  expect(findConvertPinyinByCursorPosition('ni\'\'hao\'\'de', 0, 11)).toEqual({ origin: 'ni\'\'', pinyin: 'ni' })
})
