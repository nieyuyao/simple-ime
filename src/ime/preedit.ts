export function insertLetterAtCursorPosition(
  text: string,
  letter: string,
  cursorPosition: number,
): string {
  cursorPosition = Math.max(0, cursorPosition)
  const textFront = text.substring(0, cursorPosition) + letter
  const textBehind = text.substring(cursorPosition)
  let html = `<span>${textFront}</span><span class="sime-cursor"></span>`
  html = textBehind ? `${html}<span>${textBehind}</span>` : html
  return html.trim()
}

export function deleteLetterAtCursorPosition(text: string, cursorPosition: number): string {
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

export function moveCursorPositionLeft(startPosition: number, cursorPosition: number): number {
  if (cursorPosition - 1 < startPosition) {
    return cursorPosition
  }
  return cursorPosition - 1 <= 0 ? 0 : cursorPosition - 1
}

export function moveCursorPositionRight(text: string, cursorPosition: number): number {
  return cursorPosition + 1 >= text.length ? text.length : cursorPosition + 1
}

export function moveCursorPositionEnd(text: string): number {
  return text.length
}

export function findConvertPinyinByCursorPosition(text: string, startPosition: number, cursorPosition: number): {
  origin: string
  pinyin: string
} {
  const quote = '\''
  let prefixQuotes = 0
  let suffixQuotes = 0
  let pinyin = ''
  for (let i = startPosition; i < text.length; i++) {
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
