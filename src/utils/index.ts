export function isLatin(code: number) {
  return code < 128
}

export function isChinese(code: number) {
  return code > 128
}

export function hasChinese(str: string) {
  for (let i = 0; i < str.length; i++) {
    if (isChinese(str.charCodeAt(i))) {
      return true
    }
  }
  return false
}

export function hasLatin(str: string) {
  for (let i = 0; i < str.length; i++) {
    if (isLatin(str.charCodeAt(i))) {
      return true
    }
  }
  return false
}

export function lengthChinese(str: string) {
  let length = 0
  for (let i = 0; i < str.length; i++) {
    if (isChinese(str.charCodeAt(i))) {
      length++
    }
    else {
      return length
    }
  }
  return length
}

export function cleanSingleQuotes(text: string): string {
  const reg = /(?<!')'(?!')/g
  return text.replace(reg, '')
}
