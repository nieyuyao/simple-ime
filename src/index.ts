import type { Options } from './options'
import { version } from '../package.json'
import { getCandidates } from './engine'
import ImeCss from './styles/index.scss?inline'
import {
  deleteCharAtCursorPosition,
  findConvertPinyinByCursorPosition,
  generateTextByCursorPosition,
  insertCharAtCursorPosition,
  moveCursorPositionLeft,
  moveCursorPositionRight,
  replaceTextAndUpdateCursorPosition,
} from './utils/cursor'
import { isEditableElement, updateContent } from './utils/dom'
import { dispatchCompositionEvent, dispatchInputEvent } from './utils/event'
import { findNextConvertPinyin, hasChinese, isLatin } from './utils/pinyin'
import { createInputView } from './views/create-input-view'
import { createToolbar } from './views/create-toolbar'

const defaultOptions: Required<Options> = { singleQuoteDivide: true, cursorMode: false, maxPinyinLength: 128 }

class SimpleIme {
  candPage = 0

  candIndex = 0

  cands: string[] = []

  candsMatchLens: number[] = []

  chiMode = true

  flag = false

  method = 1

  newIn = document.activeElement || document.body

  punct = 0

  shape = 0

  isOn = false

  typeOn = false

  originPinyin = ''

  options: Required<Options>

  version = version

  toolbarHandle: ReturnType<typeof createToolbar>

  cursorPosition = 0

  injectCSS() {
    const style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.textContent = ImeCss
    document.head.append(style)
  }

  bindEvents() {
    this.bindFocusEvent()
    this.bindKeyEvent()
  }

  bindFocusEvent() {
    window.addEventListener(
      'focusin',
      () => {
        const activeElement = document.activeElement
        if (activeElement && isEditableElement(activeElement)) {
          this.flag = false
          this.newIn = activeElement
          const { top, left, height } = this.newIn.getBoundingClientRect()
          const el = document.getElementById('sime-composition')
          if (el) {
            el.style.top = `${top + height}px`
            el.style.left = `${left}px`
          }
          this.setPredictText('')
          this.hideComposition()
          this.clearCandidate()
        }
      },
      { capture: true },
    )
    window.addEventListener(
      'focusout',
      () => {
        if (this.flag) {
          this.flag = false
        }
        else {
          this.setPredictText('')
          this.hideComposition()
          this.clearCandidate()
        }
      },
      { capture: true },
    )
  }

