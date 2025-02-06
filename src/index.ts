import type { Options, SimpleImeInstance } from './types'
import { SimpleIme } from './simple-ime'

export type { Options, SimpleImeInstance }

export function createSimpleIme(options?: Options): SimpleImeInstance {
  const ime = new SimpleIme()
  ime.init(options)
  return ime
}
