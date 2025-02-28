import { version } from '../../package.json'
import { getCandidates } from '../engine'
import ImeCss from '../styles/index.scss?inline'
import { hasLatin } from '../utils'
import { createComposition } from '../views/create-composition'
import { createStatusBar } from '../views/create-statusbar'
import { handleBackspace } from './backspace'
import { isEditableElement, updateContent } from './dom'
import { dispatchCompositionEvent, dispatchInputEvent } from './event'
import {
  findConvertPinyinByCursorPosition,
  generateTextByCursorPosition,
  insertLetterAtCursorPosition,
  moveCursorPositionEnd,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  replaceTextAndUpdateCursorPosition,
} from './preedit'
import { handleSpecial } from './special'

export class Ime {
  version = version

  private candPage = 0

  private candIndex = 0

  private cands: string[] = []

  private candsMatchLens: number[] = []

  private candsMatchOriginPinyins: string[] = []

  private convertedPinyin = ''

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

  private originPinyin = ''

  private statusHandle?: ReturnType<typeof createStatusBar>

  private compositionHandle?: ReturnType<typeof createComposition>

  // Cursor position at composition
  private cursorPosition = 0

  private injectedStyleEl?: HTMLStyleElement

  private adjustCompositionElTimeoutId = 0

  private compositionElSize = { width: 0, height: 0, x: 0, y: 0 }

  private pressedKeys: string[] = []

  private unconvertedPinyinStartPosition = 0

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
    const { isOn, newIn, originPinyin } = this
    if (this.pressedKeys.length <= 2) {
      this.pressedKeys.push(e.key)
    }
    if (!isOn || !newIn) {
      return
    }
    if (!this.chiMode || !this.typeOn) {
      return
    }
    if (e.key === 'Backspace') {
      e.preventDefault()
      const text = this.getPreEditText()
      const { html, newCursorPosition } = handleBackspace(text, originPinyin, this.cursorPosition)
      this.setPreEditText(html)
      const newText = this.getPreEditText()
      this.cursorPosition = newCursorPosition
      if (!newText) {
        this.hideComposition()
        this.clearCandidate()
        this.originPinyin = ''
        this.cursorPosition = 0
        this.convertedPinyin = ''
        this.unconvertedPinyinStartPosition = 0
      }
      else if (this.unconvertedPinyinStartPosition >= 0) {
        this.unconvertedPinyinStartPosition = 0
        this.fetchCandidateAsync()
        this.convertedPinyin = ''
        this.originPinyin = newText
        dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
      }
      else {
        this.originPinyin = newText
        this.fetchCandidateAsync()
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
      const text = this.getPreEditText()
      const html = insertLetterAtCursorPosition(text, e.key, this.cursorPosition)
      this.setPreEditText(html)
      this.cursorPosition++
      const newText = this.getPreEditText()
      const unConverted = newText.substring(this.unconvertedPinyinStartPosition)
      this.originPinyin = this.convertedPinyin + unConverted
      this.fetchCandidateAsync()
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
      this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
    }
    this.showCandidates()
  }

  private candidateNext() {
    this.candIndex
      = this.candIndex + 1 <= this.cands.length - 1 ? this.candIndex + 1 : this.cands.length - 1
    if (this.candIndex % 5 === 0) {
      this.candPage
        = this.candPage + 1 < this.cands.length / 5
          ? this.candPage + 1
          : Math.floor(this.cands.length / 5)
    }
    this.showCandidates()
  }

  private candidatePageUp() {
    this.candIndex = this.candPage - 1 >= 0 ? this.candIndex - 5 : this.candIndex
    this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
    this.showCandidates()
  }

  private candidatePageDown() {
    this.candIndex = this.candPage + 1 < this.cands.length / 5 ? this.candIndex + 5 : this.candIndex
    this.candPage
      = this.candPage + 1 < this.cands.length / 5
        ? this.candPage + 1
        : Math.floor(this.cands.length / 5)
    this.showCandidates()
  }

  private clearCandidate() {
    this.candPage = 0
    this.candIndex = 0
    this.cands = []
    this.candsMatchLens = []
  }

  private commitText(text: string) {
    updateContent(this.newIn, text)
    dispatchInputEvent(this.newIn, 'input')
    this.originPinyin = ''
    this.convertedPinyin = ''
    this.setPreEditText('')
  }

  private endComposition() {
    const text = this.getPreEditText()
    this.commitText(text)
    this.hideComposition()
    this.clearCandidate()
    this.cursorPosition = 0
    this.originPinyin = ''
    this.unconvertedPinyinStartPosition = 0
    dispatchCompositionEvent(this.newIn, 'compositionend', text)
    clearTimeout(this.adjustCompositionElTimeoutId)
  }

