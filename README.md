# Simple Ime
An simple browser tool to use Chinese Pinyin Input Method (IME).

<img src="./public/demo.png" width="240" />

# Install

> npm install simple-ime

# Usage

```js
import { createSimpleIme } from 'simple-ime'

const ime = createSimpleIme()

// turn on ime
ime.turnOn()

// turn off ime
ime.turnOff()
```

# APIs

## createSimpleIme

Create ime instance.

`function createSimpleIme(): SimpleImeInstance`

## SimpleImeInstance

### Properties:

#### version

Version of ime.

`version: string`

### Methods:

#### turnOn

Turn on the ime.

`function turnOn(): void`

#### turnOff

Turn off the ime.

`function turnOff(): void`

#### toggleOnOff

Toggle the ime.

`function toggleOnOff(): void`

#### dispose

Destroy the ime instance.

`function dispose(): void`

# Development

Run `npm run dev` and then open browser.

# Build

```shell
npm run build
```

# Credits

- The frontend part of the implementation is heavily inspired by [CloudInput](https://github.com/mzhangdev/CloudInput).
- Thanks to [web-pinyin-ime](https://github.com/dongyuwei/web-pinyin-ime) for algorithm of generating candidate words.
