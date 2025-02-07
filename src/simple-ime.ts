import { version } from '../package.json'
import { getCandidates } from './engine'
import { handleBackspace } from './handlers/backspace'
import ImeCss from './styles/index.scss?inline'
import {
  findConvertPinyinByCursorPosition,
  generateTextByCursorPosition,
  insertCharAtCursorPosition,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  replaceTextAndUpdateCursorPosition,
} from './utils/cursor'
import { isEditableElement, updateContent } from './utils/dom'
import { dispatchCompositionEvent, dispatchInputEvent } from './utils/event'
import { hasChinese, isLatin, lengthChinese } from './utils/pinyin'
import { createInputView } from './views/create-input-view'
import { createToolbar } from './views/create-toolbar'

export class SimpleIme {
  version = version

  private candPage = 0

  private candIndex = 0

  private cands: string[] = []

  private candsMatchLens: number[] = []

  private candsMathOriginPinyins: string[] = []

  private accMatchedPinyin = ''

  private chiMode = true

  private flag = false

  private method = 1

  private newIn = document.activeElement || document.body

  private punct = 0

  private shape = 0

  private isOn = false

  private typeOn = false

  private originPinyin = ''

  private toolbarHandle?: ReturnType<typeof createToolbar>

  private inputViewHandle?: ReturnType<typeof createInputView>

  private cursorPosition = 0

  private injectedStyleEl?: HTMLStyleElement

  private adjustCompositionElTimeoutId = 0

  private compositionElSize = { width: 0, height: 0 }

  private injectCSS() {
    const style = document.createElement('style')
    style.setAttribute('type', 'text/css')
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
  }

