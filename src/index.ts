import type { Options } from './options'
import { SimpleIme } from './simple-ime'

export function createSimpleIme(options?: Options) {
  const ime = new SimpleIme()
  ime.init(options)
  return ime
}
