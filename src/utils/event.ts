export function isCompositionEvent(type: string) {
  return ['compositionstart', 'compositionupdate', 'compositionend'].includes(type)
}

export function dispatchInputEvent(element: Element, type: string) {
  const event = new CustomEvent(type, {
    bubbles: true,
    cancelable: true,
    detail: {
      __source__: 'simple-ime',
      isFake: true,
    },
  })
  element.dispatchEvent(event)
}

export function dispatchCompositionEvent(element: Element, type: 'compositionstart' | 'compositionupdate' | 'compositionend', data: string) {
  const event = new CompositionEvent(type, {
    bubbles: true,
    cancelable: true,
    data,
  })
  element.dispatchEvent(event)
}
