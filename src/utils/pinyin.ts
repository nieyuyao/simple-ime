export function findNextConvertPinyin(pinyin: string): {
  pinyin: string
  quotes: number
} {
  const reg = /([a-z]+)('*)/
  const matches = pinyin.match(reg)
  if (matches && matches.length >= 3) {
    return { pinyin: matches[1], quotes: matches[2].length }
  }
  return { pinyin, quotes: 0 }
}

export function isLatin(code: number) {
  return code < 128
}

export function isChinese(code: number) {
  return code > 128
}

export function hasChinese(str: string) {
  for (let i = 0; i < str.length; i++) {
    if (!isLatin(str.charCodeAt(i))) {
      return true
    }
  }
  return false
}
