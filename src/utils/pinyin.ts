export function findNextConvertPinyin(pinyin: string): {
  pinyin: string
  suffixQuotes: number
} {
  const reg = /([a-z]+)('*)/
  const matches = pinyin.match(reg)
  if (matches && matches.length >= 3) {
    return { pinyin: matches[1], suffixQuotes: matches[2].length }
  }
  return { pinyin, suffixQuotes: 0 }
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
