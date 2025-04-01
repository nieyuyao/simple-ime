declare module '*.png?inline' {
  const content: string
  export default content
}

declare module '*.css?inline' {
  const content: string
  export default content
}

declare module '*.scss?inline' {
  const content: string
  export default content
}

declare module '*.html?raw' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.txt?raw' {
  const content: string
  export default content
}

declare interface Window {
  simpleIme: any
}

declare module 'dawg-lookup' {
  export class Trie {
    constructor(words: string)
    pack(): string
  }

  export class PTrie {
    constructor(packed: string)
    isWord(w: string): boolean
    completions(prefix: string): string[]
  }
}
