import banjiaoIcon from '../img/banjiao.png?inline'
import dragIcon from '../img/drag.png?inline'
import enIcon from '../img/en.png?inline'
import chIcon from '../img/pin.png?inline'
import quanjiaoIcon from '../img/quanjiao.png?inline'
import semiEnIcon from '../img/semi-en.png?inline'
import semiZhIcon from '../img/semi-zh.png?inline'
import statusContentHtml from './status.html?raw'

interface MousePosition { x: number, y: number }

function dragStatusbar(draggedEel: HTMLImageElement, targetEl: HTMLElement) {
  const lastPos: MousePosition = { x: 0, y: 0 }
  const lastElBounding: MousePosition & { width: number, height: number } = { x: 0, y: 0, width: 0, height: 0 }
  let enableDrag = false
  const onmousedown = (e: MouseEvent) => {
    if (e.target !== draggedEel) {
      return
    }
    const rect = targetEl.getBoundingClientRect()
    lastPos.x = e.clientX
    lastPos.y = e.clientY
    lastElBounding.x = rect.x
    lastElBounding.y = rect.y
    lastElBounding.width = rect.width
    lastElBounding.height = rect.height
    enableDrag = true
  }
  const onmousemove = (e: MouseEvent) => {
    if (!enableDrag) {
      return
    }
    const dx = e.clientX - lastPos.x
    const dy = e.clientY - lastPos.y
    let newLeft = lastElBounding.x + dx
    let newTop = lastElBounding.y + dy
    if (newLeft <= 0) {
      newLeft = 0
    }
    else if (newLeft + lastElBounding.width >= window.innerWidth) {
      newLeft = window.innerWidth - lastElBounding.width
    }
    if (newTop <= 0) {
      newTop = 0
    }
    else if (newTop + lastElBounding.height >= window.innerHeight) {
      newTop = window.innerHeight - lastElBounding.height
    }
    targetEl.style.left = `${newLeft}px`
    targetEl.style.top = `${newTop}px`
  }
  const mouseleave = () => enableDrag = false
  document.addEventListener('mousedown', onmousedown)
  document.addEventListener('mousemove', onmousemove)
  document.addEventListener('mouseup', mouseleave)
  document.addEventListener('mouseleave', mouseleave)

  return {
    unbindEventHandlers() {
      document.removeEventListener('mousedown', onmousedown)
      document.removeEventListener('mousemove', onmousemove)
      document.removeEventListener('mouseup', mouseleave)
      document.removeEventListener('mouseleave', mouseleave)
    },
  }
}

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
    .replace('{dragIcon}', dragIcon)
  statusbarEl.innerHTML = contentHtml
  const methodIcons = [chIcon, enIcon]
  const shapeIcons = [quanjiaoIcon, banjiaoIcon]
  const punctIcons = [semiZhIcon, semiEnIcon]

  let dragDisposer: ReturnType<typeof dragStatusbar> | null = null

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

  const dragEl = statusbarEl.querySelector<HTMLImageElement>('.sime-status-drag-icon')

  if (dragEl) {
    dragDisposer = dragStatusbar(dragEl, statusbarEl)
  }

  document.body.append(statusbarEl)

  return {
    hide: () => statusbarEl.style.display = 'none',
    show: () => statusbarEl.style.display = 'flex',
    dispose: () => {
      statusbarEl.remove()
      dragDisposer?.unbindEventHandlers()
    },
  }
}
