import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPreeditSegments,
  deleteLetter,
  forceUpdateCursorPosition,
  getCursorPosition,
  getPreeditSegments,
  insertLetter,
  moveCursorPositionEnd,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  replaceSegments,
  setupPreeditSegments,
  splitPreeditSegmentsByCursorPosition,
} from '../src/ime/preedit'

describe('segment', () => {
  beforeEach(() => {
    clearPreeditSegments()
  })

  it('insertLetter', () => {
    insertLetter('n')
    expect(getPreeditSegments()).toEqual([{ w: '', pinyins: ['n'] }])
    expect(getCursorPosition()).toEqual(1)
    insertLetter('i')
    expect(getPreeditSegments()).toEqual([{ w: '', pinyins: ['ni'] }])
    expect(getCursorPosition()).toEqual(2)
    clearPreeditSegments()
    setupPreeditSegments([
      {
        w: '',
        pinyins: ['ni'],
      },
      {
        w: '',
        pinyins: ['hao'],
      },
    ])
    insertLetter('a')
    expect(getPreeditSegments()).toEqual([
      {
        w: '',
        pinyins: ['ani'],
      },
      {
        w: '',
        pinyins: ['hao'],
      },
    ])
    forceUpdateCursorPosition(2)
    insertLetter('b')
    expect(getPreeditSegments()).toEqual([
      {
        w: '',
        pinyins: ['anbi'],
      },
      {
        w: '',
        pinyins: ['hao'],
      },
    ])
    forceUpdateCursorPosition(4)
    insertLetter('d')
    expect(getPreeditSegments()).toEqual([
      {
        w: '',
        pinyins: ['anbid'],
      },
      {
        w: '',
        pinyins: ['hao'],
      },
    ])
  })

  it('insert single quote', () => {
    insertLetter('i')
    insertLetter('\'')
    insertLetter('\'')
    insertLetter('n')
    insertLetter('i')
    expect(getPreeditSegments()).toEqual([{ w: '', pinyins: ['i\'\'ni'] }])
  })

  it('deleteLetter', () => {
    insertLetter('n')
    expect(getPreeditSegments()).toEqual([{ w: '', pinyins: ['n'] }])
    expect(getCursorPosition()).toEqual(1)
    insertLetter('i')
    deleteLetter()
    expect(getPreeditSegments()).toEqual([{ w: '', pinyins: ['n'] }])
    expect(getCursorPosition()).toEqual(1)
    deleteLetter()
    expect(getPreeditSegments()).toEqual([{ w: '', pinyins: [''] }])
    expect(getCursorPosition()).toEqual(0)
  })

  it('moveCursorPositionLeft', () => {
    moveCursorPositionLeft()
    expect(getCursorPosition()).toEqual(0)
    insertLetter('n')
    insertLetter('i')
    moveCursorPositionLeft()
    expect(getCursorPosition()).toEqual(1)
  })

  it('moveCursorPositionRight', () => {
    moveCursorPositionRight()
    expect(getCursorPosition()).toEqual(0)
    insertLetter('n')
    insertLetter('i')
    moveCursorPositionRight()
    expect(getCursorPosition()).toEqual(2)
  })

  it('moveCursorPositionEnd', () => {
    insertLetter('n')
    insertLetter('i')
    moveCursorPositionLeft()
    moveCursorPositionLeft()
    moveCursorPositionEnd()
    expect(getCursorPosition()).toEqual(2)
  })

  it('splitPreeditSegmentsByCursorPosition', () => {
    insertLetter('n')
    expect(splitPreeditSegmentsByCursorPosition()).toEqual({ front: 'n', behind: '' })
    insertLetter('i')
    expect(splitPreeditSegmentsByCursorPosition()).toEqual({ front: 'ni', behind: '' })
    moveCursorPositionLeft()
    expect(splitPreeditSegmentsByCursorPosition()).toEqual({ front: 'n', behind: 'i' })
    moveCursorPositionLeft()
    expect(splitPreeditSegmentsByCursorPosition()).toEqual({ front: '', behind: 'ni' })
    clearPreeditSegments()
    setupPreeditSegments([
      {
        w: '',
        pinyins: ['ni'],
      },
      {
        w: '',
        pinyins: ['h'],
      },
    ])
    forceUpdateCursorPosition(3)
    expect(splitPreeditSegmentsByCursorPosition()).toEqual({ front: 'ni\'h', behind: '' })
    clearPreeditSegments()
    setupPreeditSegments([
      {
        w: '',
        pinyins: ['wo'],
      },
      {
        w: '',
        pinyins: ['wo'],
      },
      {
        w: '',
        pinyins: ['wo'],
      },
    ])
    forceUpdateCursorPosition(6)
    expect(splitPreeditSegmentsByCursorPosition()).toEqual({ front: 'wo\'wo\'wo', behind: '' })
  })

  it('replaceSegments', () => {
    insertLetter('n')
    insertLetter('i')
    replaceSegments({ f: 1, w: '你', matchLength: 2 })
    expect(getPreeditSegments()).toEqual([{ w: '你', pinyins: ['ni'] }])
    clearPreeditSegments()
    setupPreeditSegments([
      {
        w: '',
        pinyins: ['ni'],
      },
      {
        w: '',
        pinyins: ['hao'],
      },
    ])
    replaceSegments({ f: 1, w: '你', matchLength: 2 })
    expect(getPreeditSegments()).toEqual([
      { w: '你', pinyins: ['ni'] },
      { w: '', pinyins: ['hao'] },
    ])
    clearPreeditSegments()
    setupPreeditSegments([
      {
        w: '',
        pinyins: ['ni'],
      },
      {
        w: '',
        pinyins: ['hao'],
      },
    ])
    replaceSegments({ f: 1, w: '你好', matchLength: 5 })
    expect(getPreeditSegments()).toEqual([{ w: '你好', pinyins: ['ni', 'hao'] }])
  })

  it('replace segments with emoji ', () => {
    setupPreeditSegments([
      {
        w: '',
        pinyins: ['xiao'],
      },
      {
        w: '',
        pinyins: ['ku'],
      },
      {
        w: '',
        pinyins: ['le'],
      },
    ])
    forceUpdateCursorPosition(8)
    replaceSegments({ f: 1, w: '😂', matchLength: 6 })
    // 😂le => cursorPosition should be 3
    expect(getCursorPosition()).toBe(3)
  })
})
