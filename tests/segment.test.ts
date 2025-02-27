import { describe, expect, it, beforeEach } from 'vitest'
import {
  getPreeditSegments,
  insertLetter,
  clearPreeditSegments,
  getCursorPosition,
  deleteLetter,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  moveCursorPositionEnd,
  splitPreeditSegmentsByCursorPosition,
  replaceSegments,
  setupPreeditSegments,
  forceUpdateCursorPosition,
} from '../src/ime/segment'

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
})
