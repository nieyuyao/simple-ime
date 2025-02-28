import { describe, expect, it } from 'vitest'
import { backwardLookupCandidates, forwardLookupCandidates, mergeSegments } from '../src/engine'

describe('test engine', () => {
  it('mergeSegments', () => {
    expect(mergeSegments(['ni', 'hao'], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(['ni\'', 'hao'], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(['\'ni\'', 'hao'], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(['\'ni\'', '\'hao'], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(['\'\'', '\'\''], 0, 1).pinyin).toBe('')
  })

  it('forwardLookupCandidates', () => {
    expect(forwardLookupCandidates(['ni'], 0)[0].w).toBe('你')
    expect(forwardLookupCandidates(['zen', 'me', 'yang'], 2)[0].w).toBe('怎么样')
    expect(forwardLookupCandidates(['ni', 'a', 'hao'], 2)[0].w).toBe('你啊hao')
    expect(forwardLookupCandidates(['bu', 'zhi', 'dao'], 2)[0].w).toBe('不知dao')
    expect(forwardLookupCandidates(['ni\'', 'hao'], 1)[0].w).toBe('你好')
    expect(forwardLookupCandidates(['niiii'], 0)[0].w).toBe('niiii')
    expect(forwardLookupCandidates(['ni', 'ii'], 1)[0].w).toBe('你ii')
    expect(forwardLookupCandidates(['kongjianzhan'], 0)[0].w).toBe('空间站')
  })

  it('backwardLookupCandidates', () => {
    expect(backwardLookupCandidates(['ni'], 0)[0].w).toBe('你')
    expect(backwardLookupCandidates(['zen', 'me', 'yang'], 2)[0].w).toBe('怎么样')
    expect(backwardLookupCandidates(['ni', 'a', 'hao'], 2)[0].w).toBe('你啊好')
    expect(backwardLookupCandidates(['bu', 'zhi', 'dao'], 2)[0].w).toBe('不知到')
    expect(backwardLookupCandidates(['ni\'', 'hao'], 1)[0].w).toBe('你好')
    expect(backwardLookupCandidates(['niiii'], 0)[0].w).toBe('niiii')
    expect(backwardLookupCandidates(['ni', 'ii'], 1)[0].w).toBe('你ii')
    expect(backwardLookupCandidates(['kongjianzhan'], 0)[0].w).toBe('空间站')
    expect(backwardLookupCandidates(['i', 'i'], 0)[0].w).toBe('i')
  })
})
