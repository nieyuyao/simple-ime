// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { createSimpleIme } from '../src'
import banjiaoIcon from '../src/img/banjiao.png?inline'
import enIcon from '../src/img/en.png?inline'
import pinIcon from '../src/img/pin.png?inline'
import punctEnIcon from '../src/img/punct-en.png?inline'
import punctZhIcon from '../src/img/punct-zh.png?inline'
import quanjiaoIcon from '../src/img/quanjiao.png?inline'

describe.sequential('basic', () => {
  it('turn on/off', () => {
    const ime = createSimpleIme()
    expect(document.getElementById('sime-status-bar')).not.toBeNull()
    expect(document.getElementById('ime-style')).not.toBeNull()
    ime.turnOff()
    expect(document.getElementById('sime-status-bar')?.style.display).toBe('none')
    ime.turnOn()
    expect(document.getElementById('sime-status-bar')?.style.display).toBe('flex')
    ime.dispose()
  })

  it('dispose', () => {
    const ime = createSimpleIme()
    ime.dispose()
    expect(document.getElementById('sime-status-bar')).toBeNull()
    expect(document.getElementById('sime-composition')).toBeNull()
    expect(document.getElementById('ime-style')).toBeNull()
  })

  it('toggle method', () => {
    const ime = createSimpleIme()
    const iconEl = document.querySelector<HTMLImageElement>('.sime-status-pinyin-icon')
    iconEl?.dispatchEvent(new Event('click'))
    expect(iconEl?.src).toEqual(pinIcon)
    iconEl?.dispatchEvent(new Event('click'))
    expect(iconEl?.src).toEqual(enIcon)
    ime.dispose()
  })

  it('toggle shape', () => {
    const ime = createSimpleIme()
    createSimpleIme()
    const iconEl = document.querySelector<HTMLImageElement>('.sime-status-shape-icon')
    iconEl?.dispatchEvent(new Event('click'))
    expect(iconEl?.src).toEqual(quanjiaoIcon)
    iconEl?.dispatchEvent(new Event('click'))
    expect(iconEl?.src).toEqual(banjiaoIcon)
    ime.dispose()
  })

  it('toggle punct', () => {
    const ime = createSimpleIme()
    createSimpleIme()
    const iconEl = document.querySelector<HTMLImageElement>('.sime-status-punct-icon')
    iconEl?.dispatchEvent(new Event('click'))
    expect(iconEl?.src).toEqual(punctZhIcon)
    iconEl?.dispatchEvent(new Event('click'))
    expect(iconEl?.src).toEqual(punctEnIcon)
    ime.dispose()
  })

  it('shift key to toggle pin/en', () => {
    const ime = createSimpleIme()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }))
    expect(document.querySelector<HTMLImageElement>('.sime-status-pinyin-icon')?.src).toEqual(pinIcon)
    ime.dispose()
  })
})
