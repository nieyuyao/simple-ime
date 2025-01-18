export const isEditableElement = (element) => {
  console.log(element)
  if (element.readOnly) {
    return false
  }
  switch (element.tagName.toUpperCase()) {
    case 'TEXTAREA':
      return true
    case 'INPUT':
      return element.type.toUpperCase() == 'TEXT' || element.type.toUpperCase() == 'SEARCH'
    case 'DIV':
      return element.isContentEditable
    case 'IFRAME':
      try {
        console.log(element)
        var ifdoc = i18n.input.common.dom.getSameDomainFrameDoc(element)
        return (
          !!ifdoc &&
          ((ifdoc.designMode && ifdoc.designMode.toUpperCase() == 'ON') ||
            (ifdoc.body && ifdoc.body.isContentEditable))
        )
      } catch (e) {
        return false
      }
  }

  return false
}

const insertContentIntoEditable = (content) => {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) {
    return false
  }
  if (!selection.isCollapsed) {
    // 将已选中内容删除，删除后，selection 的属性会自动更新，后续不必重新获取 selection
    selection.deleteFromDocument()
  }
  // 根据已有第一个 range ，clone 创建一个新的 range
  const range = selection.getRangeAt(0).cloneRange()
  // 移除当前所有选区
  selection.removeAllRanges()
  // 创建待插入的文本节点
  const textNode = document.createTextNode(content)
  // 插入新的文本节点
  range.insertNode(textNode)
  // 光标聚焦到尾部
  range.collapse()
  // 将新的 range 添加到选区
  selection.addRange(range)
  return true
}


export const updateContent = (element, str) => {
  let content = ''
  switch (element.tagName.toUpperCase()) {
    case 'TEXTAREA':
    case 'INPUT':
      const insertPos = element.selectionStart
      content = element.value
      if (!content) {
        element.value += str
      } else {
        const front = content.substring(0, insertPos)
        const behind = content.substring(insertPos)
        element.value = front + str + behind
      }
      element.setSelectionRange(insertPos + str.length, insertPos + str.length)
      break
    case 'DIV':
      insertContentIntoEditable(str)
      break
    case 'IFRAME':
      try {
        // TODO:
      } catch (e) {
        return false
      }
  }
}
