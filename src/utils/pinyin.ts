import { trie } from '../engine'

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

/**
 * Segment whole pinyin
 * @example nihaode => nihao'de
 */
export function segmentPinyin(pinyin: string): string {
  return pinyin.replace(/[^']+/, (matched) => {
    const segments: string[] = []
    let remain = matched
    while (remain) {
      const length = remain.length
      for (let i = length - 1; i >= 0; i--) {
        const sub = remain.substring(0, i + 1)
        if (trie.isWord(sub)) {
          segments.push(sub)
          remain = remain.substring(i + 1)
          break
        }
        else if (i === 0) {
          segments.push(sub)
          remain = remain.substring(1)
        }
      }
    }
    return segments.length <= 0 ? matched : segments.join('\'')
  })
}
