import $  from 'jquery'
import { getCandidates } from './ime-engine'
import ban50Png from './img/ban50.png?inline'
import pin50Png from './img/pin50.png?inline'
import en50Png from './img/en50.png?inline'
import banjiao50Png from './img/banjiao50.png?inline'
import quanjiao50Png from './img/quanjiao50.png?inline'
import quan50Png from './img/quan50.png?inline'
import CloudInputCss from './cloud-input.css?inline'
import { isEditableElement, updateContent } from './utils/dom'
import { dispatchCompositionEvent, dispatchInputEvent } from './utils/event'
import { version } from '../package.json'

class CloudInputObj {
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


  addCSSandHTML() {
    $(
      "<div id='cloud_input_composition'>\
    <table>\
    <tr>\
    <td id='cloud_input_predict' colspan='7'></td>\
    <tr>\
    <td colspan='7' style='\
    box-shadow: rgba(66, 140, 240, 0.5) 0px -1px 1px; -webkit-box-shadow: rgba(66, 140, 240, 0.5) 0px -1px 1px;\
    '></td>\
    </tr>\
    <tr>\
    <td class='cloud_input_cnd'></td>\
    <td class='cloud_input_cnd'></td>\
    <td class='cloud_input_cnd'></td>\
    <td class='cloud_input_cnd'></td>\
    <td class='cloud_input_cnd'></td>\
    <td class='cloud_input_drct'>&larr;</td>\
    <td class='cloud_input_drct'>&rarr;</td>\
    </tr>\
    <td id='cloud_input_error' colspan='7' style='color: red;'></td>\
    </table>\
    </div>"
    ).appendTo('body')
  
    $(`<div id='cloud_input_status'>\
      <table>\
      <tr>\
      <td><img src="${pin50Png}"></td>\
      <td><img src="${banjiao50Png}"></td>\
      <td><img src="${quan50Png}"></td>\
      </tr>\
      </table>\
      </div>`).appendTo('body')
    $('#cloud_input_status').hide()
    $(`<style type='text/css'>${CloudInputCss}</style>`).appendTo('head')
  }

