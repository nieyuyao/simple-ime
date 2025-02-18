import type { SimpleImeInstance } from './types'
import { SimpleIme } from './simple-ime'

export function createSimpleIme(): SimpleImeInstance {
  const ime = new SimpleIme()
  ime.init()
  return ime
}
