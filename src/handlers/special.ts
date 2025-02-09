const specialCharMap: Record<string, string | [string, number]> = {
  '~': '～',
  '!': '！',
  '$': '￥',
  '^': '……',
  '*': '×',
  '(': '（',
  ')': '）',
  '-': '－',
  '_': '——',
  '[': '【',
  ']': '】',
  '{': '｛',
  '}': '｝',
  '\\': '、',
  ';': '；',
  ':': '：',
  '\'': ['‘’', 0],
  '"': ['“”', 0],
  '/': '／',
  '?': '？',
}

export function handleSpecial(c: string): string | null {
  if (!specialCharMap[c]) {
    return null
  }
  if (Array.isArray(specialCharMap[c])) {
    const [converted, idx] = specialCharMap[c]
    specialCharMap[c][1] = (idx + 1) % converted.length
    return converted.charAt(idx)
  }
  return specialCharMap[c]
}