  bindKeyEvent() {
    window.addEventListener(
      'keydown',
      (e) => {
        const { isOn, newIn, originPinyin } = this
        if (!isOn || !newIn) {
          return
        }
        if (this.chiMode && this.typeOn) {
          if (e.key === 'Backspace') {
            e.preventDefault()
            const text = this.getPredictText()
            if (hasChinese(text)) {
              if (this.options.cursorMode) {
                let chineseLen = 0
                for (let i = 0; i < text.length; i++) {
                  if (isLatin(text.charCodeAt(i))) {
                    chineseLen = i
                    break
                  }
                }
                const { html, cursorPosition } = replaceTextAndUpdateCursorPosition(text, 0, chineseLen, originPinyin.substring(0, originPinyin.length - (text.length - chineseLen)), this.cursorPosition)
                this.cursorPosition = cursorPosition
                const el = document.getElementById('sime-predict')
                if (el) {
                  el.innerHTML = html
                }
              }
              else {
                this.setPredictText(originPinyin)
              }
              this.fetchCandidateAsync()
              dispatchCompositionEvent(this.newIn, 'compositionupdate', text)
              return
            }
            else {
              if (this.options.cursorMode) {
                const html = deleteCharAtCursorPosition(text, this.cursorPosition)
                this.cursorPosition--
                const el = document.getElementById('sime-predict')
                if (el) {
                  el.innerHTML = html
                }
              }
              else {
                this.setPredictText(text.substring(0, text.length - 1))
              }
              this.originPinyin = this.getPredictText()
              if (text.length === 1) {
                this.hideComposition()
                this.clearCandidate()
                this.cursorPosition = 0
              }
              else {
                this.fetchCandidateAsync()
              }
            }
            dispatchCompositionEvent(this.newIn, 'compositionupdate', this.getPredictText())
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
      },
      { capture: true },
    )

    window.addEventListener(
      'keypress',
      (e) => {
        if (!this.isOn || !this.newIn) {
          return
        }
        if (this.chiMode) {
          if (/^[a-z']$/.test(e.key)) {
            if (e.key === '\'' && (!this.options.singleQuoteDivide || !this.typeOn)) {
              e.preventDefault()
              return
            }
            e.preventDefault()
            if (this.typeOn) {
              dispatchCompositionEvent(this.newIn, 'compositionupdate', this.getPredictText())
            }
            else {
              this.showComposition()
              dispatchCompositionEvent(this.newIn, 'compositionstart', this.getPredictText())
            }
            const text = this.getPredictText()
            if (this.options.cursorMode) {
              const html = insertCharAtCursorPosition(text, e.key, this.cursorPosition)
              const el = document.getElementById('sime-predict')
              if (el) {
                el.innerHTML = html
              }
            }
            else {
              this.setPredictText(text + e.key)
            }
            this.cursorPosition++
            this.originPinyin += e.key
            this.fetchCandidateAsync()
          }
          else if (e.key === 'Enter') {
            /* Enter键时候直接上屏preedit */
            if (this.typeOn) {
              e.preventDefault()
              this.commitText()
              this.hideComposition()
              this.clearCandidate()
            }
          }
          else if (/^[1-5]$/.test(e.key)) {
            /* 1~5时选择对应的candidate */
            if (this.typeOn) {
              e.preventDefault()
              this.selectCandidate(+e.key)
            }
          }
          else if (e.key === ' ') {
            /* 空格键时选择candIndex对应的candidate */
            if (this.typeOn) {
              e.preventDefault()
              this.selectCandidate((this.candIndex % 5) + 1)
            }
          }
          else if (e.key === '-') {
            /* 输入-往前翻页 */
            e.preventDefault()
            this.candidatePageUp()
          }
          else if (e.key === '=') {
            /* 输入=往后翻页 */
            e.preventDefault()
            this.candidatePageDown()
          }
          else if (e.key === '<') {
            /* <选上一次词 */
            e.preventDefault()
            this.candidatePrev()
          }
          else if (e.key === '>') {
            /* >选下一个词 */
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
      },
      { capture: true },
    )
  }

  candidatePrev() {
    this.candIndex = this.candIndex - 1 >= 0 ? this.candIndex - 1 : 0
    if (this.candIndex % 5 === 4) {
      this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
    }
    this.showCandidates()
  }

  candidateNext() {
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

  candidatePageUp() {
    this.candIndex = this.candPage - 1 >= 0 ? this.candIndex - 5 : this.candIndex
    this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
    this.showCandidates()
  }

  candidatePageDown() {
    this.candIndex = this.candPage + 1 < this.cands.length / 5 ? this.candIndex + 5 : this.candIndex
    this.candPage
      = this.candPage + 1 < this.cands.length / 5
        ? this.candPage + 1
        : Math.floor(this.cands.length / 5)
    this.showCandidates()
  }

  clearCandidate() {
    this.candPage = 0
    this.candIndex = 0
    this.cands = []
    this.candsMatchLens = []
  }

  commitText() {
    const str = this.getPredictText()
    updateContent(this.newIn, str)
    dispatchInputEvent(this.newIn, 'input')
    this.originPinyin = ''
    this.setPredictText('')
  }

  fetchCandidateAsync() {
    this.clearCandidate()
    const text = this.getPredictText()
    const { pinyin, quotes } = this.options.cursorMode ? findConvertPinyinByCursorPosition(text, this.cursorPosition) : findNextConvertPinyin(text)

    const [candidates, matchLens] = getCandidates(pinyin)
    this.setCandidates(candidates)
    if (quotes) {
      matchLens.forEach((_, i) => {
        matchLens[i] += quotes
      })
    }
    this.setMatchLens(matchLens)
    this.showCandidates()
  }

  getNthCandidate(n: number) {
    return this.cands[5 * this.candPage + n - 1]
  }

  getNthMatchLen(n: number) {
    return this.candsMatchLens[5 * this.candPage + n - 1]
  }

  getPredictText() {
    const el = document.getElementById('sime-predict')
    return el?.innerText || ''
  }

  hideComposition() {
    this.typeOn = false
    const el = document.getElementById('sime-composition')
    if (el) {
      el.style.display = 'none'
    }
  }

  hideStatus() {
    this.toolbarHandle.hide()
  }

  highBack() {
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

  init(options?: Options) {
    this.options = { ...defaultOptions, ...options }
    this.toolbarHandle = createToolbar(this.switchMethod, this.switchShape, this.switchMethod)
    if (!this.isOn) {
      this.toolbarHandle.hide()
    }
    createInputView(
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
    if (this.newIn) {
      const { top, left, height } = this.newIn.getBoundingClientRect()
      const el = document.getElementById('sime-composition')
      if (el) {
        el.style.top = `${top + height}px`
        el.style.left = `${left}px`
      }
    }
  }

  nthCandidateExists(n: number) {
    return 5 * this.candPage + n - 1 < this.cands.length
  }

  selectCandidate(selection: number) {
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
    let newText = ''
    newText = text.substring(0, chineseLen)
    newText += cand
    newText += text.substring(chineseLen + this.getNthMatchLen(selection))
    if (text.substring(chineseLen + this.getNthMatchLen(selection)).length === 0) {
      this.setPredictText(newText)
      this.commitText()
      this.hideComposition()
      this.clearCandidate()
      this.cursorPosition = 0
      dispatchCompositionEvent(this.newIn, 'compositionend', newText)
    }
    else {
      if (this.options.cursorMode) {
        const { html, cursorPosition } = replaceTextAndUpdateCursorPosition(
          text,
          chineseLen,
          this.getNthMatchLen(selection),
          cand,
          this.cursorPosition,
        )
        this.cursorPosition = cursorPosition
        const el = document.getElementById('sime-predict')
        if (el) {
          el.innerHTML = html
        }
        newText = this.getPredictText()
      }
      else {
        this.setPredictText(newText)
      }
      this.fetchCandidateAsync()
      dispatchCompositionEvent(this.newIn, 'compositionupdate', newText)
    }
  }

  setCandidates(candidates: string[]) {
    this.cands = candidates
  }

  setMatchLens(match_lens: number[]) {
    this.candsMatchLens = match_lens
  }

  setPredictText(str: string) {
    const el = document.getElementById('sime-predict')
    if (el) {
      el.innerText = str
    }
  }

  showCandidates() {
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

  showComposition() {
    this.typeOn = true
    const el = document.getElementById('sime-composition')
    if (el) {
      el.style.display = 'block'
    }
  }

  showStatus() {
    this.toolbarHandle.show()
  }

  switchMethod = () => {
    this.method = (this.method + 1) % 2
    this.chiMode = this.method === 1
  }

  switchShape = () => {
    this.shape = (this.shape + 1) % 2
  }

  switchPunct = () => {
    this.punct = (this.punct + 1) % 2
  }

  moveCursorPositionLeft() {
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
    const el = document.getElementById('sime-predict')
    if (el) {
      el.innerHTML = html
    }
    this.fetchCandidateAsync()
  }

  moveCursorPositionRight() {
    const text = this.getPredictText()
    const oldCursorPosition = this.cursorPosition
    this.cursorPosition = moveCursorPositionRight(text, oldCursorPosition)
    if (this.cursorPosition === oldCursorPosition) {
      return
    }
    const html = generateTextByCursorPosition(text, this.cursorPosition)
    const el = document.getElementById('sime-predict')
    if (el) {
      el.innerHTML = html
    }
    this.fetchCandidateAsync()
  }

  toggleOnOff() {
    this.isOn = !this.isOn
    this.isOn ? this.turnOn() : this.turnOff()
  }

  turnOn() {
    this.isOn = true
    this.toolbarHandle.show()
  }

  turnOff() {
    this.isOn = false
    this.setPredictText('')
    this.cursorPosition = 0
    this.hideComposition()
    this.clearCandidate()
    this.hideStatus()
  }

  dispose() {
    // TODO:
  }
}

export function createSimpleIme(options?: Options) {
  const ime = new SimpleIme()
  ime.init(options)
  return ime
}
