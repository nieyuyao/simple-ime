export function isEditableElement(element) {
  if (element.readOnly) {
    return false
  }
  switch (element.tagName.toUpperCase()) {
    case 'TEXTAREA':
      return true
    case 'INPUT':
      return element.type.toUpperCase() === 'TEXT' || element.type.toUpperCase() === 'SEARCH'
    case 'IFRAME':
      return false
    default:
      return element.isContentEditable
  }
}

function insertContentIntoEditable(content) {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) {
    return false
  }
  if (!selection.isCollapsed) {
    selection.deleteFromDocument()
  }
  const range = selection.getRangeAt(0).cloneRange()
  selection.removeAllRanges()
  const textNode = document.createTextNode(content)
  range.insertNode(textNode)
  range.collapse()
  selection.addRange(range)
  return true
}

export function updateContent(element: Element, str: string) {
  let content = ''
  switch (element.tagName.toUpperCase()) {
    case 'TEXTAREA':
    case 'INPUT':
      {
        const input = element as HTMLInputElement
        const insertPos = input.selectionStart || 0
        content = input.value
        if (!content) {
          input.value += str
        }
        else {
          const front = content.substring(0, insertPos)
          const behind = content.substring(insertPos)
          input.value = front + str + behind
        }
        input.setSelectionRange(insertPos + str.length, insertPos + str.length)
      }
      break
    case 'DIV':
      insertContentIntoEditable(str)
      break
    default:
      return false
  }
}