  private unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDownEvent, { capture: true })
    window.removeEventListener('keypress', this.handleKeyPressEvent, { capture: true })
    window.removeEventListener('focusin', this.handleFocusinEvent, { capture: true })
    window.removeEventListener('focusout', this.handleFocusoutEvent, { capture: true })
  }

  private handleKeyDownEvent = (e: KeyboardEvent) => {
    const { isOn, newIn, originPinyin } = this
    if (!isOn || !newIn) {
      return
    }

    if (e.key === 'Shift') {
      e.preventDefault()
      this.switchMethod()
      return
    }

    if (!this.chiMode || !this.typeOn) {
      return
    }
    if (e.key === 'Backspace') {
      e.preventDefault()
      const text = this.getPredictText()
      const includeCh = hasChinese(text)
      const { html, newCursorPosition } = handleBackspace(text, originPinyin, this.cursorPosition)
      if (includeCh) {
        this.cursorPosition = newCursorPosition
        this.setPredictText(html)
        this.fetchCandidateAsync()
        this.accMatchedPinyin = ''
        dispatchCompositionEvent(this.newIn, 'compositionupdate', this.getPredictText())
      }
      else {
        this.cursorPosition = newCursorPosition
        this.setPredictText(html)
        this.originPinyin = this.getPredictText()
        if (text.length === 1) {
          this.hideComposition()
          this.clearCandidate()
          this.cursorPosition = 0
        }
        else {
          this.fetchCandidateAsync()
        }
        dispatchCompositionEvent(this.newIn, 'compositionupdate', this.getPredictText())
      }
      this.updateCompositionPosition()
    }
    else if (e.code === 'Escape') {
      this.setPredictText('')
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
  }

  private handleKeyPressEvent = (e: KeyboardEvent) => {
    if (!this.isOn || !this.newIn || !this.chiMode) {
      return
    }
    if (/^[a-z']$/.test(e.key)) {
      if (e.key === '\'' && !this.typeOn) {
        e.preventDefault()
        return
      }
      e.preventDefault()
      const text = this.getPredictText()
      const html = insertCharAtCursorPosition(text, e.key, this.cursorPosition)
      this.setPredictText(html)
      this.cursorPosition++
      const newText = this.getPredictText()
      const chineseLength = lengthChinese(newText)
      const insertPosition = this.cursorPosition + (this.accMatchedPinyin.length - chineseLength)
      this.originPinyin = this.accMatchedPinyin + newText.substring(chineseLength, insertPosition) + newText.substring(insertPosition)
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
        this.commitText()
        this.hideComposition()
        this.clearCandidate()
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
    else if (e.key === '=') {
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
    else {
      if (this.typeOn) {
        e.preventDefault()
      }
    }
  }

  private handleFocusinEvent = () => {
    const activeElement = document.activeElement
    if (activeElement && isEditableElement(activeElement)) {
      this.flag = false
      this.newIn = activeElement
      this.updateCompositionPosition()
      this.setPredictText('')
      this.hideComposition()
      this.clearCandidate()
    }
  }

  private handleFocusoutEvent = () => {
    if (this.flag) {
      this.flag = false
    }
    else {
      this.setPredictText('')
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

  private commitText() {
    const str = this.getPredictText()
    updateContent(this.newIn, str)
    dispatchInputEvent(this.newIn, 'input')
    this.originPinyin = ''
    this.accMatchedPinyin = ''
    this.setPredictText('')
  }

  private fetchCandidateAsync() {
    this.clearCandidate()
    const text = this.getPredictText()
    const { pinyin, origin } = findConvertPinyinByCursorPosition(text, this.cursorPosition)
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
    return this.candsMathOriginPinyins[5 * this.candPage + n - 1]
  }

  private getPredictText() {
    const el = document.getElementById('sime-predict')
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
    this.toolbarHandle?.hide()
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
    const text = this.getPredictText()
    let chineseLen = 0
    for (let i = 0; i < text.length; i++) {
      if (isLatin(text.charCodeAt(i))) {
        chineseLen = i
        break
      }
    }
    const matchedLength = this.getNthMatchLen(selection)
    const matchedOriginPinyin = this.getNthMatchOriginPinyin(selection)
    this.accMatchedPinyin += matchedOriginPinyin
    let newText = ''
    newText = text.substring(0, chineseLen)
    newText += cand
    newText += text.substring(chineseLen + matchedLength)
    if (text.substring(chineseLen + matchedLength).length === 0) {
      this.setPredictText(newText)
      this.commitText()
      this.hideComposition()
      this.clearCandidate()
      this.cursorPosition = 0
      dispatchCompositionEvent(this.newIn, 'compositionend', newText)
    }
    else {
      const { html, cursorPosition } = replaceTextAndUpdateCursorPosition(
        text,
        chineseLen,
        this.getNthMatchLen(selection),
        cand,
        this.cursorPosition,
      )
      this.cursorPosition = cursorPosition
      this.setPredictText(html)
      newText = this.getPredictText()
      this.fetchCandidateAsync()
      dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
    }
  }

  private setCandidates(candidates: string[]) {
    this.cands = candidates
  }

  private setMatchLens(matchLens: number[], matchOriginPinyins: string[]) {
    this.candsMatchLens = matchLens
    this.candsMathOriginPinyins = matchOriginPinyins
  }

  private setPredictText(html: string) {
    const el = document.getElementById('sime-predict')
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
    this.toolbarHandle?.show()
  }

  private switchMethod = () => {
    this.method = (this.method + 1) % 2
    this.chiMode = this.method === 1
    this.toolbarHandle?.updateMethodIcon()
    if (!this.chiMode) {
      this.setPredictText('')
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
    const text = this.getPredictText()
    const oldCursorPosition = this.cursorPosition
    this.cursorPosition = moveCursorPositionLeft(text, oldCursorPosition)
    if (this.cursorPosition === oldCursorPosition) {
      return
    }
    const html = generateTextByCursorPosition(text, this.cursorPosition)
    this.setPredictText(html)
    this.fetchCandidateAsync()
    this.updateCompositionPosition()
  }

  private moveCursorPositionRight() {
    const text = this.getPredictText()
    const oldCursorPosition = this.cursorPosition
    this.cursorPosition = moveCursorPositionRight(text, oldCursorPosition)
    if (this.cursorPosition === oldCursorPosition) {
      return
    }
    const html = generateTextByCursorPosition(text, this.cursorPosition)
    this.setPredictText(html)
    this.fetchCandidateAsync()
    this.updateCompositionPosition()
  }

  private updateCompositionPosition() {
    window.clearTimeout(this.adjustCompositionElTimeoutId)
    this.adjustCompositionElTimeoutId = window.setTimeout(() => {
      if (this.newIn) {
        const el = document.getElementById('sime-composition')
        if (el) {
          const { top, left, height } = this.newIn.getBoundingClientRect()
          const winWidth = window.innerWidth
          const winHeight = window.innerHeight
          const elWidth = el.clientWidth
          const elHeight = el.clientHeight
          const paddingLeft = 20
          const paddingTop = 20
          if (this.compositionElSize.width === elWidth && this.compositionElSize.height === elHeight) {
            return
          }
          let newLeft = Math.max(left, 0) + paddingLeft
          let newTop = top + height + paddingTop
          newLeft = newLeft + elWidth >= winWidth ? Math.max(winWidth - elWidth - paddingLeft) : Math.max(left, 0) + paddingLeft
          newTop = newTop + elHeight >= winHeight ? Math.max(top - paddingTop - elHeight, 0) : newTop
          el.style.top = `${newTop}px`
          el.style.left = `${newLeft}px`
          this.compositionElSize = { width: elWidth, height: elHeight }
          this.updateCompositionPosition()
        }
      }
    }, 0)
  }

  init() {
    this.toolbarHandle = createToolbar(this.switchMethod, this.switchShape, this.switchPunct)
    if (!this.isOn) {
      this.toolbarHandle.hide()
    }
    this.inputViewHandle = createInputView(
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
    this.toolbarHandle?.show()
    this.showStatus()
  }

  turnOff() {
    this.isOn = false
    this.setPredictText('')
    this.accMatchedPinyin = ''
    this.cursorPosition = 0
    this.hideComposition()
    this.clearCandidate()
    this.hideStatus()
  }

  dispose() {
    this.toolbarHandle?.dispose()
    this.inputViewHandle?.dispose()
    this.injectedStyleEl?.remove()
    this.unbindEvents()
  }
}
