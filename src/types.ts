export interface Options {
  /** 最大拼音长度，默认 128 */
  maxPinyinLength?: number
}

export interface SimpleImeInstance {
  /** 输入法版本号 */
  version: string

  /** 初始化输入法 */
  init: (options?: Options) => void

  /** 切换输入法开关状态 */
  toggleOnOff: () => void

  /** 打开输入法 */
  turnOn: () => void

  /** 关闭输入法 */
  turnOff: () => void

  /** 销毁输入法实例 */
  dispose: () => void
}
