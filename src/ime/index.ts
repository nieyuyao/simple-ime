import type { Candidate } from '../types'
import { version } from '../../package.json'
import { requestCandidates } from '../engine'
import ImeCss from '../styles/index.scss?inline'
import { createComposition } from '../views/create-composition'
import { createStatusBar } from '../views/create-statusbar'
import { isEditableElement, updateContent } from './dom'
import { dispatchCompositionEvent, dispatchInputEvent } from './event'
import {
  clearPreeditSegments,
  compositePreedit,
  createPreeditSegment,
  deleteLetter,
  getPreeditSegments,
  getPreeditSegmentsPinyinLength,
  getUnconvertedPreeditSegmentText,
  hasConvertedPreeditSegment,
  insertLetter,
  moveCursorPositionEnd,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  preeditSegments2Text,
  recoverySegments,
  replaceSegments,
  updatePreeditSegments,
} from './segment'
import { handleSpecial } from './special'

export class Ime {
  version = version

  private page = 0

  private candIndex = 0

  private cands: Candidate[] = []

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

  private injectedStyleEl?: HTMLStyleElement

  private adjustCompositionElTimeoutId = 0

  private compositionElSize = { width: 0, height: 0, x: 0, y: 0 }

  private pressedKeys: string[] = []

  private preeditEle: HTMLElement | null

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
      if (hasConvertedPreeditSegment()) {
        recoverySegments()
        moveCursorPositionEnd()
        this.setPreEditText(compositePreedit())
        this.fetchCandidate()
        dispatchCompositionEvent(this.newIn, 'compositionupdate', preeditSegments2Text())
      }
      else {
        deleteLetter()
        if (preeditSegments2Text().length <= 0) {
          this.endComposition()
          return
        }
        this.setPreEditText(compositePreedit())
        this.fetchCandidate()
        dispatchCompositionEvent(this.newIn, 'compositionupdate', preeditSegments2Text())
      }
      this.updateCompositionPosition()
    }
    else if (e.code === 'Escape') {
      e.preventDefault()
      this.setPreEditText('')
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
      if (getPreeditSegmentsPinyinLength() >= 32) {
        return
      }
      insertLetter(e.key)
      const html = compositePreedit()
      this.setPreEditText(html)
      this.fetchCandidate()
      if (this.typeOn) {
        dispatchCompositionEvent(this.newIn, 'compositionupdate', preeditSegments2Text())
      }
      else {
        this.showComposition()
        dispatchCompositionEvent(this.newIn, 'compositionstart', preeditSegments2Text())
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
      this.moveCursorLeft()
    }
    else if (e.key === ']') {
      e.preventDefault()
      this.moveCursorRight()
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
      clearPreeditSegments()
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
      clearPreeditSegments()
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
    this.setPreEditText('')
  }

  private endComposition() {
    const text = preeditSegments2Text()
    this.commitText(text)
    this.hideComposition()
    this.clearCandidate()
    clearPreeditSegments()
    dispatchCompositionEvent(this.newIn, 'compositionend', text)
    clearTimeout(this.adjustCompositionElTimeoutId)
  }

  private fetchCandidate() {
    this.clearCandidate()
    const text = getUnconvertedPreeditSegmentText()
    const { candidates, segments } = requestCandidates(text, 0b0001)
    updatePreeditSegments(segments.map(seg => createPreeditSegment(seg)))
    this.setCandidates(candidates)
    this.showCandidates()
    console.log(text, candidates, segments, getPreeditSegments())
    this.setPreEditText(compositePreedit())
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
    if (!this.nthCandidateExists(selection)) {
      return
    }
    const cand = this.getNthCandidate(selection)
    replaceSegments(cand)
    if (getUnconvertedPreeditSegmentText().length <= 0) {
      this.endComposition()
    }
    else {
      const html = compositePreedit()
      this.setPreEditText(html)
      this.fetchCandidate()
      dispatchCompositionEvent(this.newIn, 'compositionupdate', preeditSegments2Text())
    }
  }

  private setCandidates(candidates: Candidate[]) {
    this.cands = candidates
  }

  private setPreEditText(html: string) {
    if (this.preeditEle) {
      this.preeditEle.innerHTML = html
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
    }
  }

  private switchShape = () => {
    this.shape = (this.shape + 1) % 2
  }

  private switchPunct = () => {
    this.punct = (this.punct + 1) % 2
  }

  private moveCursorLeft() {
    moveCursorPositionLeft()
    const html = compositePreedit()
    this.setPreEditText(html)
    this.updateCompositionPosition()
  }

  private moveCursorRight() {
    moveCursorPositionRight()
    const html = compositePreedit()
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
