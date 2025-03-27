export function nearSwapCorrector(s: string, pinyinSet: Set<string>): string[] {
  if (s.length <= 0) {
    return []
  }
  if (s.length > 5) {
    return []
  }
  const res: Array<string> = []
  for (const s2 of pinyinSet) {
    if (s2.length !== s.length) {
      continue
    }
    for (let i = 0; i < s.length; i++) {
      if (s[i] === s2[i]) {
        continue
      }
      // swap s[i] and s[i + 1]
      if (s[i + 1] === s2[i] && s[i] === s2[i + 1] && s.slice(i + 2) === s2.slice(i + 2)) {
        res.push(s2)
      }
      else {
        break
      }
    }
  }
  return res
}

export function calcDamerauLevenshteinDistance(s1: string, s2: string): number {
  const dp: Array<Array<number>> = [[0]]
  const len1 = s1.length
  const len2 = s2.length
  for (let i = 1; i <= len1; i++) {
    dp[i] = [i]
  }
  for (let i = 1; i <= len2; i++) {
    dp[0][i] = i
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        s1[i - 1] && s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : dp[i - 1][j - 1] + 1,
      )

      if (i > 1 && j > 1 && s1[i - 2] === s2[j - 1] && s1[i - 1] === s2[j - 2]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1)
      }
    }
  }
  return dp[len1][len2]
}

// Damerau Levenshtein Distance https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
// https://github.com/rime/librime/blob/1c23358157934bd6e6d6981f0c0164f05393b497/src/rime/dict/corrector.cc#L192C1-L192C43
export function damerauLevenshteinDistanceCorrector(s: string, pinyinSet: Set<string>, threshold: number): string[] {
  if (s.length <= 0 || s.length > 5 + threshold) {
    return []
  }
  let minD = threshold + 1
  const res: Array<{ d: number, s: string, diff: number }> = []
  for (const s2 of pinyinSet) {
    const d = calcDamerauLevenshteinDistance(s, s2)
    minD = Math.min(minD, d)
    if (d <= threshold) {
      res.push({ d, s: s2, diff: Math.abs(s.length - s2.length) })
    }
  }
  return res
    .filter(r => r.d <= minD)
    .sort((a, b) => a.diff - b.diff)
    .map(r => r.s)
}

export function calcLevenshteinDistance(s1: string, s2: string): number {
  if (s1.length === 0) {
    return s2.length
  }
  if (s2.length === 0) {
    return s1.length
  }
  const dp: Array<Array<number>> = [[0]]
  const len1 = s1.length
  const len2 = s2.length
  for (let i = 1; i <= len1; i++) {
    dp[i] = [i]
  }
  for (let i = 1; i <= len2; i++) {
    dp[0][i] = i
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        s1[i - 1] && s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : dp[i - 1][j - 1] + 1,
      )
    }
  }
  return dp[len1][len2]
}

// Levenshtein Distance
// https://github.com/rime/librime/blob/1c23358157934bd6e6d6981f0c0164f05393b497/src/rime/dict/corrector.cc#L163
export function levenshteinDistanceCorrector(s: string, pinyinSet: Set<string>, threshold: number): string[] {
  if (s.length <= 0 || s.length > 5 + threshold) {
    return []
  }
  const res: Array<{ d: number, s: string, diff: number }> = []
  let minD = threshold + 1
  for (const s2 of pinyinSet) {
    const d = calcLevenshteinDistance(s, s2)
    minD = Math.min(minD, d)
    if (d <= threshold) {
      res.push({ d, s: s2, diff: Math.abs(s.length - s2.length) })
    }
  }
  return res
    .filter(r => r.d >= minD)
    .sort((a, b) => a.diff - b.diff)
    .map(r => r.s)
}