  private fetchCandidateAsync() {
    this.clearCandidate()
    const text = this.getPreEditText()
    const { pinyin, origin } = findConvertPinyinByCursorPosition(text, this.unconvertedPinyinStartPosition, this.cursorPosition)
    const [candidates, matchLens] = getCandidates(pinyin)
    this.setCandidates(candidates)
    if (origin.length > pinyin.length) {
      matchLens.forEach((_, i) => {
        matchLens[i] = origin.length
      })
    }
    this.setMatchLens(matchLens, Array.from<string>({ length: candidates.length }).fill(origin))
    this.showCandidates()
  }

  private getNthCandidate(n: number) {
    return this.cands[5 * this.candPage + n - 1]
  }

  private getNthMatchLen(n: number) {
    return this.candsMatchLens[5 * this.candPage + n - 1]
  }

  private getNthMatchOriginPinyin(n: number) {
    return this.candsMatchOriginPinyins[5 * this.candPage + n - 1]
  }

  private getPreEditText() {
    const el = document.getElementById('sime-preedit')
    return el?.innerText || ''
  }

  private hideComposition() {
    this.typeOn = false
    const el = document.getElementById('sime-composition')
    if (el) {
      el.style.display = 'none'
    }
  }

  private hideStatus() {
    this.statusHandle?.hide()
  }

  private highBack() {
    const simeCndEls = document.querySelectorAll('.sime-cnd')
    simeCndEls.forEach((el, i) => {
      el.classList.remove('highlight')
      if (i === this.candIndex % 5) {
        el.classList.add('highlight')
      }
    })
    const prevCandBtn = document.querySelector('.sime-prev-cand-button')
    const nextCandBtn = document.querySelector('.sime-next-cand-button')
    this.candPage === 0
      ? prevCandBtn?.classList.add('disabled')
      : prevCandBtn?.classList.remove('disabled')

    5 * (this.candPage + 1) >= this.cands.length
      ? nextCandBtn?.classList.add('disabled')
      : nextCandBtn?.classList.remove('disabled')
  }

  private nthCandidateExists(n: number) {
    return 5 * this.candPage + n - 1 < this.cands.length
  }

  private selectCandidate(selection: number) {
    if (!this.nthCandidateExists(selection)) {
      return
    }
    const cand = this.getNthCandidate(selection)
    const text = this.getPreEditText()
    const matchedLength = this.getNthMatchLen(selection)
    const matchedOriginPinyin = this.getNthMatchOriginPinyin(selection)
    this.convertedPinyin += matchedOriginPinyin
    let newText = ''
    newText = text.substring(0, this.unconvertedPinyinStartPosition)
    newText += cand
    newText += text.substring(this.unconvertedPinyinStartPosition + matchedLength)
    this.unconvertedPinyinStartPosition += cand.length
    if (this.unconvertedPinyinStartPosition >= newText.length) {
      this.setPreEditText(newText)
      this.endComposition()
    }
    else {
      let { html, cursorPosition } = replaceTextAndUpdateCursorPosition(
        text,
        this.unconvertedPinyinStartPosition - cand.length,
        this.getNthMatchLen(selection),
        cand,
        this.cursorPosition,
      )
      this.setPreEditText(html)
      newText = this.getPreEditText()
      if (!hasLatin(cand)) {
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
      this.fetchCandidateAsync()
      dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
    }
  }

  private setCandidates(candidates: string[]) {
    this.cands = candidates
  }

  private setMatchLens(matchLens: number[], matchOriginPinyins: string[]) {
    this.candsMatchLens = matchLens
    this.candsMatchOriginPinyins = matchOriginPinyins
  }

  private setPreEditText(html: string) {
    const el = document.getElementById('sime-preedit')
    if (el) {
      el.innerHTML = html
    }
  }

  private showCandidates() {
    const nodes = document.querySelectorAll('.sime-cnd')
    const len = nodes.length
    const m = (this.candPage + 1) * len - this.cands.length > 0 ? this.cands.length % len : len
    for (let i = 0; i < m; i++) {
      let str = ''
      str += `${i + 1}. `
      str += this.cands[i + this.candPage * 5]
      nodes[i].innerHTML = str
    }
    for (let i = m; i < len; i++) {
      nodes[i].innerHTML = ''
    }
    this.highBack()
  }

  private showComposition() {
    this.typeOn = true
    const el = document.getElementById('sime-composition')
    if (el) {
      el.style.display = 'block'
    }
  }

  private showStatus() {
    this.statusHandle?.show()
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
    this.cursorPosition = moveCursorPositionLeft(this.unconvertedPinyinStartPosition, oldCursorPosition)
    if (this.cursorPosition === oldCursorPosition) {
      return
    }
    const html = generateTextByCursorPosition(text, this.cursorPosition)
    this.setPreEditText(html)
    this.fetchCandidateAsync()
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
    this.fetchCandidateAsync()
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
    this.convertedPinyin = ''
    this.unconvertedPinyinStartPosition = 0
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