  bindEvents() {
    $('.cloud_input_cnd').mousedown((e) => {
      e.preventDefault()
      const index = $('.cloud_input_cnd').index(e.target)
      this.selectCandidate(index + 1)
      this.flag = true
    })
  
    $('.cloud_input_drct')
      .eq(0)
      .mousedown((e) => {
        e.preventDefault()
        this.candidatePageUp()
      })
  
    $('.cloud_input_drct')
      .eq(1)
      .mousedown((e) => {
        e.preventDefault()
        this.candidatePageDown()
      })
  
    $('#cloud_input_error #cloud_input_predict').mousedown((e) => {
      e.preventDefault()
    })
  
    $('#cloud_input_status img')
      .eq(0)
      .click((e) => {
        e.preventDefault()
        this.switchMethod(e.target)
      })
  
    $('#cloud_input_status img')
      .eq(1)
      .click((e) => {
        e.preventDefault()
        this.switchShape(e.target)
      })
  
    $('#cloud_input_status img')
      .eq(2)
      .click((e) => {
        e.preventDefault()
        this.switchPunct(e.target)
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
          $('#cloud_input_composition').css({
            top: top + height + 'px',
            left: left + 'px',
          })
          this.setPredictText( '')
          this.hideComposition()
          this.clearCandidate()
        }
      },
      { capture: true }
    )
    window.addEventListener(
      'focusout',
      () => {
        if (this.flag) {
          this.flag = false
        } else {
          this.setPredictText('')
          this.hideComposition()
          this.clearCandidate()
        }
      },
      { capture: true }
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
          if (e.key == 'Backspace') {
            e.preventDefault()
            if (this.toConvertPinyin !== this.originPinyin) {
              this.toConvertPinyin = this.originPinyin
              this.setPredictText(this.originPinyin)
              this.fetchCandidateAsync()
               dispatchCompositionEvent(this.newIn[0], 'compositionupdate', this.getPredictText())
              return
            } else {
              const pre = this.getPredictText()
              this.setPredictText(pre.substr(0, pre.length - 1))
              this.originPinyin = this.getPredictText()
              this.toConvertPinyin = this.originPinyin
              // pre has length 1 means predict empty after backspace
              if (pre.length == 1) {
                this.hideComposition()
                this.clearCandidate()
              } else {
                this.fetchCandidateAsync()
              }
            }
            dispatchCompositionEvent(this.newIn[0], 'compositionupdate', this.getPredictText())
          } else if (e.code == 'Escape') {
            this.setPredictText('')
            this.hideComposition()
            this.clearCandidate()
          } else if (e.key == 'ArrowUp') {
            e.preventDefault()
            this.candidatePageUp()
          } else if (e.key == 'ArrowDown') {
            e.preventDefault()
            this.candidatePageDown()
          } else if (e.key == 'ArrowLeft') {
            e.preventDefault()
            this.candidatePrev()
          } else if (e.key == 'ArrowRight') {
            e.preventDefault()
            this.candidateNext()
          }
        }
      },
      { capture: true }
    )
  
    window.addEventListener(
      'keypress',
      (e) => {
        if (!this.isOn || !this.newIn) {
          return
        }
        if (this.chiMode) {
          if (/^[a-z]$/.test(e.key)) {
            /*输入小写字母*/
            e.preventDefault()
            if (this.typeOn) {
              dispatchCompositionEvent(this.newIn[0], 'compositionupdate', this.getPredictText())
            } else {
              this.showComposition()
              dispatchCompositionEvent(this.newIn[0], 'compositionstart', this.getPredictText())
            }
            this.setPredictText(
              this.getPredictText() + e.key
            )
            this.originPinyin += e.key
            this.toConvertPinyin += e.key
            this.fetchCandidateAsync()
          } else if (e.key == 'Enter') {
            /*Enter键时候直接上屏preedit*/
            if (this.typeOn) {
              e.preventDefault()
              this.commitText()
              this.hideComposition()
              this.clearCandidate()
            }
          } else if (/^(1|2|3|4|5)$/.test(e.key)) {
            /*1~5时选择对应的candidate*/
            if (this.typeOn) {
              e.preventDefault()
              this.selectCandidate(+e.key)
            }
          } else if (e.key == ' ') {
            /*空格键时选择candIndex对应的candidate*/
            if (this.typeOn) {
              e.preventDefault()
              this.selectCandidate((this.candIndex % 5) + 1)
            }
          } else if (e.key == '-') {
            /*输入-往前翻页*/
            e.preventDefault()
            this.candidatePageUp()
          } else if (e.key == '=') {
            /*输入=往后翻页*/
            e.preventDefault()
            this.candidatePageDown()
          } else if (e.key == '<') {
            /*<选上一次词*/
            e.preventDefault()
            this.candidatePrev()
          } else if (e.key == '>') {
            /*>选下一个词*/
            e.preventDefault()
            this.candidateNext()
          } else {
            if (this.typeOn) {
              e.preventDefault()
            }
          }
        }
      },
      { capture: true }
    )
  }

  candidatePrev() {
    this.candIndex = this.candIndex - 1 >= 0 ? this.candIndex - 1 : 0
    if (this.candIndex % 5 == 4) {
      this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
    }
    this.showCandidates(true)
  }

  candidateNext() {
    this.candIndex =
    this.candIndex + 1 <= this.cands.length ? this.candIndex + 1 : this.cands.length - 1
    if (this.candIndex % 5 == 0) {
      this.candPage =
        this.candPage + 1 < this.cands.length / 5
          ? this.candPage + 1
          : Math.floor(this.cands.length / 5)
    }
    this.showCandidates(true)
  }

  candidatePageUp() {
    this.candIndex = this.candPage - 1 >= 0 ? this.candIndex - 5 : this.candIndex
    this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
    this.showCandidates(true)
  }

  candidatePageDown() {
    this.candIndex =
    this.candPage + 1 < this.cands.length / 5 ? this.candIndex + 5 : this.candIndex
    this.candPage =
      this.candPage + 1 < this.cands.length / 5
        ? this.candPage + 1
        : Math.floor(this.cands.length / 5)
    this.showCandidates(true)
  }

  clearCandidate() {
    this.candPage = 0
    this.candIndex = 0
    this.cands = new Array()
    this.candsRsp = new Array()
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
      const has_match_lens = data.length == 3
      this.setCandidates(candidates)
      if (has_match_lens) {
        this.setMatchLens(matchLens)
      } else {
        const match_lens = Array()
        for (let i = 0; i < data[1].length; i++) {
          match_lens.push(origin.length)
        }
        this.setMatchLens(match_lens)
      }
      this.showCandidates(true)
  }

  getNthCandidate(n: number) {
    return this.cands[5 * this.candPage + n - 1]
  }

  getNthMatchLen(n: number) {
    return this.candsRsp[5 * this.candPage + n - 1]
  }

  getPredictText() {
    return $('#cloud_input_predict').text()
  }

  hideComposition() {
    this.typeOn = false
    $('#cloud_input_composition').hide()
  }

  hideStatus() {
    $('#cloud_input_status').hide()
  }

  highBack() {
    $('.cloud_input_cnd').css({
      color: '#000000',
      'text-shadow': 'rgba(10, 10, 10, 0.5) 1px 2px 2px',
      'font-size': '100%',
      opacity: '1.0',
    })
    $('.cloud_input_cnd')
      .eq(this.candIndex % 5)
      .css({
        color: 'rgba(66, 140, 240, 0.5)',
        'text-shadow': 'rgba(66, 140, 240, 0.5) 1px 2px 2px',
        opacity: '0.9',
      })
    if (this.candPage == 0) {
      $('.cloud_input_drct').eq(0).css({ visibility: 'hidden' })
    } else {
      $('.cloud_input_drct').eq(0).css({ visibility: 'visible' })
    }
    if ((this.candPage + 1) * $('.cloud_input_cnd').length >= this.cands.length) {
      $('.cloud_input_drct').eq(1).css({ visibility: 'hidden' })
    } else {
      $('.cloud_input_drct').eq(1).css({ visibility: 'visible' })
    }
  }

  init() {
    this.addCSSandHTML()
    this.bindEvents()
    const top = this.newIn.offset()?.top ?? 0
    const left = this.newIn.offset()?.left ?? 0
    const height = this.newIn.height() ?? 0
    $('#cloud_input_composition').css({
      top: top + height + 'px',
      left: left + 'px',
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
    if (tmpPre.substring(chineseLen + this.getNthMatchLen(selection)).length == 0) {
      this.setPredictText(finPre)
      this.commitText()
      this.hideComposition()
      this.clearCandidate()
      dispatchCompositionEvent(this.newIn[0], 'compositionend', finPre)
    } else {
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
    $('#cloud_input_predict').text(str)
  }

  showCandidates(success: boolean) {
    if (!success) {
      this.clearCandidate()
      $('#cloud_input_error').html('Communication Timeout')
      $('.cloud_input_cnd').hide()
      $('.cloud_input_drct').hide()
    } else {
      $('#cloud_input_error').html('')
      $('.cloud_input_cnd').show()
      $('.cloud_input_drct').show()
    }
  
    const len = $('.cloud_input_cnd').length
    const m = (this.candPage + 1) * len - this.cands.length > 0 ? this.cands.length % len : len
    for (let i = 0; i < m; i++) {
      let str = ''
      str += i + 1 + '. '
      str += this.cands[i + this.candPage * 5]
      $('.cloud_input_cnd').eq(i).text(str)
    }
    for (let i = m; i < len; i++) {
      $('.cloud_input_cnd').eq(i).text('')
    }
    this.highBack()
  }

  showComposition() {
    this.typeOn = true
    $('#cloud_input_composition').show()
  }

  showStatus() {
    $('#cloud_input_status').show()
  }

  switchMethod(t: any) {
    this.method = (this.method + 1) % 2
    switch (this.method) {
      case 0:
        this.chiMode = false
        t.src = en50Png
        break
      case 1:
        this.chiMode = true
        t.src = pin50Png
        break
    }
  }

  switchShape(t: any) {
    this.shape = (this.shape + 1) % 2
    switch (this.shape) {
      case 0:
        t.src = banjiao50Png
        break
      case 1:
        t.src = quanjiao50Png
        break
    }
  }

  switchPunct(t: any) {
    this.punct = (this.punct + 1) % 2
    t.src = this.punct === 0 ? ban50Png : quan50Png
  }

  toggleOnOff() {
    this.isOn = !this.isOn
    this.isOn ? this.turnOn() : this.turnOff()
  }

  turnOn() {
    this.isOn = true
    this.showStatus()
  }

  turnOff() {
    this.isOn = false
    this.setPredictText('')
    this.hideComposition()
    this.clearCandidate()
    this.hideStatus()
  }
}

window.CloudInput = new CloudInputObj()
