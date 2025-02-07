import inputViewHtml from './inputView.html?raw'

export function createInputView(
  onSelectCand: (e: Event, index: number) => void,
  onClickPrevButton: (e: Event) => void,
  onClickNextButton: (e: Event) => void,
) {
  const tableEl = document.createElement('table')
  tableEl.id = 'sime-composition'
  tableEl.setAttribute('cellspacing', '0')
  tableEl.setAttribute('border', '0')
  tableEl.setAttribute('cellpadding', '0')
  const containerHtml = inputViewHtml
  tableEl.innerHTML = containerHtml

  const canEls = tableEl.querySelectorAll('.sime-cnd')
  const prevCandButtonEl = tableEl.querySelector('.sime-prev-cand-button')
  const nextCandButtonEl = tableEl.querySelector('.sime-next-cand-button')

  prevCandButtonEl?.addEventListener('mousedown', onClickPrevButton)
  nextCandButtonEl?.addEventListener('mousedown', onClickNextButton)

  canEls.forEach((el, idx) => {
    el.addEventListener('mousedown', (e) => {
      onSelectCand(e, idx)
    })
  })
  document.body.append(tableEl)

  return {
    dispose() {
      tableEl.remove()
    },
  }
}
