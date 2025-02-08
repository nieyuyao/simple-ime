import banjiaoIcon from '../img/banjiao.png?inline'
import chIcon from '../img/ch.png?inline'
import enIcon from '../img/en.png?inline'
import quanjiaoIcon from '../img/quanjiao.png?inline'
import semiEnIcon from '../img/semi-en.png?inline'
import semiZhIcon from '../img/semi-zh.png?inline'
import statusContentHtml from './status.html?raw'

export function createStatusBar(
  onMethodChange: (e: MouseEvent) => void,
  onShapeChange: (e: MouseEvent) => void,
  onPunctChange: (e: MouseEvent) => void,
) {
  const statusbarEl = document.createElement('div')
  statusbarEl.id = 'sime-status-bar'
  const contentHtml = statusContentHtml
    .replace('{pinyinIcon}', () => chIcon)
    .replace('{caseIcon}', () => quanjiaoIcon)
    .replace('{punctIcon}', () => semiZhIcon)
  statusbarEl.innerHTML = contentHtml
  const methodIcons = [chIcon, enIcon]
  const shapeIcons = [quanjiaoIcon, banjiaoIcon]
  const punctIcons = [semiZhIcon, semiEnIcon]

  const icons = [methodIcons, shapeIcons, punctIcons]
  const currentIconIndexes = [0, 0, 0]

  const statusIconEls = (statusbarEl.querySelectorAll<HTMLImageElement>('.sime-status-icon'))

  const callbacks = [
    onMethodChange,
    onShapeChange,
    onPunctChange,
  ]
  statusIconEls.forEach((el, i) => {
    el.addEventListener('click', (event) => {
      event.preventDefault()
      const idx = (currentIconIndexes[i] + 1) % 2
      currentIconIndexes[i] = idx
      el.src = icons[i][idx]
      callbacks[i](event)
    })
  })

  document.body.append(statusbarEl)

  return {
    hide: () => statusbarEl.style.display = 'none',
    show: () => statusbarEl.style.display = 'flex',
    dispose: () => statusbarEl.remove(),
    updateMethodIcon: () => {
      const methodIconEl = statusIconEls[0]
      const idx = (currentIconIndexes[0] + 1) % 2
      currentIconIndexes[0] = idx
      methodIconEl.src = icons[0][idx]
    },
  }
}
