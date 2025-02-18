import type { SimpleImeInstance, SimpleImeOptions } from './types'
import { SimpleIme } from './simple-ime'

export function createSimpleIme(options?: Partial<SimpleImeOptions>): SimpleImeInstance {
  const imeOptions: SimpleImeOptions = {
    experimentalAutoSegment: false,
    ...options,
  }
  const ime = new SimpleIme(imeOptions)
  ime.init()
  return ime
}
