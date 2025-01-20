export const isCompositionEvent = (type: string) => {
  return ['compositionstart', 'compositionupdate', 'compositionend'].includes(type)
}

export const dispatchInputEvent = (element: HTMLElement, type: string) => {
  const event = new CustomEvent(type, {
    bubbles: true,
    cancelable: true,
    detail: {
      __source__: 'cloud_input',
      isFake: true,
    },
  })
  element.dispatchEvent(event)
}

export const dispatchCompositionEvent = (
  element: HTMLElement,
  type: 'compositionstart' | 'compositionupdate' | 'compositionend',
  data: string
) => {
  const event = new CompositionEvent(type, {
    bubbles: true,
    cancelable: true,
    data,
  })
  element.dispatchEvent(event)
}
