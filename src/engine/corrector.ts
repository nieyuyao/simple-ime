export function nearSwapCorrector(pinyin: string, pinyinSet: Set<string>): string[] {
  // TODO:
  console.log(pinyin, pinyinSet)
  return []
}

// Damerau Levenshtein Distance https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
// https://github.com/rime/librime/blob/1c23358157934bd6e6d6981f0c0164f05393b497/src/rime/dict/corrector.cc#L192C1-L192C43
export function damerauLevenshteinDistanceCorrector(pinyin: string, pinyinSet: Set<string>): string[] {
  console.log(pinyin, pinyinSet)
  // TODO:
  return []
}

// Levenshtein Distance
// https://github.com/rime/librime/blob/1c23358157934bd6e6d6981f0c0164f05393b497/src/rime/dict/corrector.cc#L163
export function levenshteinDistanceCorrector(pinyin: string, pinyinSet: Set<string>): string[] {
  console.log(pinyin, pinyinSet)
  // TODO:
  return []
}
