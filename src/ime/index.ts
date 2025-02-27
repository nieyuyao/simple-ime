import { version } from '../../package.json'
import { requestCandidates } from '../engine'
import ImeCss from '../styles/index.scss?inline'
import { Candidate } from '../types'
import { hasLatin } from '../utils'
import { createComposition } from '../views/create-composition'
import { createStatusBar } from '../views/create-statusbar'
import { handleBackspace } from './backspace'
import { isEditableElement, updateContent } from './dom'
import { dispatchCompositionEvent, dispatchInputEvent } from './event'
import {
  generateTextByCursorPosition,

  insertLetterAtCursorPosition,
  moveCursorPositionEnd,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  replaceTextAndUpdateCursorPosition,
} from './preedit'

import {
  recoverySegments,
  replaceHistory,
  getConvertedSegments,
  getUnconvertedText,
  segments2PreeditText,
  insertLetter,
} from './segment'
import { handleSpecial } from './special'

export class Ime {
  version = version

  private page = 0

  private candIndex = 0

  private cands: Candidate[] = []

  private convertedText = ''

  private unconvertedTextStartPosition = 0

  private chiMode = false

  private flag = false

  private newIn = document.activeElement || document.body

  private method = 0

  /**
   * punct = 0 => full width punctuation
   * shape = 1 => half width punctuation
   */
  private punct = 0

  /**
   * shape = 0 => full width char
   * shape = 1 => half width char
   */
  private shape = 0

  private isOn = false

  private typeOn = false

  private statusHandle?: ReturnType<typeof createStatusBar>

  private compositionHandle?: ReturnType<typeof createComposition>

  // Cursor position at composition
  private cursorPosition = 0

  private injectedStyleEl?: HTMLStyleElement

  private adjustCompositionElTimeoutId = 0

  private compositionElSize = { width: 0, height: 0, x: 0, y: 0 }

  private pressedKeys: string[] = []

  private injectCSS() {
    const style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.id = 'ime-style'
    style.textContent = ImeCss
    document.head.append(style)
    this.injectedStyleEl = style
  }

  private bindEvents() {
    this.bindFocusEvent()
    this.bindKeyEvent()
  }

  private bindFocusEvent() {
    window.addEventListener('focusin', this.handleFocusinEvent, { capture: true })
    window.addEventListener('focusout', this.handleFocusoutEvent, { capture: true })
  }

  private bindKeyEvent() {
    window.addEventListener('keydown', this.handleKeyDownEvent, { capture: true })
    window.addEventListener('keypress', this.handleKeyPressEvent, { capture: true })
    window.addEventListener('keyup', this.handleKeyUpEvent, { capture: true })
  }

