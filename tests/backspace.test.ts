import { expect, it } from 'vitest'
import { handleBackspace } from '../src/handlers/backspace'

it('handleBackspace', () => {
  expect(handleBackspace('nihao', 'nihao', 2)).toEqual({ html: '<span>n</span><span class="sime-cursor"></span><span>hao</span>', newCursorPosition: 1 })
  expect(handleBackspace('你hao', 'nihao', 1)).toEqual({ html: '<span>ni</span><span class="sime-cursor"></span><span>hao</span>', newCursorPosition: 2 })
  expect(handleBackspace('你hao', 'nihao', 4)).toEqual({ html: '<span>nihao</span><span class="sime-cursor"></span>', newCursorPosition: 5 })
})
