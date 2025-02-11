## Simple Ime

![CI](https://github.com/nieyuyao/simple-ime/workflows/CI/badge.svg)
![latest tag](https://badgen.net/github/release/nieyuyao/simple-ime)
![npm](https://img.shields.io/npm/v/simple-ime.svg)

一个简易的web拼音输入法工具

[英文文档](./README-en.md)

<img src="./public/demo.png" width="240" />

与[Goole Input tools](https://www.google.com/inputtools/try/)相比，它携带了一个本地词库，因此不需要联网查询就可以完成拼音转换。
相应的，由于词库的原因，包体积无法做到很小。此外，不支持`iframe`。

## 快捷键

| 快捷键 | 描述 |
| --- | --- |
| ↑ | 向上翻页 |
| ↓ | 向下翻页 |
| + | 向上翻页 |
| - | 向下翻页 |
| ← | 向左切换候选词 |
| → | 向右换候选词 |
| < | 向左切换候选词 |
| > | 向左切换候选词 |
| Shift | 切换英/拼 |
| Enter | 直接键入转换后内容 |
| [ | 左移输入法上的光标 |
| ] | 右移输入法上的光标 |

## 安装

> npm install simple-ime

## 使用

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

创建一个SimpleIme实例

`function createSimpleIme(): SimpleImeInstance`

### SimpleImeInstance

#### 属性:

##### version

ime的版本

`version: string`

#### Methods:

##### turnOn

打开ime

`function turnOn(): void`

##### turnOff

关闭ime

`function turnOff(): void`

##### toggleOnOff

开关ime

`function toggleOnOff(): void`

##### dispose

销毁ime实例

`function dispose(): void`

## 开发

执行`npm run dev`，打开页面`http://localhost:xxx`

## 构建

```shell
npm run build
```

## 感谢

- 输入框的实现参考了 [CloudInput](https://github.com/mzhangdev/CloudInput)，它提供了输入法前后端的实现
- 感谢[web-pinyin-ime](https://github.com/dongyuwei/web-pinyin-ime) ，它提供了生成词典以及优化查询速度的方法
