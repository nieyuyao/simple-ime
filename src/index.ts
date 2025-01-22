import $ from 'jquery'
import { version } from '../package.json'
import { getCandidates } from './ime-engine'
import CloudInputCss from './styles/index.scss?inline'
import { isEditableElement, updateContent } from './utils/dom'
import { dispatchCompositionEvent, dispatchInputEvent } from './utils/event'
import { createInputView } from './views/create-input-view'
import { createToolbar } from './views/create-toolbar'

export class SimpleIme {
  candPage = 0

  candIndex = 0

  cands: string[] = []

  candsRsp: number[] = []

  chiMode = true

  flag = false

  method = 1

  newIn: JQuery<Element> = $(document.activeElement || document.body)

  punct = 0

  shape = 0

  isOn = false

  typeOn = false

  originPinyin = ''

  toConvertPinyin = ''

  version = version

  toolbarHandle: ReturnType<typeof createToolbar>

  addCSSandHTML() {
    $(`<style type='text/css'>${CloudInputCss}</style>`).appendTo('head')
  }

  bindEvents() {
    $('.sime-cnd').mousedown((e) => {
      e.preventDefault()
      const index = $('.sime-cnd').index(e.target)
      this.selectCandidate(index + 1)
      this.flag = true
    })

    $('.sime-prev-cand-button')
      .mousedown((e) => {
        e.preventDefault()
        this.candidatePageUp()
      })

    $('.sime-next-cand-button')
      .mousedown((e) => {
        e.preventDefault()
        this.candidatePageDown()
      })

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
          this.newIn = $(activeElement)
          const top = this.newIn.offset()?.top ?? 0
          const left = this.newIn.offset()?.left ?? 0
          const height = this.newIn.height() ?? 0
          $('#sime-composition').css({
            top: `${top + height}px`,
            left: `${left}px`,
          })
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
        // Respond to the character inputed
        if (!this.isOn || !this.newIn) {
          return
        }
        // TODO: 支持单引号分词
        // TODO: 限制pinyin字符数
        // TODO: 小尺寸页面兼容
        if (this.chiMode && this.typeOn) {
          if (e.key === 'Backspace') {
            e.preventDefault()
            if (this.toConvertPinyin !== this.originPinyin) {
              this.toConvertPinyin = this.originPinyin
              this.setPredictText(this.originPinyin)
              this.fetchCandidateAsync()
              dispatchCompositionEvent(this.newIn[0], 'compositionupdate', this.getPredictText())
              return
            }
            else {
              const pre = this.getPredictText()
              this.setPredictText(pre.substr(0, pre.length - 1))
              this.originPinyin = this.getPredictText()
              this.toConvertPinyin = this.originPinyin
              // pre has length 1 means predict empty after backspace
              if (pre.length === 1) {
                this.hideComposition()
                this.clearCandidate()
              }
              else {
                this.fetchCandidateAsync()
              }
            }
            dispatchCompositionEvent(this.newIn[0], 'compositionupdate', this.getPredictText())
          }
          else if (e.code === 'Escape') {
            this.setPredictText('')
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
          if (/^[a-z]$/.test(e.key)) {
            /* 输入小写字母 */
            e.preventDefault()
            if (this.typeOn) {
              dispatchCompositionEvent(this.newIn[0], 'compositionupdate', this.getPredictText())
            }
            else {
              this.showComposition()
              dispatchCompositionEvent(this.newIn[0], 'compositionstart', this.getPredictText())
            }
            this.setPredictText(
              this.getPredictText() + e.key,
            )
            this.originPinyin += e.key
            this.toConvertPinyin += e.key
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
    this.candIndex
    = this.candPage + 1 < this.cands.length / 5 ? this.candIndex + 5 : this.candIndex
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
    this.candsRsp = []
  }

  commitText() {
    // TODO: support cursor position/selection range
    // TODO: fetch from remote server
    const str = this.getPredictText()
    updateContent(this.newIn[0], str)
    dispatchInputEvent(this.newIn[0], 'input')
    this.originPinyin = ''
    this.toConvertPinyin = ''
    this.setPredictText('')
  }

  fetchCandidateAsync() {
    this.clearCandidate()
    const input = this.toConvertPinyin
    const [candidates, matchLens] = getCandidates(input)
    const data = [input, candidates, matchLens]
    const origin = data[0]
    const has_match_lens = data.length === 3
    this.setCandidates(candidates)
    if (has_match_lens) {
      this.setMatchLens(matchLens)
    }
    else {
      const match_lens: number[] = []
      for (let i = 0; i < data[1].length; i++) {
        match_lens.push(origin.length)
      }
      this.setMatchLens(match_lens)
    }
    this.showCandidates()
  }

  getNthCandidate(n: number) {
    return this.cands[5 * this.candPage + n - 1]
  }

  getNthMatchLen(n: number) {
    return this.candsRsp[5 * this.candPage + n - 1]
  }

  getPredictText() {
    return $('#sime-predict').text()
  }

  hideComposition() {
    this.typeOn = false
    $('#sime-composition').hide()
  }

  hideStatus() {
    this.toolbarHandle.hide()
  }

  highBack() {
    $('.sime-cnd')
      .removeClass('highlight')

    $('.sime-cnd')
      .eq(this.candIndex % 5)
      .addClass('highlight')

    this.candPage === 0
      ? $('.sime-prev-cand-button').addClass('disabled')
      : $('.sime-prev-cand-button').removeClass('disabled')

    5 * (this.candPage + 1) >= this.cands.length
      ? $('.sime-next-cand-button').addClass('disabled')
      : $('.sime-next-cand-button').removeClass('disabled')
  }

  init() {
    this.toolbarHandle = createToolbar(
      this.switchMethod,
      this.switchShape,
      this.switchMethod,
    )
    createInputView()
    this.addCSSandHTML()
    this.bindEvents()
    const top = this.newIn.offset()?.top ?? 0
    const left = this.newIn.offset()?.left ?? 0
    const height = this.newIn.height() ?? 0
    $('#sime-composition').css({
      top: `${top + height}px`,
      left: `${left}px`,
    })
  }

  isLatin(code: number) {
    return code < 128
  }

  nthCandidateExists(n: number) {
    return 5 * this.candPage + n - 1 < this.cands.length
  }

  selectCandidate(selection: number) {
    if (!this.nthCandidateExists(selection)) {
      return
    }
    const tmpCand = this.getNthCandidate(selection)
    const tmpPre = this.getPredictText()
    let chineseLen = 0
    for (let i = 0; i < tmpPre.length; i++) {
      if (this.isLatin(tmpPre.charCodeAt(i))) {
        chineseLen = i
        break
      }
    }
    let finPre = ''
    finPre = tmpPre.substring(0, chineseLen)
    finPre += tmpCand
    if (tmpPre.substring(chineseLen + this.getNthMatchLen(selection)).length === 0) {
      this.setPredictText(finPre)
      this.commitText()
      this.hideComposition()
      this.clearCandidate()
      dispatchCompositionEvent(this.newIn[0], 'compositionend', finPre)
    }
    else {
      this.toConvertPinyin = tmpPre.substring(chineseLen + this.getNthMatchLen(selection))
      finPre += this.toConvertPinyin
      this.setPredictText(finPre)
      this.fetchCandidateAsync()
      dispatchCompositionEvent(this.newIn[0], 'compositionupdate', finPre)
    }
  }

  setCandidates(candidates: string[]) {
    this.cands = candidates
  }

  setMatchLens(match_lens: number[]) {
    this.candsRsp = match_lens
  }

  setPredictText(str: string) {
    $('#sime-predict').text(str)
  }

  showCandidates() {
    const len = $('.sime-cnd').length
    const m = (this.candPage + 1) * len - this.cands.length > 0 ? this.cands.length % len : len
    for (let i = 0; i < m; i++) {
      let str = ''
      str += `${i + 1}. `
      str += this.cands[i + this.candPage * 5]
      $('.sime-cnd').eq(i).text(str)
    }
    for (let i = m; i < len; i++) {
      $('.sime-cnd').eq(i).text('')
    }
    this.highBack()
  }

  showComposition() {
    this.typeOn = true
    $('#sime-composition').show()
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
    this.hideComposition()
    this.clearCandidate()
    this.hideStatus()
  }
}
