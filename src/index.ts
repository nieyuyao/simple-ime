import type { SimpleImeInstance } from './types'
import { Ime } from './ime'

export function createSimpleIme(): SimpleImeInstance {
  const ime = new Ime()
  ime.init()
  return ime
}
