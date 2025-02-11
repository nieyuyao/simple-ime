## Simple Ime

![CI](https://github.com/nieyuyao/simple-ime/workflows/CI/badge.svg)
![latest tag](https://badgen.net/github/release/nieyuyao/simple-ime)
![npm](https://img.shields.io/npm/v/simple-ime.svg)

A simple browser tool to use Chinese Pinyin Input Method (IME).

<img src="./public/demo.png" width="240" />

Compared with [Goole Input tools](https://www.google.com/inputtools/try/), it carries a local dictionary, so there is no need to connect the server to complete the pinyin conversion.
Accordingly, due to the local dictionary, the bundle cannot be very small. In addition, `iframe` is not supported.

## Some hotkeys

| Hotkey | Description |
| --- | --- |
| ↑ | Page up |
| ↓ | Page down |
| + | Page up |
| - | Page down |
| ← | Switch to the previous candidate word |
| → | Switch to the next candidate word  |
| < | Switch to the previous candidate word  |
| > | Switch to the next candidate word  |
| Shift | Toggle En and pinyin |
| Enter | Type the current result directly |
| [ | Move the cursor on input of ime to left |
| ] |  Move the cursor on input of ime to right |

## Install

> npm install simple-ime

## Usage

```js
import { createSimpleIme } from 'simple-ime'

const ime = createSimpleIme()

// turn on ime
ime.turnOn()

// turn off ime
ime.turnOff()
```

## APIs

### createSimpleIme

Create ime instance.

`function createSimpleIme(): SimpleImeInstance`

### SimpleImeInstance

#### Properties:

##### version

Version of ime.

`version: string`

#### Methods:

##### turnOn

Turn on the ime.

`function turnOn(): void`

##### turnOff

Turn off the ime.

`function turnOff(): void`

##### toggleOnOff

Toggle the ime.

`function toggleOnOff(): void`

##### dispose

Destroy the ime instance.

`function dispose(): void`

## Development

Run `npm run dev` and then open browser.

## Build

```shell
npm run build
```

## Credits

- The input part of the implementation is heavily inspired by [CloudInput](https://github.com/mzhangdev/CloudInput).
- Thanks to [web-pinyin-ime](https://github.com/dongyuwei/web-pinyin-ime). It provides a way to generate dictionary and optimize query speed.