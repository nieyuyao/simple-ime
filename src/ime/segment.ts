import { Candidate } from "../types"

interface PreeditSegment {
  w?: string
  pinyins: string[]
}

let preeditSegments: PreeditSegment[] = []

let cursorPosition = 0

export function recoverySegments() {
  const newSegs: PreeditSegment[] = [] = []
  preeditSegments.forEach(seg => {
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
        pinyins: seg.pinyins
      })
    }
  })
  preeditSegments = newSegs
  moveCursorPositionEnd()
}

export function getPreeditSegmentLength(seg: PreeditSegment) {
  return seg.w ? seg.w.length : seg.pinyins.join('').length
}

export function getPreeditSegmentsLength() {
  return preeditSegments.reduce((acc, seg) => {
    acc += getPreeditSegmentLength(seg)
    return acc
  }, 0)
}

export function getUnconvertedText() {
  return preeditSegments.filter(h => !h.w).reduce((text, seg) => {
    text += seg.pinyins.join('')
    return text
  }, '')
}

export function getConvertedSegments() {
  return preeditSegments.filter(h => h.w)
}

export function replaceSegments(cand: Candidate) {
  const targetMatchLength = cand.matchLength
  let j = -1
  let i = 0
  let length = 0
  for (; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (!seg.w) {
      if (j === -1) {
        j = i
      }
      length += getPreeditSegmentLength(seg)
      if (targetMatchLength === length) {
        break
      }
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
  preeditSegments.splice(j, i + 1, { w: cand.w, pinyins })
}

export function insertLetter(c: string)  {
  if (preeditSegments.length <= 0) {
    preeditSegments = [
      {
        w: '',
        pinyins: [c]
      }
    ]
    cursorPosition++
    return
  }
  let pos = 0
  let updated = false
  for (let i = 0; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (seg.w) {
      pos += seg.w.length
      continue
    }
    for (let j = 0; j < seg.pinyins.length; j++) {
      const nextPos = pos + seg.pinyins[j].length
      if (nextPos >= cursorPosition) {
        seg.pinyins[j] = seg.pinyins[j].slice(0, cursorPosition - pos) + c + seg.pinyins[j].slice(cursorPosition - pos)
        // update cursor position
        cursorPosition++
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

export function deleteLetter()  {
  let pos = 0
  let updated = false
  for (let i = 0; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (seg.w) {
      pos += seg.w.length
      continue
    }
    for (let j = 0; j < seg.pinyins.length; j++) {
      const nextPos = pos + seg.pinyins[j].length
      if (nextPos >= cursorPosition) {
        seg.pinyins[j] = seg.pinyins[j].slice(0, cursorPosition - pos - 1) + seg.pinyins[j].slice(cursorPosition - pos)
        // update cursor position
        cursorPosition--
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

export function moveCursorPositionLeft() {
  let limit = 0
  for (let i = 0; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (seg.w) {
      limit += seg.w.length
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

const joinPreedit = (s: string, joined: string, isEnd = false) => {
  if (s.endsWith('\'') || joined.startsWith('\'')) {
    s += joined
  }
  s += isEnd ? joined : `${joined}'`
  return s
}

export function splitPreeditSegmentsByCursorPosition() {
  let front = ''
  let behind = ''
  let pos = 0
  for (let i = 0; i < preeditSegments.length; i++) {
    const seg = preeditSegments[i]
    if (seg.w) {
      front += seg.w
      pos += seg.w.length
    }
    else {
      const splits = seg.pinyins
      for (let j = 0; j < splits.length; j++) {
        const isEnd = i === preeditSegments.length - 1 && j === splits.length - 1
        const split = splits[j]
        const nextPos = pos + split.length
        if (nextPos > cursorPosition) {
          if (!behind) {
            front = joinPreedit(front, split.slice(0, cursorPosition - pos), isEnd)
            behind = joinPreedit(behind, split.slice(cursorPosition - pos), isEnd)
          }
          else {
            behind = joinPreedit(behind, split, isEnd)
          }
        } else {
          front = joinPreedit(front, split, isEnd)
        }
        pos = nextPos
      }
    }
  }

  return { front, behind }
}

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

export function setupPreeditSegments(segments: PreeditSegment[], cursorPos = 0) {
  preeditSegments = segments
  cursorPosition = cursorPos
}

export function forceUpdateCursorPosition(cursorPos: number) {
  cursorPosition = cursorPos
}