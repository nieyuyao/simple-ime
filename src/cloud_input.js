import $ from 'jquery'
import getCandidates from './ime_engine'
import ban50Png from './img/ban50.png?inline'
import pin50Png from './img/pin50.png?inline'
import en50Png from './img/en50.png?inline'
import banjiao50Png from './img/banjiao50.png?inline'
import quanjiao50Png from './img/quanjiao50.png?inline'
import quan50Png from './img/quan50.png?inline'
import CloudInputCss from './cloud_input.css?inline'
import { isEditableElement, updateContent } from './utils/dom'

var CloudInputObj = function () {
  this.cand_page = 0
  this.cand_index = 0 //被选中候选词index
  this.cands = Array()
  this.cands_rsp = Array()
  this.chi_mode = true //输入法中英文模式
  this.flag = false
  this.method = 1
  this.new_in = $(document.activeElement) //新选中输入框
  this.punct = 0
  this.shape = 0
  this.turn_on = false
  this.type_on = false
}

CloudInputObj.prototype.addCSSandHTML = function () {
  $(
    "<div id='cloud_input_composition'>\
	<table>\
	<tr>\
	<td id='cloud_input_preedit' colspan='7'></td>\
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

  $('#cloud_input_error #cloud_input_preedit').mousedown(function (e) {
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
        CloudInput.new_in = $(activeElement)
        $('#cloud_input_composition').css({
          top: CloudInput.new_in.offset().top + CloudInput.new_in.height() + 'px',
          left: CloudInput.new_in.offset().left + 'px',
        })
        CloudInput.setPreeditText.call(CloudInput, '')
        CloudInput.hideComposition.call(CloudInput)
        CloudInput.clearCandidate.call(CloudInput)
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
        CloudInput.setPreeditText.call(CloudInput, '')
        CloudInput.hideComposition.call(CloudInput)
        CloudInput.clearCandidate.call(CloudInput)
        this.new_in = null
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
      if (!CloudInput.turn_on || !this.new_in) {
        return
      }
      if (CloudInput.chi_mode && CloudInput.type_on) {
        if (e.which == 8) {
          /*退格键*/
          e.preventDefault()
          var pre = CloudInput.getPreeditText.call(CloudInput)
          CloudInput.setPreeditText.call(CloudInput, pre.substr(0, pre.length - 1))
          //pre has length 1 means preedit empty after backspace
          if (pre.length == 1) {
            CloudInput.hideComposition.call(CloudInput)
            CloudInput.clearCandidate.call(CloudInput)
          } else {
            CloudInput.fetchCandidateAsync.call(CloudInput)
          }
        } else if (e.which == 27) {
          /*Escape*/
          CloudInput.setPreeditText.call(CloudInput, '')
          CloudInput.hideComposition.call(CloudInput)
          CloudInput.clearCandidate.call(CloudInput)
        } else if (e.which == 38) {
          /*Arrow Up往前翻页*/
          e.preventDefault()
          CloudInput.candidatePageUp.call(CloudInput)
        } else if (e.which == 40) {
          /*Arrow Down往后翻页*/
          e.preventDefault()
          CloudInput.candidatePageDown.call(CloudInput)
        } else if (e.which == 37) {
          /*Arrow Left选中上个词*/
          e.preventDefault()
          CloudInput.candidatePrev.call(CloudInput)
        } else if (e.which == 39) {
          /*Arrow Right选中下个词*/
          e.preventDefault()
          CloudInput.candidateNext.call(CloudInput)
        }
      }
    },
    { capture: true }
  )

  window.addEventListener(
    'keypress',
    (e) => {
      if (!CloudInput.turn_on || !this.new_in) {
        return
      }
      if (CloudInput.chi_mode) {
        //console.log(e.which);
        if (e.which >= 97 && e.which <= 122) {
          /*输入小写字母*/
          e.preventDefault()
          CloudInput.showComposition.call(CloudInput)
          CloudInput.setPreeditText.call(
            CloudInput,
            CloudInput.getPreeditText() + String.fromCharCode(e.which)
          )
          CloudInput.fetchCandidateAsync.call(CloudInput)
        } else if (e.which == 13) {
          /*Enter键时候直接上屏preedit*/
          if (CloudInput.type_on) {
            e.preventDefault()
            CloudInput.commitText.call(CloudInput)
            CloudInput.hideComposition.call(CloudInput)
            CloudInput.clearCandidate.call(CloudInput)
          }
        } else if (e.which >= 49 && e.which <= 53) {
          /*1~5时选择对应的candidate*/
          if (CloudInput.type_on) {
            e.preventDefault()
            CloudInput.selectCandidate.call(CloudInput, e.which - 48)
          }
        } else if (e.which == 32) {
          /*空格键时选择cand_index对应的candidate*/
          if (CloudInput.type_on) {
            e.preventDefault()
            CloudInput.selectCandidate.call(CloudInput, (CloudInput.cand_index % 5) + 1)
          }
        } else if (e.which == 45) {
          /*输入-往前翻页*/
          e.preventDefault()
          CloudInput.candidatePageUp.call(CloudInput)
        } else if (e.which == 61) {
          /*输入=往后翻页*/
          e.preventDefault()
          CloudInput.candidatePageDown.call(CloudInput)
        } else if (e.which == 60) {
          /*<选上一次词*/
          e.preventDefault()
          CloudInput.candidatePrev.call(CloudInput)
        } else if (e.which == 62) {
          /*>选下一个词*/
          e.preventDefault()
          CloudInput.candidateNext.call(CloudInput)
        } else {
          if (CloudInput.type_on) {
            e.preventDefault()
          }
        }
      }
    },
    { capture: true }
  )
}

CloudInputObj.prototype.candidatePrev = function () {
  this.cand_index = this.cand_index - 1 >= 0 ? this.cand_index - 1 : 0
  if (this.cand_index % 5 == 4) {
    this.cand_page = this.cand_page - 1 >= 0 ? this.cand_page - 1 : 0
  }
  this.showCandidates(true)
}

CloudInputObj.prototype.candidateNext = function () {
  this.cand_index =
    this.cand_index + 1 <= this.cands.length ? this.cand_index + 1 : this.cands.length - 1
  if (this.cand_index % 5 == 0) {
    this.cand_page =
      this.cand_page + 1 < this.cands.length / 5
        ? this.cand_page + 1
        : Math.floor(this.cands.length / 5)
  }
  this.showCandidates(true)
}

CloudInputObj.prototype.candidatePageUp = function () {
  this.cand_index = this.cand_page - 1 >= 0 ? this.cand_index - 5 : this.cand_index
  this.cand_page = this.cand_page - 1 >= 0 ? this.cand_page - 1 : 0
  this.showCandidates(true)
}

CloudInputObj.prototype.candidatePageDown = function () {
  this.cand_index =
    this.cand_page + 1 < this.cands.length / 5 ? this.cand_index + 5 : this.cand_index
  this.cand_page =
    this.cand_page + 1 < this.cands.length / 5
      ? this.cand_page + 1
      : Math.floor(this.cands.length / 5)
  this.showCandidates(true)
}

CloudInputObj.prototype.clearCandidate = function () {
  this.cand_page = 0
  this.cand_index = 0
  this.cands = Array()
  this.cands_rsp = Array()
}

CloudInputObj.prototype.commitText = function () {
  //FIXME: support cursor position/selection range
  var str = this.getPreeditText()
  updateContent(this.new_in[0], str)
  this.setPreeditText('')
}

CloudInputObj.prototype.fetchCandidateAsync = function () {
  this.clearCandidate()
  const originIput = CloudInput.getPreeditText()
  const [candidates, matchLens] = getCandidates(originIput)
  const data = [originIput, candidates, matchLens]
  var origin = data[0]
  // ignore non-matching data
  if (origin != CloudInput.getPreeditText.call(CloudInput)) {
    return
  }
  var has_match_lens = data.length == 3
  CloudInput.setCandidates.call(CloudInput, data[1])
  if (has_match_lens) {
    CloudInput.setMatchLens.call(CloudInput, data[2])
  } else {
    var match_lens = Array()
    for (var i = 0; i < data[1].length; i++) {
      match_lens.push(origin.length)
    }
    CloudInput.setMatchLens.call(CloudInput, match_lens)
  }
  CloudInput.showCandidates.call(CloudInput, true)
}

CloudInputObj.prototype.getNthCandidate = function (n) {
  return this.cands[5 * this.cand_page + n - 1]
}

CloudInputObj.prototype.getNthMatchLen = function (n) {
  return this.cands_rsp[5 * this.cand_page + n - 1]
}

CloudInputObj.prototype.getPreeditText = function () {
  return $('#cloud_input_preedit').text()
}

CloudInputObj.prototype.hideComposition = function () {
  this.type_on = false
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
    .eq(this.cand_index % 5)
    .css({
      color: 'rgba(66, 140, 240, 0.5)',
      'text-shadow': 'rgba(66, 140, 240, 0.5) 1px 2px 2px',
      opacity: '0.9',
    })
  if (this.cand_page == 0) {
    $('.cloud_input_drct').eq(0).css({ visibility: 'hidden' })
  } else {
    $('.cloud_input_drct').eq(0).css({ visibility: 'visible' })
  }
  if ((this.cand_page + 1) * $('.cloud_input_cnd').length >= this.cands.length) {
    $('.cloud_input_drct').eq(1).css({ visibility: 'hidden' })
  } else {
    $('.cloud_input_drct').eq(1).css({ visibility: 'visible' })
  }
}

CloudInputObj.prototype.init = function () {
  this.addCSSandHTML()
  this.bindEvents()
  $('#cloud_input_composition').css({
    top: this.new_in.offset().top + this.new_in.height() + 'px',
    left: this.new_in.offset().left + 'px',
  })
}

CloudInputObj.prototype.isLatin = function (code) {
  return code < 128
}

CloudInputObj.prototype.nthCandidateExists = function (n) {
  return 5 * this.cand_page + n - 1 < this.cands.length
}

CloudInputObj.prototype.selectCandidate = function (selection) {
  //console.log(selection);
  if (!this.nthCandidateExists(selection)) {
    return
  }
  var tmp_cand = this.getNthCandidate(selection)
  var tmp_pre = this.getPreeditText()
  var chinese_len = 0
  for (var i = 0; i < tmp_pre.length; i++) {
    //console.log(tmp_pre.charAt(i));
    if (this.isLatin(tmp_pre.charCodeAt(i)) == true) {
      chinese_len = i
      break
    }
  }
  //console.log(chinese_len);
  var fin_pre = ''
  fin_pre = tmp_pre.substring(0, chinese_len)
  fin_pre += tmp_cand
  if (tmp_pre.substr(chinese_len + this.getNthMatchLen(selection)).length == 0) {
    this.setPreeditText(fin_pre)
    this.commitText()
    this.hideComposition()
    this.clearCandidate()
  } else {
    fin_pre += tmp_pre.substr(chinese_len + this.getNthMatchLen(selection))
    this.setPreeditText(fin_pre)
    this.fetchCandidateAsync()
  }
}

CloudInputObj.prototype.setCandidates = function (candidates) {
  this.cands = candidates
}

CloudInputObj.prototype.setMatchLens = function (match_lens) {
  this.cands_rsp = match_lens
}

CloudInputObj.prototype.setPreeditText = function (str) {
  $('#cloud_input_preedit').text(str)
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
  var m = (this.cand_page + 1) * len - this.cands.length > 0 ? this.cands.length % len : len
  for (var i = 0; i < m; i++) {
    var str = ''
    str += i + 1 + '. '
    str += this.cands[i + this.cand_page * 5]
    $('.cloud_input_cnd').eq(i).text(str)
  }
  for (var i = m; i < len; i++) {
    $('.cloud_input_cnd').eq(i).text('')
  }
  this.highBack()
}

CloudInputObj.prototype.showComposition = function () {
  this.type_on = true
  $('#cloud_input_composition').show()
}

CloudInputObj.prototype.showStatus = function () {
  $('#cloud_input_status').show()
}

CloudInputObj.prototype.switchMethod = function (t) {
  this.method = (this.method + 1) % 2
  switch (this.method) {
    case 0:
      this.chi_mode = false
      t.src = en50Png
      break
    case 1:
      this.chi_mode = true
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
  this.turn_on = !this.turn_on
  if (this.turn_on) {
    this.turnOn()
  } else {
    this.turnOff()
  }
}

CloudInputObj.prototype.turnOn = function () {
  this.turn_on = true
  this.showStatus()
}

CloudInputObj.prototype.turnOff = function () {
  this.turn_on = false
  this.setPreeditText('')
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
