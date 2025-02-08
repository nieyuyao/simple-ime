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
  '"': ['‘’', 0],
  '/': '／',
  '?': '？',
}

export function handleSpecial(c: string): string | null {
  if (!specialCharMap[c]) {
    return null
  }
  if (Array.isArray(specialCharMap[c])) {
    const idx = specialCharMap[c][1]
    specialCharMap[c][1] = idx + 1
    return specialCharMap[c][0].charAt(idx)
  }
  return specialCharMap[c]
}
