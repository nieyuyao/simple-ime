import { isChinese } from './pinyin'

export function insertCharAtCursorPosition(
  text: string,
  char: string,
  cursorPosition: number,
): string {
  cursorPosition = Math.max(0, cursorPosition)
  const textFront = text.substring(0, cursorPosition) + char
  const textBehind = text.substring(cursorPosition)
  let html = `<span>${textFront}</span><span class="sime-cursor"></span>`
  html = textBehind ? `${html}<span>${textBehind}</span>` : html
  return html.trim()
}

export function deleteCharAtCursorPosition(text: string, cursorPosition: number): string {
  if (!text) {
    return '<span class="sime-cursor"></span>'
  }
  cursorPosition = Math.max(0, cursorPosition)
  const textFront = text.substring(0, cursorPosition - 1)
  const textBehind = text.substring(cursorPosition)
  let html = ''
  if (textFront) {
    html += `<span>${textFront}</span>`
  }
  html += '<span class="sime-cursor"></span>'
  if (textBehind) {
    html += `<span>${textBehind}</span>`
  }
  return html.trim()
}

export function generateTextByCursorPosition(text: string, cursorPosition: number): string {
  if (!text) {
    return '<span class="sime-cursor"></span>'
  }
  cursorPosition = Math.max(0, cursorPosition)
  const textFront = text.substring(0, cursorPosition)
  const textBehind = text.substring(cursorPosition)
  let html = ''
  if (textFront) {
    html += `<span>${textFront}</span>`
  }
  html += '<span class="sime-cursor"></span>'
  if (textBehind) {
    html += `<span>${textBehind}</span>`
  }
  return html.trim()
}

export function replaceTextAndUpdateCursorPosition(
  text: string,
  replacedPosition: number,
  replaceLength: number,
  replacedText: string,
  curPosition: number,
): { cursorPosition: number, html: string } {
  if (!text) {
    return { html: '<span class="sime-cursor"></span>', cursorPosition: 0 }
  }
  const front = text.substring(0, replacedPosition)
  const newText = front + replacedText + text.substring(replacedPosition + replaceLength)
  let newCursorPosition = curPosition - replaceLength + replacedText.length
  if (replacedPosition + replaceLength - 1 >= curPosition) {
    newCursorPosition = front.length + replacedText.length
  }
  return {
    html: generateTextByCursorPosition(newText, newCursorPosition),
    cursorPosition: newCursorPosition,
  }
}

export function moveCursorPositionLeft(text: string, cursorPosition: number): number {
  if (cursorPosition - 1 < 0) {
    return 0
  }
  if (isChinese(text.charCodeAt(cursorPosition - 1))) {
    return cursorPosition
  }
  return cursorPosition - 1
}

export function moveCursorPositionRight(text: string, cursorPosition: number): number {
  if (cursorPosition >= text.length) {
    return cursorPosition
  }
  return cursorPosition + 1
}

export function findConvertPinyinByCursorPosition(text: string, cursorPosition: number): {
  origin: string
  pinyin: string
} {
  let lastChineseIdx = -1
  for (let i = 0; i < text.length; i++) {
    if (isChinese(text.charCodeAt(i))) {
      lastChineseIdx++
    }
    else {
      break
    }
  }
  const quote = '\''
  let prefixQuotes = 0
  let suffixQuotes = 0
  let pinyin = ''
  for (let i = lastChineseIdx + 1; i < text.length; i++) {
    if (i === cursorPosition && pinyin) {
      break
    }
    const c = text.charAt(i)
    if (c !== '\'') {
      if (suffixQuotes) {
        break
      }
      pinyin += c
    }
    else if (pinyin) {
      suffixQuotes++
    }
    else {
      prefixQuotes++
    }
  }
  return { origin: `${quote.repeat(prefixQuotes)}${pinyin}${quote.repeat(suffixQuotes)}`, pinyin }
}
