import type { Candidate } from '../types'

interface PreeditSegment {
  w?: string
  pinyins: string[]
}

let preeditSegments: PreeditSegment[] = []

let cursorPosition = 0

export function recoverySegments() {
  const newSegs: PreeditSegment[] = []
  preeditSegments.forEach((seg) => {
    if (seg.w) {
      seg.pinyins.forEach((split) => {
        newSegs.push({
          w: '',
          pinyins: [split],
        })
      })
    }
    else {
      newSegs.push({
        w: '',
        pinyins: seg.pinyins,
      })
    }
  })
  preeditSegments = newSegs
  moveCursorPositionEnd()
}

function getWordLength(w: string) {
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-ignore
  const segments = new Intl.Segmenter().segment(w)
  return [...segments].length
}

export function getPreeditSegmentLength(seg: PreeditSegment) {
  return seg.w ? getWordLength(seg.w) : seg.pinyins.join('').length
}

export function getPreeditSegmentsPinyinLength() {
  return preeditSegments.reduce((acc, seg) => {
    acc += seg.pinyins.join('').length
    return acc
  }, 0)
}

export function getPreeditSegmentsLength() {
  return preeditSegments.reduce((acc, seg) => {
    acc += getPreeditSegmentLength(seg)
    return acc
  }, 0)
}

export function getUnconvertedPreeditSegmentText() {
  return preeditSegments.filter(h => !h.w).reduce((text, seg) => {
    text += seg.pinyins.join('')
    return text
  }, '')
}

export function hasConvertedPreeditSegment() {
  return !!preeditSegments.find(seg => seg.w)
}

export function getConvertedSegments() {
  return preeditSegments.filter(h => h.w)
}

export function replaceSegments(cand: Candidate) {
  const targetMatchLength = cand.matchLength
  let j = -1
  let i = 0
  let length = 0
  let startPos = 0
  let endPos = 0
  for (; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    const segLength = getPreeditSegmentLength(seg)
    endPos += segLength
    if (!seg.w) {
      if (j === -1) {
        j = i
      }
      length += segLength
      if (targetMatchLength === length) {
        break
      }
    }
    else {
      startPos += segLength
    }
  }
  if (j === -1) {
    return preeditSegments
  }
  const pinyins = preeditSegments
    .slice(j, i + 1)
    .reduce((acc, seg) => {
      acc.push(...seg.pinyins)
      return acc
    }, [] as string[])
  preeditSegments.splice(j, i - j + 1, { w: cand.w, pinyins })
  if (cursorPosition >= startPos && cursorPosition <= endPos) {
    moveCursorPositionEnd()
  }
  else {
    cursorPosition -= (targetMatchLength - getWordLength(cand.w))
  }
}

function findSegmentPinyinAtCursorPosition(callback: (seg: PreeditSegment, i: number, j: number, pos: number) => void) {
  let pos = 0
  let updated = false
  for (let i = 0; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (seg.w) {
      pos += getWordLength(seg.w)
      continue
    }
    for (let j = 0; j < seg.pinyins.length; j++) {
      const nextPos = pos + seg.pinyins[j].length
      if (nextPos >= cursorPosition) {
        callback(seg, i, j, pos)
        // update cursor position
        updated = true
        break
      }
      pos = nextPos
    }
    if (updated) {
      break
    }
  }
}

export function insertLetter(c: string) {
  if (preeditSegments.length <= 0) {
    preeditSegments = [
      {
        w: '',
        pinyins: [c],
      },
    ]
    cursorPosition++
    return
  }
  findSegmentPinyinAtCursorPosition((seg, _, j, pos) => {
    seg.pinyins[j] = seg.pinyins[j].slice(0, cursorPosition - pos) + c + seg.pinyins[j].slice(cursorPosition - pos)
    cursorPosition++
  })
}

export function deleteLetter() {
  findSegmentPinyinAtCursorPosition((seg, _, j, pos) => {
    seg.pinyins[j] = seg.pinyins[j].slice(0, cursorPosition - pos - 1) + seg.pinyins[j].slice(cursorPosition - pos)
    cursorPosition--
  })
}

export function moveCursorPositionLeft() {
  let limit = 0
  for (let i = 0; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (seg.w) {
      limit += getWordLength(seg.w)
    }
    else {
      break
    }
  }
  cursorPosition = cursorPosition - 1 <= limit ? limit : cursorPosition - 1
}

export function moveCursorPositionRight() {
  const limit = getPreeditSegmentsLength()
  cursorPosition = cursorPosition + 1 <= limit ? cursorPosition + 1 : limit
}

export function moveCursorPositionEnd() {
  cursorPosition = getPreeditSegmentsLength()
}

function joinPreedit(s: string, joined: string) {
  if (s.endsWith('\'') || joined.startsWith('\'')) {
    s += joined
  }
  else if (!s) {
    s = joined
  }
  else {
    s += `'${joined}`
  }
  return s
}

export function splitPreeditSegmentsByCursorPosition() {
  let converted = ''
  let front = ''
  let behind = ''
  let pos = 0
  for (let i = 0; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (seg.w) {
      converted += seg.w
      pos += getWordLength(seg.w)
    }
    else {
      const splits = seg.pinyins
      for (let j = 0; j < splits.length; j++) {
        const split = splits[j]
        const nextPos = pos + split.length
        if (nextPos > cursorPosition) {
          if (!behind) {
            front = joinPreedit(front, split.slice(0, cursorPosition - pos))
            behind = joinPreedit(behind, split.slice(cursorPosition - pos))
          }
          else {
            behind = joinPreedit(behind, split)
          }
        }
        else {
          front = joinPreedit(front, split)
        }
        pos = nextPos
      }
    }
  }

  return { front: `${converted}${front}`, behind }
}

// composite segments to html
export function compositePreedit() {
  const { front, behind } = splitPreeditSegmentsByCursorPosition()
  return `<span>${front}</span><span class="sime-cursor"></span><span>${behind}</span>`
}

export function clearPreeditSegments() {
  preeditSegments.length = 0
  cursorPosition = 0
}

export function getPreeditSegments() {
  return preeditSegments
}

export function getCursorPosition() {
  return cursorPosition
}

export function updatePreeditSegments(segments: PreeditSegment[]) {
  let i = 0
  for (; i < preeditSegments.length; i++) {
    if (!preeditSegments[i].w) {
      break
    }
  }
  preeditSegments.splice(i, preeditSegments.length - i)
  preeditSegments.push(...segments)
}

export function createPreeditSegment(pinyin: string) {
  return {
    w: '',
    pinyins: [pinyin],
  }
}

export function preeditSegments2Text() {
  return preeditSegments.reduce((text, seg) => {
    text += seg.w ? seg.w : seg.pinyins.join('')
    return text
  }, '')
}

// for testing
export function setupPreeditSegments(segments: PreeditSegment[], cursorPos = 0) {
  preeditSegments = segments
  cursorPosition = cursorPos
}

// for testing
export function forceUpdateCursorPosition(cursorPos: number) {
  cursorPosition = cursorPos
}
