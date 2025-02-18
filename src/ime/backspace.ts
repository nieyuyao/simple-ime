import { hasChinese, isLatin } from '../utils'
import { deleteLetterAtCursorPosition, replaceTextAndUpdateCursorPosition } from './predict'

export function handleBackspace(text: string, originPinyin: string, cursorPosition: number) {
  if (hasChinese(text)) {
    let chineseLen = 0
    for (let i = 0; i < text.length; i++) {
      if (isLatin(text.charCodeAt(i))) {
        chineseLen = i
        break
      }
    }
    const { html, cursorPosition: newCursorPosition } = replaceTextAndUpdateCursorPosition(
      text,
      0,
      chineseLen,
      originPinyin.substring(0, originPinyin.length - (text.length - chineseLen)),
      cursorPosition,
    )
    return { html, newCursorPosition }
  }
  else {
    const html = deleteLetterAtCursorPosition(text, cursorPosition)
    return { html, newCursorPosition: Math.max(0, cursorPosition - 1) }
  }
}