  private unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDownEvent, { capture: true })
    window.removeEventListener('keypress', this.handleKeyPressEvent, { capture: true })
    window.removeEventListener('keyup', this.handleKeyUpEvent, { capture: true })
    window.removeEventListener('focusin', this.handleFocusinEvent, { capture: true })
    window.removeEventListener('focusout', this.handleFocusoutEvent, { capture: true })
  }

  private handleKeyDownEvent = (e: KeyboardEvent) => {
    const { isOn, newIn } = this
    if (this.pressedKeys.length <= 2) {
      this.pressedKeys.push(e.key)
    }
    if (
        !isOn
        || !newIn
        || !this.chiMode
        || !this.typeOn
    ) {
      return
    }
    if (e.key === 'Backspace') {
      e.preventDefault()
      const text = this.getPreEditText()
      const userInputText = recoverySegments()
      const { html, newCursorPosition } = handleBackspace(text, userInputText, this.cursorPosition)
      this.setPreEditText(html)
      const newText = this.getPreEditText()
      this.cursorPosition = newCursorPosition
      if (!newText) {
        this.hideComposition()
        this.clearCandidate()
        this.cursorPosition = 0
        this.convertedText = ''
        this.unconvertedTextStartPosition = 0
      }
      else if (this.unconvertedTextStartPosition >= 0) {
        this.unconvertedTextStartPosition = 0
        this.fetchCandidate()
        this.convertedText = ''
        dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
      }
      else {
        this.fetchCandidate()
        dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
      }
      this.updateCompositionPosition()
    }
    else if (e.code === 'Escape') {
      e.preventDefault()
      this.setPreEditText('')
      this.cursorPosition = 0
      this.hideComposition()
      this.clearCandidate()
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.candidatePageUp()
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.candidatePageDown()
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.candidatePrev()
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.candidateNext()
    }
    else if (e.key === 'Shift') {
      e.preventDefault()
      this.endComposition()
    }
  }

  private handleKeyPressEvent = (e: KeyboardEvent) => {
    if (!this.isOn || !this.newIn) {
      return
    }
    if ((this.shape === 1 || this.punct === 1) && !this.typeOn) {
      if (this.shape === 1 || /[.,]/.test(e.key)) {
        const converted = handleSpecial(e.key)
        if (converted) {
          this.commitText(converted)
          e.preventDefault()
          return
        }
      }
    }
    if (!this.chiMode) {
      return
    }
    if (/^[a-z']$/.test(e.key)) {
      e.preventDefault()
      if (e.key === '\'' && !this.typeOn) {
        return
      }
      const text = segments2PreeditText()
      const html = insertLetter(text, e.key, this.cursorPosition)
      this.setPreEditText(html)
      this.cursorPosition++
      this.fetchCandidate(this.getPreEditText())
      const newText = segments2PreeditText()
      if (this.typeOn) {
        dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
      }
      else {
        this.showComposition()
        dispatchCompositionEvent(this.newIn, 'compositionstart', newText)
      }
      this.updateCompositionPosition()
    }
    else if (e.key === 'Enter') {
      if (this.typeOn) {
        e.preventDefault()
        this.endComposition()
      }
    }
    else if (/^[1-5]$/.test(e.key)) {
      if (this.typeOn) {
        e.preventDefault()
        this.selectCandidate(+e.key)
      }
    }
    else if (e.key === ' ') {
      if (this.typeOn) {
        e.preventDefault()
        this.selectCandidate((this.candIndex % 5) + 1)
      }
    }
    else if (e.key === '-') {
      e.preventDefault()
      this.candidatePageUp()
    }
    else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      this.candidatePageDown()
    }
    else if (e.key === '<') {
      e.preventDefault()
      this.candidatePrev()
    }
    else if (e.key === '>') {
      e.preventDefault()
      this.candidateNext()
    }
    else if (e.key === '[') {
      e.preventDefault()
      this.moveCursorPositionLeft()
    }
    else if (e.key === ']') {
      e.preventDefault()
      this.moveCursorPositionRight()
    }
    else if (this.typeOn) {
      e.preventDefault()
    }
  }

  private handleKeyUpEvent = (e: KeyboardEvent) => {
    // toggle method when only shift key is pressed
    if (this.pressedKeys.length === 1 && this.pressedKeys[0] === 'Shift') {
      e.preventDefault()
      this.switchMethod()
      this.statusHandle?.toggleMethodIcon()
    }
    this.pressedKeys = []
  }

  private handleFocusinEvent = () => {
    const activeElement = document.activeElement
    if (activeElement && isEditableElement(activeElement)) {
      this.flag = false
      this.newIn = activeElement
      this.updateCompositionPosition()
      this.setPreEditText('')
      this.hideComposition()
      this.clearCandidate()
    }
  }

  private handleFocusoutEvent = () => {
    if (this.flag) {
      this.flag = false
    }
    else {
      this.setPreEditText('')
      this.hideComposition()
      this.clearCandidate()
    }
  }

  private candidatePrev() {
    this.candIndex = this.candIndex - 1 >= 0 ? this.candIndex - 1 : 0
    if (this.candIndex % 5 === 4) {
      this.page = this.page - 1 >= 0 ? this.page - 1 : 0
    }
    this.showCandidates()
  }

  private candidateNext() {
    this.candIndex
      = this.candIndex + 1 <= this.cands.length - 1 ? this.candIndex + 1 : this.cands.length - 1
    if (this.candIndex % 5 === 0) {
      this.page
        = this.page + 1 < this.cands.length / 5
          ? this.page + 1
          : Math.floor(this.cands.length / 5)
    }
    this.showCandidates()
  }

  private candidatePageUp() {
    this.candIndex = this.page - 1 >= 0 ? this.candIndex - 5 : this.candIndex
    this.page = this.page - 1 >= 0 ? this.page - 1 : 0
    this.showCandidates()
  }

  private candidatePageDown() {
    this.candIndex = this.page + 1 < this.cands.length / 5 ? this.candIndex + 5 : this.candIndex
    this.page
      = this.page + 1 < this.cands.length / 5
        ? this.page + 1
        : Math.floor(this.cands.length / 5)
    this.showCandidates()
  }

  private clearCandidate() {
    this.page = 0
    this.candIndex = 0
    this.cands = []
  }

  private commitText(text: string) {
    updateContent(this.newIn, text)
    dispatchInputEvent(this.newIn, 'input')
    this.convertedText = ''
    this.setPreEditText('')
  }

  private endComposition() {
    const text = segments2PreeditText()
    this.commitText(text)
    this.hideComposition()
    this.clearCandidate()
    this.cursorPosition = 0
    this.unconvertedTextStartPosition = 0   
    dispatchCompositionEvent(this.newIn, 'compositionend', text)
    clearTimeout(this.adjustCompositionElTimeoutId)
  }

  private fetchCandidate(text = '') {
    this.clearCandidate()
    text = text ? text : getUnconvertedText()
    const { candidates, segments } = requestCandidates(text)
    this.history = [
      ...getConvertedHistory(this.history),
      ...segments.map(s => ({ text: s }))
    ]
    console.log(text, candidates, segments, '===segments===')
    this.setCandidates(candidates)
    this.showCandidates()
  }

  private getNthCandidate(n: number) {
    return this.cands[5 * this.page + n - 1]
  }

  private highlightCandidate() {
    const simeCndEls = document.querySelectorAll('.sime-cnd')
    simeCndEls.forEach((el, i) => {
      el.classList.remove('highlight')
      if (i === this.candIndex % 5) {
        el.classList.add('highlight')
      }
    })
    const prevCandBtn = document.querySelector('.sime-prev-cand-button')
    const nextCandBtn = document.querySelector('.sime-next-cand-button')
    this.page === 0
      ? prevCandBtn?.classList.add('disabled')
      : prevCandBtn?.classList.remove('disabled')

    5 * (this.page + 1) >= this.cands.length
      ? nextCandBtn?.classList.add('disabled')
      : nextCandBtn?.classList.remove('disabled')
  }

  private nthCandidateExists(n: number) {
    return 5 * this.page + n - 1 < this.cands.length
  }

  private selectCandidate(selection: number) {
    // return
    if (!this.nthCandidateExists(selection)) {
      return
    }
    const cand = this.getNthCandidate(selection)
    replaceHistory(this.history, cand)
    const matchedOriginPinyin = cand.text
    this.convertedText += matchedOriginPinyin
    if (this.history[this.history.length - 1].w) {
      this.endComposition()
    }
    else {
      let { html, cursorPosition } = replaceTextAndUpdateCursorPosition(
        text,
        this.unconvertedTextStartPosition - cand.matchLength,
        cand.matchLength,
        cand.text,
        this.cursorPosition,
      )
      this.setPreEditText(html)
      newText = this.getPreEditText()
      if (!hasLatin(cand.text)) {
        this.cursorPosition = cursorPosition
      }
      else {
        this.cursorPosition = moveCursorPositionEnd(newText)
        if (this.cursorPosition !== cursorPosition) {
          html = generateTextByCursorPosition(text, this.cursorPosition)
          this.setPreEditText(html)
        }
      }
      this.updateCompositionPosition()
      this.fetchCandidate()
      dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
    }
  }

  private setCandidates(candidates: Candidate[]) {
    this.cands = candidates
  }

  private getPreEditText() { 
    return this.preeditEle?.innerText || ''
  }

  private setPreEditText(html: string) {
    if (this.preeditEle) {
      this.preeditEle.innerHTML = html
      return
    }
  }

  private showCandidates() {
    const nodes = document.querySelectorAll('.sime-cnd')
    const len = nodes.length
    const m = (this.page + 1) * len - this.cands.length > 0 ? this.cands.length % len : len
    for (let i = 0; i < m; i++) {
      let str = ''
      str += `${i + 1}. `
      str += this.cands[i + this.page * 5].w
      nodes[i].innerHTML = str
    }
    for (let i = m; i < len; i++) {
      nodes[i].innerHTML = ''
    }
    this.highlightCandidate()
  }

  private showComposition() {
    this.typeOn = true
    const el = document.getElementById('sime-composition')
    if (el) {
      el.style.display = 'block'
    }
  }

  private hideComposition() {
    this.typeOn = false
    const el = document.getElementById('sime-composition')
    if (el) {
      el.style.display = 'none'
    }
  }

  private showStatus() {
    this.statusHandle?.show()
  }

  private hideStatus() {
    this.statusHandle?.hide()
  }

  private switchMethod = () => {
    this.method = (this.method + 1) % 2
    this.chiMode = this.method === 1
    if (!this.chiMode) {
      this.setPreEditText('')
      this.hideComposition()
      this.clearCandidate()
      this.cursorPosition = 0
    }
  }

  private switchShape = () => {
    this.shape = (this.shape + 1) % 2
  }

  private switchPunct = () => {
    this.punct = (this.punct + 1) % 2
  }

  private moveCursorPositionLeft() {
    if (this.cursorPosition - 1 < 0) {
      return
    }
    const text = this.getPreEditText()
    const oldCursorPosition = this.cursorPosition
    this.cursorPosition = moveCursorPositionLeft(this.unconvertedTextStartPosition, oldCursorPosition)
    if (this.cursorPosition === oldCursorPosition) {
      return
    }
    const html = generateTextByCursorPosition(text, this.cursorPosition)
    this.setPreEditText(html)
    this.updateCompositionPosition()
  }

  private moveCursorPositionRight() {
    const text = this.getPreEditText()
    const oldCursorPosition = this.cursorPosition
    this.cursorPosition = moveCursorPositionRight(text, oldCursorPosition)
    if (this.cursorPosition === oldCursorPosition) {
      return
    }
    const html = generateTextByCursorPosition(text, this.cursorPosition)
    this.setPreEditText(html)
    this.updateCompositionPosition()
  }

  private updateCompositionPosition() {
    window.clearTimeout(this.adjustCompositionElTimeoutId)
    if (this.newIn) {
      const el = document.getElementById('sime-composition')
      if (el) {
        const { top, left, height } = this.newIn.getBoundingClientRect()
        const docWidth = document.documentElement.clientWidth
        const docHeight = document.documentElement.clientHeight
        const elWidth = el.clientWidth
        const elHeight = el.clientHeight
        const paddingLeft = 20
        const paddingTop = 20
        let newLeft = Math.max(left, 0) + paddingLeft
        let newTop = top + height + paddingTop
        newLeft = newLeft + elWidth >= docWidth ? Math.max(docWidth - elWidth - paddingLeft) : Math.max(left, 0) + paddingLeft
        newTop = newTop + elHeight >= docHeight ? Math.max(top - paddingTop - elHeight, 0) : newTop
        if (
          this.compositionElSize.width === elWidth
          && this.compositionElSize.height === elHeight
          && this.compositionElSize.x === newLeft
          && this.compositionElSize.y === newTop
        ) {
          return
        }
        el.style.top = `${newTop}px`
        el.style.left = `${newLeft}px`
        this.compositionElSize = { width: elWidth, height: elHeight, x: newLeft, y: newTop }
        this.updateCompositionPosition()
      }
    }
    this.adjustCompositionElTimeoutId = window.setTimeout(() => {
      this.updateCompositionPosition()
    }, 0)
  }

  init() {
    this.statusHandle = createStatusBar(this.switchMethod, this.switchShape, this.switchPunct)
    if (!this.isOn) {
      this.statusHandle.hide()
    }
    this.compositionHandle = createComposition(
      (e, index) => {
        e.preventDefault()
        this.selectCandidate(index + 1)
        this.flag = true
      },
      (e) => {
        e.preventDefault()
        this.candidatePageUp()
      },
      (e) => {
        e.preventDefault()
        this.candidatePageDown()
      },
    )
    this.preeditEle = document.getElementById('sime-preedit')
    this.injectCSS()
    this.bindEvents()
  }

  toggleOnOff() {
    this.isOn = !this.isOn
    this.isOn ? this.turnOn() : this.turnOff()
  }

  turnOn() {
    this.isOn = true
    this.statusHandle?.show()
    this.showStatus()
  }

  turnOff() {
    this.isOn = false
    this.setPreEditText('')
    this.convertedText = ''
    this.unconvertedTextStartPosition = 0
    this.cursorPosition = 0
    this.hideComposition()
    this.clearCandidate()
    this.hideStatus()
    clearTimeout(this.adjustCompositionElTimeoutId)
  }

  dispose() {
    this.statusHandle?.dispose()
    this.compositionHandle?.dispose()
    this.injectedStyleEl?.remove()
    this.unbindEvents()
    clearTimeout(this.adjustCompositionElTimeoutId)
  }
}
