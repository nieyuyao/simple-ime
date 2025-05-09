export interface SimpleImeInstance {
  /** 输入法版本号 */
  version: string

  /** 切换输入法开关状态 */
  toggleOnOff: () => void

  /** 打开输入法 */
  turnOn: () => void

  /** 关闭输入法 */
  turnOff: () => void

  /** 销毁输入法实例 */
  dispose: () => void
}

export interface Candidate {
  f: number
  w: string
  matchLength: number
}

export interface DictWord {
  w: string
  f: number
}

// [ni, hao, wo, chi, fan, le]
export type PinyinSyllables = string[]

export interface ImeOptions {
  maxPinyinLength: number
}
