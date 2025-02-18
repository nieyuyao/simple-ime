import { expect, it } from 'vitest'
import { handleBackspace } from '../src/ime/backspace'

it('handleBackspace', () => {
  expect(handleBackspace('nihao', 'nihao', 2)).toEqual({ html: '<span>n</span><span class="sime-cursor"></span><span>hao</span>', newCursorPosition: 1 })
  expect(handleBackspace('你hao', 'nihao', 1)).toEqual({ html: '<span>ni</span><span class="sime-cursor"></span><span>hao</span>', newCursorPosition: 2 })
  expect(handleBackspace('你hao', 'nihao', 4)).toEqual({ html: '<span>nihao</span><span class="sime-cursor"></span>', newCursorPosition: 5 })
  expect(handleBackspace('你好de', 'ni\'hao\'de', 2)).toEqual({ html: '<span>ni\'hao\'</span><span class="sime-cursor"></span><span>de</span>', newCursorPosition: 7 })
  expect(handleBackspace('nihao', 'nihao', 0)).toEqual({ html: '<span class="sime-cursor"></span><span>nihao</span>', newCursorPosition: 0 })
  expect(handleBackspace('你h', 'ni\'h', 2)).toEqual({ html: '<span>ni\'h</span><span class="sime-cursor"></span>', newCursorPosition: 4 })
})
