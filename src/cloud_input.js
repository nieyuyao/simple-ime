import $ from 'jquery'
import { getCandidates } from './ime_engine'
import ban50Png from './img/ban50.png?inline'
import pin50Png from './img/pin50.png?inline'
import en50Png from './img/en50.png?inline'
import banjiao50Png from './img/banjiao50.png?inline'
import quanjiao50Png from './img/quanjiao50.png?inline'
import quan50Png from './img/quan50.png?inline'
import CloudInputCss from './cloud_input.css?inline'
import { isEditableElement, updateContent } from './utils/dom'
import { dispatchEvent } from './utils/event'

import { version } from '../package.json'

var CloudInputObj = function () {
  this.candPage = 0
  this.candIndex = 0 //被选中候选词index
  this.cands = Array()
  this.candsRsp = Array()
  this.chiMode = true //输入法中英文模式
  this.flag = false
  this.method = 1
  this.newIn = $(document.activeElement) //新选中输入框
  this.punct = 0
  this.shape = 0
  this.isOn = false
  this.typeOn = false
  this.originPinyin = ''
  this.toConvertPinyin = ''
  this.version = version
}

CloudInputObj.prototype.addCSSandHTML = function () {
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

CloudInputObj.prototype.bindEvents = function () {
  $('.cloud_input_cnd').mousedown(function (e) {
    e.preventDefault()
    var index = $('.cloud_input_cnd').index(e.target)
    CloudInput.selectCandidate.call(CloudInput, index + 1)
    CloudInput.flag = true
  })

  $('.cloud_input_drct')
    .eq(0)
    .mousedown(function (e) {
      e.preventDefault()
      CloudInput.candidatePageUp.call(CloudInput)
    })

  $('.cloud_input_drct')
    .eq(1)
    .mousedown(function (e) {
      e.preventDefault()
      CloudInput.candidatePageDown.call(CloudInput)
    })

  $('#cloud_input_error #cloud_input_predict').mousedown(function (e) {
    e.preventDefault()
  })

  $('#cloud_input_status img')
    .eq(0)
    .click(function (e) {
      e.preventDefault()
      CloudInput.switchMethod.call(CloudInput, e.target)
    })

  $('#cloud_input_status img')
    .eq(1)
    .click(function (e) {
      e.preventDefault()
      CloudInput.switchShape.call(CloudInput, e.target)
    })

  $('#cloud_input_status img')
    .eq(2)
    .click(function (e) {
      e.preventDefault()
      CloudInput.switchPunct.call(CloudInput, e.target)
    })

  this.bindFocusEvent()
  this.bindKeyEvent()
}

CloudInputObj.prototype.bindFocusEvent = function () {
  window.addEventListener(
    'focusin',
    () => {
      const activeElement = document.activeElement
      if (isEditableElement(activeElement)) {
        CloudInput.flag = false
        CloudInput.newIn = $(activeElement)
        $('#cloud_input_composition').css({
          top: CloudInput.newIn.offset().top + CloudInput.newIn.height() + 'px',
          left: CloudInput.newIn.offset().left + 'px',
        })
        CloudInput.setPredictText( '')
        CloudInput.hideComposition()
        CloudInput.clearCandidate()
        this.activeElement = activeElement
      }
    },
    { capture: true }
  )
  window.addEventListener(
    'focusout',
    () => {
      //console.log("blur");
      if (CloudInput.flag) {
        CloudInput.flag = false
      } else {
        CloudInput.setPredictText('')
        CloudInput.hideComposition()
        CloudInput.clearCandidate()
        this.newIn = null
      }
    },
    { capture: true }
  )
}

CloudInputObj.prototype.bindKeyEvent = function () {
  window.addEventListener(
    'keydown',
    (e) => {
      //Respond to the character inputed
      if (!CloudInput.isOn || !this.newIn) {
        return
      }
      if (CloudInput.chiMode && CloudInput.typeOn) {
        if (e.key == 'Backspace') {
          e.preventDefault()
          if (this.toConvertPinyin !== this.originPinyin) {
            this.toConvertPinyin = this.originPinyin
            this.setPredictText(this.originPinyin)
            this.fetchCandidateAsync()
            return
          }
          var pre = CloudInput.getPredictText()
          CloudInput.setPredictText(pre.substr(0, pre.length - 1))
          this.originPinyin = CloudInput.getPredictText()
          this.toConvertPinyin = this.originPinyin
          //pre has length 1 means preedit empty after backspace
          if (pre.length == 1) {
            CloudInput.hideComposition()
            CloudInput.clearCandidate()
          } else {
            CloudInput.fetchCandidateAsync()
          }
        } else if (e.code == 'Escape') {
          CloudInput.setPredictText('')
          CloudInput.hideComposition()
          CloudInput.clearCandidate()
        } else if (e.key == 'ArrowUp') {
          e.preventDefault()
          CloudInput.candidatePageUp()
        } else if (e.key == 'ArrowDown') {
          e.preventDefault()
          CloudInput.candidatePageDown()
        } else if (e.key == 'ArrowLeft') {
          e.preventDefault()
          CloudInput.candidatePrev()
        } else if (e.key == 'ArrowRight') {
          e.preventDefault()
          CloudInput.candidateNext()
        }
      }
    },
    { capture: true }
  )

  window.addEventListener(
    'keypress',
    (e) => {
      if (!CloudInput.isOn || !this.newIn) {
        return
      }
      if (CloudInput.chiMode) {
        if (/^[a-z]$/.test(e.key)) {
          /*输入小写字母*/
          e.preventDefault()
          CloudInput.showComposition()
          CloudInput.setPredictText(
            CloudInput.getPredictText() + e.key
          )
          this.originPinyin += e.key
          this.toConvertPinyin += e.key
          CloudInput.fetchCandidateAsync()
        } else if (e.key == 'Enter') {
          /*Enter键时候直接上屏preedit*/
          if (CloudInput.typeOn) {
            e.preventDefault()
            CloudInput.commitText()
            CloudInput.hideComposition()
            CloudInput.clearCandidate()
          }
        } else if (/^(1|2|3|4|5)$/.test(e.key)) {
          /*1~5时选择对应的candidate*/
          if (CloudInput.typeOn) {
            e.preventDefault()
            CloudInput.selectCandidate(+e.key)
          }
        } else if (e.key == ' ') {
          /*空格键时选择candIndex对应的candidate*/
          if (CloudInput.typeOn) {
            e.preventDefault()
            CloudInput.selectCandidate((CloudInput.candIndex % 5) + 1)
          }
        } else if (e.key == '-') {
          /*输入-往前翻页*/
          e.preventDefault()
          CloudInput.candidatePageUp()
        } else if (e.key == '=') {
          /*输入=往后翻页*/
          e.preventDefault()
          CloudInput.candidatePageDown()
        } else if (e.key == '<') {
          /*<选上一次词*/
          e.preventDefault()
          CloudInput.candidatePrev()
        } else if (e.key == '>') {
          /*>选下一个词*/
          e.preventDefault()
          CloudInput.candidateNext()
        } else {
          if (CloudInput.typeOn) {
            e.preventDefault()
          }
        }
      }
    },
    { capture: true }
  )
}

CloudInputObj.prototype.candidatePrev = function () {
  this.candIndex = this.candIndex - 1 >= 0 ? this.candIndex - 1 : 0
  if (this.candIndex % 5 == 4) {
    this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
  }
  this.showCandidates(true)
}

CloudInputObj.prototype.candidateNext = function () {
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

CloudInputObj.prototype.candidatePageUp = function () {
  this.candIndex = this.candPage - 1 >= 0 ? this.candIndex - 5 : this.candIndex
  this.candPage = this.candPage - 1 >= 0 ? this.candPage - 1 : 0
  this.showCandidates(true)
}

CloudInputObj.prototype.candidatePageDown = function () {
  this.candIndex =
    this.candPage + 1 < this.cands.length / 5 ? this.candIndex + 5 : this.candIndex
  this.candPage =
    this.candPage + 1 < this.cands.length / 5
      ? this.candPage + 1
      : Math.floor(this.cands.length / 5)
  this.showCandidates(true)
}

CloudInputObj.prototype.clearCandidate = function () {
  this.candPage = 0
  this.candIndex = 0
  this.cands = Array()
  this.candsRsp = Array()
}

CloudInputObj.prototype.commitText = function () {
  //FIXME: support cursor position/selection range
  // TODO: fetch from remote server
  var str = this.getPredictText()
  const element = this.newIn[0]
  updateContent(element, str)
  dispatchEvent(element, 'input')
  this.originPinyin = ''
  this.toConvertPinyin = ''
  this.setPredictText('')
}

CloudInputObj.prototype.fetchCandidateAsync = function () {
  this.clearCandidate()
  let input = this.toConvertPinyin
  const [candidates, matchLens] = getCandidates(input)
  const data = [input, candidates, matchLens]
  var origin = data[0]
  var has_match_lens = data.length == 3
  CloudInput.setCandidates(data[1])
  if (has_match_lens) {
    CloudInput.setMatchLens(data[2])
  } else {
    var match_lens = Array()
    for (var i = 0; i < data[1].length; i++) {
      match_lens.push(origin.length)
    }
    CloudInput.setMatchLens(match_lens)
  }
  CloudInput.showCandidates(true)
}

CloudInputObj.prototype.getNthCandidate = function (n) {
  return this.cands[5 * this.candPage + n - 1]
}

CloudInputObj.prototype.getNthMatchLen = function (n) {
  return this.candsRsp[5 * this.candPage + n - 1]
}

CloudInputObj.prototype.getPredictText = function () {
  return $('#cloud_input_predict').text()
}

CloudInputObj.prototype.hideComposition = function () {
  this.typeOn = false
  $('#cloud_input_composition').hide()
}

CloudInputObj.prototype.hideStatus = function () {
  $('#cloud_input_status').hide()
}

CloudInputObj.prototype.highBack = function () {
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

CloudInputObj.prototype.init = function () {
  this.addCSSandHTML()
  this.bindEvents()
  $('#cloud_input_composition').css({
    top: this.newIn.offset().top + this.newIn.height() + 'px',
    left: this.newIn.offset().left + 'px',
  })
}

CloudInputObj.prototype.isLatin = function (code) {
  return code < 128
}

CloudInputObj.prototype.nthCandidateExists = function (n) {
  return 5 * this.candPage + n - 1 < this.cands.length
}

CloudInputObj.prototype.selectCandidate = function (selection) {
  if (!this.nthCandidateExists(selection)) {
    return
  }
  var tmpCand = this.getNthCandidate(selection)
  var tmpPre = this.getPredictText()
  var chineseLen = 0
  for (var i = 0; i < tmpPre.length; i++) {
    if (this.isLatin(tmpPre.charCodeAt(i))) {
      chineseLen = i
      break
    }
  }
  var finPre = ''
  finPre = tmpPre.substring(0, chineseLen)
  finPre += tmpCand
  if (tmpPre.substring(chineseLen + this.getNthMatchLen(selection)).length == 0) {
    this.setPredictText(finPre)
    this.commitText()
    this.hideComposition()
    this.clearCandidate()
  } else {
    this.toConvertPinyin = tmpPre.substring(chineseLen + this.getNthMatchLen(selection))
    finPre += this.toConvertPinyin
    this.setPredictText(finPre)
    this.fetchCandidateAsync()
  }
}

CloudInputObj.prototype.setCandidates = function (candidates) {
  this.cands = candidates
}

CloudInputObj.prototype.setMatchLens = function (match_lens) {
  this.candsRsp = match_lens
}

CloudInputObj.prototype.setPredictText = function (str) {
  $('#cloud_input_predict').text(str)
}

CloudInputObj.prototype.showCandidates = function (success) {
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

  var len = $('.cloud_input_cnd').length
  var m = (this.candPage + 1) * len - this.cands.length > 0 ? this.cands.length % len : len
  for (var i = 0; i < m; i++) {
    var str = ''
    str += i + 1 + '. '
    str += this.cands[i + this.candPage * 5]
    $('.cloud_input_cnd').eq(i).text(str)
  }
  for (var i = m; i < len; i++) {
    $('.cloud_input_cnd').eq(i).text('')
  }
  this.highBack()
}

CloudInputObj.prototype.showComposition = function () {
  this.typeOn = true
  $('#cloud_input_composition').show()
}

CloudInputObj.prototype.showStatus = function () {
  $('#cloud_input_status').show()
}

CloudInputObj.prototype.switchMethod = function (t) {
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

CloudInputObj.prototype.switchShape = function (t) {
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

CloudInputObj.prototype.switchPunct = function (t) {
  this.punct = (this.punct + 1) % 2
  switch (this.punct) {
    case 0:
      t.src = ban50Png
      break
    case 1:
      t.src = quan50Png
      break
  }
}

CloudInputObj.prototype.toggleOnOff = function () {
  this.isOn = !this.isOn
  if (this.isOn) {
    this.turnOn()
  } else {
    this.turnOff()
  }
}

CloudInputObj.prototype.turnOn = function () {
  this.isOn = true
  this.showStatus()
}

CloudInputObj.prototype.turnOff = function () {
  this.isOn = false
  this.setPredictText('')
  this.hideComposition()
  this.clearCandidate()
  this.hideStatus()
}

if (window.chrome && window.chrome.extension) {
  CloudInput = new CloudInputObj()
  CloudInput.init(chrome.extension.getURL(''))
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // console.log(sender.tab ?
    // "from a content script:" + sender.tab.url :
    // "from the extension");
    if (request.action == 'on') {
      CloudInput.turnOn()
    } else {
      CloudInput.turnOff()
    }
  })
} else {
  window.CloudInput = new CloudInputObj()
}
