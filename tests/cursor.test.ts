import { expect, it } from 'vitest'
import {
  deleteCharAtCursorPosition,
  findConvertPinyinByCursorPosition,
  generateTextByCursorPosition,
  insertCharAtCursorPosition,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  replaceTextAndUpdateCursorPosition,
} from '../src/utils/cursor'

it('insertCharAtCursorPosition', () => {
  expect(insertCharAtCursorPosition('niha', 'o', -1)).toBe(
    '<span>o</span><span class="sime-cursor"></span><span>niha</span>',
  )
  expect(insertCharAtCursorPosition('niha', 'o', 0)).toBe(
    '<span>o</span><span class="sime-cursor"></span><span>niha</span>',
  )
  expect(insertCharAtCursorPosition('', 'o', 0)).toBe(
    '<span>o</span><span class="sime-cursor"></span>',
  )
  expect(insertCharAtCursorPosition('niha', 'o', 4)).toBe(
    '<span>nihao</span><span class="sime-cursor"></span>',
  )
  expect(insertCharAtCursorPosition('niha', 'o', 10)).toBe(
    '<span>nihao</span><span class="sime-cursor"></span>',
  )
})

it('deleteCharAtCursorPosition', () => {
  expect(deleteCharAtCursorPosition('nihao', -1)).toBe(
    '<span class="sime-cursor"></span><span>nihao</span>',
  )
  expect(deleteCharAtCursorPosition('nihao', 0)).toBe(
    '<span class="sime-cursor"></span><span>nihao</span>',
  )
  expect(deleteCharAtCursorPosition('nihao', 5)).toBe(
    '<span>niha</span><span class="sime-cursor"></span>',
  )
  expect(deleteCharAtCursorPosition('n', 1)).toBe('<span class="sime-cursor"></span>')
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
  expect(moveCursorPositionLeft('nihao', 1)).toBe<number>(0)
  expect(moveCursorPositionLeft('nihao', 0)).toBe<number>(0)
  expect(moveCursorPositionLeft('nihao', 5)).toBe<number>(4)
  expect(moveCursorPositionLeft('你hao', 1)).toBe<number>(1)
  expect(moveCursorPositionLeft('你hao', 2)).toBe<number>(1)
})

it('moveCursorPositionRight', () => {
  expect(moveCursorPositionRight('nihao', 1)).toBe<number>(2)
  expect(moveCursorPositionRight('nihao', 0)).toBe<number>(1)
  expect(moveCursorPositionRight('nihao', 5)).toBe<number>(5)
  expect(moveCursorPositionRight('你hao', 1)).toBe<number>(2)
  expect(moveCursorPositionRight('你hao', 2)).toBe<number>(3)
})

it('findNextConvertPinyinByCursorPosition', () => {
  expect(findConvertPinyinByCursorPosition('nihao', 2)).toEqual({ quotes: 0, pinyin: 'ni' })
  expect(findConvertPinyinByCursorPosition('ni\'hao', 3)).toEqual({ pinyin: 'ni', quotes: 1 })
  expect(findConvertPinyinByCursorPosition('ni\'\'hao', 4)).toEqual({ pinyin: 'ni', quotes: 2 })
  expect(findConvertPinyinByCursorPosition('你\'\'hao', 3)).toEqual({ quotes: 2, pinyin: 'hao' })
  expect(findConvertPinyinByCursorPosition('你\'\'hao\'le', 3)).toEqual({ quotes: 3, pinyin: 'hao' })
  expect(findConvertPinyinByCursorPosition('你\'\'hao\'le\'\'', 3)).toEqual({ quotes: 3, pinyin: 'hao' })
  expect(findConvertPinyinByCursorPosition('你zenhao\'\'', 4)).toEqual({ quotes: 0, pinyin: 'zen' })
  expect(findConvertPinyinByCursorPosition('你zen\'\'hao\'\'', 6)).toEqual({ pinyin: 'zen', quotes: 2 })
  expect(findConvertPinyinByCursorPosition('你zen\'\'hao\'\'', 5)).toEqual({ pinyin: 'zen', quotes: 1 })
})
