export const dispatchEvent = (element, type) => {
  // TODO: composition event
  const event = new CustomEvent(type, { bubbles: true, cancelable: true, detail: {
    __source__: 'cloud_input'
  } })
  event.isFake = true
  element.dispatchEvent(event)
}