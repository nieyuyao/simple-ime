import inputViewHtml from './inputView.html?raw'

export function createInputView() {
  const tableEl = document.createElement('table')
  tableEl.id = 'sime-composition'
  tableEl.setAttribute('cellspacing', '0')
  tableEl.setAttribute('border', '0')
  tableEl.setAttribute('cellpadding', '0')
  const containerHtml = inputViewHtml
  tableEl.innerHTML = containerHtml

  document.body.append(tableEl)
}
