import banjiaoIcon from '../img/banjiao.png?inline'
import chIcon from '../img/ch.png?inline'
import enIcon from '../img/en.png?inline'
import quanjiaoIcon from '../img/quanjiao.png?inline'
import semiEnIcon from '../img/semi-en.png?inline'
import semiChIcon from '../img/semi-zh.png?inline'
import toolbarContentHtml from './toolbar.html?raw'

export function createToolbar(
  switchMethod: (event: Event) => void,
  switchShape: (event: Event) => void,
  switchPunct: (event: Event) => void,
) {
  const toolbarEl = document.createElement('div')
  toolbarEl.id = 'sime-toolbar'
  const contentHtml = toolbarContentHtml
    .replace('{pinyinIcon}', () => chIcon)
    .replace('{caseIcon}', () => quanjiaoIcon)
    .replace('{punctIcon}', () => semiChIcon)
  toolbarEl.innerHTML = contentHtml
  const methodIcons = [chIcon, enIcon]
  const shapeIcons = [quanjiaoIcon, banjiaoIcon]
  const punctIcons = [semiChIcon, semiEnIcon]

  const icons = [methodIcons, shapeIcons, punctIcons]
  const currentIconIndexes = [0, 0, 0]

  const toolbarIconEls = (toolbarEl.querySelectorAll<HTMLImageElement>('.sime-toolbar-icon'))

  const callbacks = [
    switchMethod,
    switchShape,
    switchPunct,
  ]
  toolbarIconEls.forEach((el, i) => {
    el.addEventListener('click', (event) => {
      event.preventDefault()
      const idx = (currentIconIndexes[i] + 1) % 2
      currentIconIndexes[i] = idx
      el.src = icons[i][idx]
      callbacks[i](event)
    })
  })

  document.body.append(toolbarEl)

  return {
    hide() {
      toolbarEl.style.display = 'none'
    },
    show() {
      toolbarEl.style.display = 'flex'
    },
    dispose() {
      toolbarEl.remove()
    },
  }
}
