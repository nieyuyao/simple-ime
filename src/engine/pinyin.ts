import pinyinText from '../data/pinyin.txt?raw'

export const pinyinSet = new Set<string>(pinyinText.split('\n'))

export function appendAns(ans: string[][], compAns: string[][]) {
  const ansLength = ans.length
  if (ansLength === 0) {
    compAns.forEach(pinyinSeq => ans.push(pinyinSeq))
    return ans
  }
  for (let i = 0; i < ansLength; i++) {
    for (let j = 0; j < compAns.length; j++) {
      ans.push([
        ...ans[i],
        ...compAns[j],
      ])
    }
  }
  ans.splice(0, ansLength)
  return ans
}

export function splitText(text: string): string[][] {
  const ans: string[][] = []
  if (text.includes('\'')) {
    const reg = /[^']+/g
    let res = reg.exec(text)
    let lastIndex = 0
    while (res) {
      const index = res.index
      const compAns = splitText(res[0])
      if (lastIndex !== index) {
        const quotes = text.substring(lastIndex, index)
        compAns.forEach((comp) => {
          comp[0] = quotes + comp[0]
        })
      }
      lastIndex = index + res[0].length
      appendAns(ans, compAns)
      res = reg.exec(text)
    }
    if (lastIndex !== text.length) {
      const tail = text.substring(lastIndex, text.length)
      ans.forEach((comp) => {
        comp[comp.length - 1] += tail
      })
    }
    return ans
  }
  else {
    for (let i = 0; i < text.length; i++) {
      const pre = text.substring(0, i + 1)
      if (pinyinSet.has(pre)) {
        const next = text.substring(i + 1)
        if (next) {
          const appendices = splitText(next)
          appendices.forEach((append) => {
            ans.push([
              pre,
              ...append,
            ])
          })
        }
        else {
          ans.push([pre])
        }
      }
    }
  }
  return ans
}

export function cut(text: string) {
  const splits = splitText(text)
  if (splits.length > 0) {
    return splits
  }
  const reg = /[^']+/g
  let res = reg.exec(text)
  let lastIndex = 0
  const acc: string[] = []
  const segs: string[] = []
  while (res) {
    const index = res.index
    let quotes = ''
    if (lastIndex !== index) {
      quotes = text.substring(lastIndex, index)
    }
    lastIndex = index + res[0].length
    const subText = res![0]
    for (let i = 0; i < subText.length; i++) {
      let j = Math.min(i + 4, subText.length - 1)
      for (; j >= i + 1; j--) {
        const seg = subText.substring(i, j + 1)
        if (pinyinSet.has(seg)) {
          segs.push(seg)
          i = j + 1
          break
        }
      }
      if (j === i) {
        segs.push(subText.charAt(i))
      } else {
        i--
      }
    }
    segs[0] = quotes + segs[0]
    acc.push(...segs)
    segs.length = 0
    res = reg.exec(text)
  }

  if (lastIndex !== text.length) {
    acc[acc.length - 1] += text.substring(lastIndex, text.length)
  }

  return [acc]
}
