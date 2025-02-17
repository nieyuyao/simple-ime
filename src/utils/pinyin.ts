import { dict, trie } from '../engine'

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

function joinSegments(segments: string[]) {
  let joined = ''
  segments.forEach((seg) => {
    if (joined.endsWith('\'') && seg.startsWith('\'')) {
      joined += seg.substring(1)
    }
    else if (joined.endsWith('\'') || seg.startsWith('\'')) {
      joined += seg
    }
    else {
      joined += joined ? `'${seg}` : seg
    }
  })
  return joined
}

/**
 * Segment whole pinyin
 * @example nihaode => nihao'de
 */
export function segmentPinyinByTire(pinyin: string): string {
  return pinyin.replace(/[^']+/g, (matched) => {
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
    return segments.length <= 0 ? matched : joinSegments(segments)
  })
}

const pinyinFrequencyDict = Object.keys(dict).reduce((acc, pinyin) => {
  const phrases = dict[pinyin]
  const reg = /(\D+)(\d+)/g
  let res = reg.exec(phrases)
  let freq = 0
  while (res && res.length >= 3) {
    freq = Math.max(+res[2], freq)
    res = reg.exec(phrases)
  }
  acc[pinyin] = freq
  return acc
}, {} as Record<string, number>)

export function segmentPinyinByDict(pinyin: string): string {
  return pinyin.replace(/[^']+/g, (matched) => {
    const segments: string[] = []
    let i = 0
    let segment = ''
    let f = 0
    while (i < matched.length) {
      const letter = matched.charAt(i)
      const next = segment + letter
      const nf = pinyinFrequencyDict[next] ?? 0
      if (nf > f) {
        segment = next
      }
      else if (segments[segments.length - 1] && pinyinFrequencyDict[segments[segments.length - 1] + next] > nf) {
        segment = segments.pop()!
        segment += next
      }
      else if (pinyinFrequencyDict[next]) {
        segment = next
      }
      else {
        segments.push(segment)
        segment = letter
      }
      f = nf
      if (i === matched.length - 1) {
        segments.push(segment)
      }
      i++
    }
    return segments.length <= 0 ? matched : joinSegments(segments)
  })
}
