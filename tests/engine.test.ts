import type { Candidate } from '../src/types'
import { describe, expect, it } from 'vitest'
import {
  backwardLookupCandidates,
  forwardLookupCandidates,
  mergeSegments,
  requestCandidates,
} from '../src/engine'

function hasDuplicateCandidate(candidates: Candidate[]) {
  const set = new Set(candidates.map(cand => cand.w))
  return set.size !== candidates.length
}

describe('test engine', () => {
  it('mergeSegments', () => {
    expect(mergeSegments(['ni', 'hao'], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(["ni'", 'hao'], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(["'ni'", 'hao'], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(["'ni'", "'hao"], 0, 1).pinyin).toBe('nihao')
    expect(mergeSegments(["''", "''"], 0, 1).pinyin).toBe('')
  })

  it('forwardLookupCandidates', () => {
    const lookUpOpts = { limit: 2 }
    expect(forwardLookupCandidates(['ni'], 0, lookUpOpts)[0].w).toBe('你')
    expect(forwardLookupCandidates(['zen', 'me', 'yang'], 2, lookUpOpts)[0].w).toBe('怎么样')
    expect(forwardLookupCandidates(['ni', 'a', 'hao'], 2, lookUpOpts)[0].w).toBe('年好')
    expect(forwardLookupCandidates(['bu', 'zhi', 'dao'], 2, lookUpOpts)[0].w).toBe('不知到')
    expect(forwardLookupCandidates(["ni'", 'hao'], 1, lookUpOpts)[0].w).toBe('你好')
    expect(forwardLookupCandidates(['nii'], 0, lookUpOpts)[0].w).toBe('nii')
    expect(forwardLookupCandidates(['ni', 'ii'], 1, lookUpOpts)[0].w).toBe('你ii')
    expect(forwardLookupCandidates(['kongjianzhan'], 0, lookUpOpts)[0].w).toBe('空间站')
    expect(forwardLookupCandidates(['ni', 'a'], 1, lookUpOpts)[0].w).toBe('年')
  })

  it('backwardLookupCandidates', () => {
    const lookUpOpts = { limit: 2 }
    expect(backwardLookupCandidates(['ni'], 0, lookUpOpts)[0].w).toBe('你')
    expect(backwardLookupCandidates(['zen', 'me', 'yang'], 2, lookUpOpts)[0].w).toBe('怎么样')
    expect(backwardLookupCandidates(['ni', 'a', 'hao'], 2, lookUpOpts)[0].w).toBe('你啊好')
    expect(backwardLookupCandidates(['bu', 'zhi', 'dao'], 2, lookUpOpts)[0].w).toBe('不知到')
    expect(backwardLookupCandidates(["ni'", 'hao'], 1, lookUpOpts)[0].w).toBe('你好')
    expect(backwardLookupCandidates(['niiii'], 0, lookUpOpts)[0].w).toBe('niiii')
    expect(backwardLookupCandidates(['ni', 'ii'], 1, lookUpOpts)[0].w).toBe('你ii')
    expect(backwardLookupCandidates(['kongjianzhan'], 0, lookUpOpts)[0].w).toBe('空间站')
    expect(backwardLookupCandidates(['i', 'i'], 1, lookUpOpts)[0].w).toBe('ii')
    expect(backwardLookupCandidates(['xiao', 'ku'], 1, lookUpOpts)[0].w).toBe('😂')
    // fuzzy
    expect(backwardLookupCandidates(['z', 'g'], 1, lookUpOpts)[0].w).toEqual('这个')
    expect(backwardLookupCandidates(['c', 'j'], 1, lookUpOpts)[0].w).toEqual('参加')

    console.log(requestCandidates('nih'))
  })

  it('requestCandidates', () => {
    expect(requestCandidates('nichifanleme').candidates.length).toBeGreaterThan(0)
    expect(requestCandidates('iiiiiiii').candidates.length).toBeGreaterThan(0)
    expect(requestCandidates("ii'i'i''iiii").candidates.length).toBeGreaterThan(0)
    expect(requestCandidates('xiaokule').candidates.length).toBeGreaterThan(0)
    expect(requestCandidates('nihaodededexiaokuelelelelelelele').candidates.length).toBeGreaterThan(
      0,
    )
    expect(
      requestCandidates('wobuanguanzhidaogaizenmbannenihusonechifanlemewohuzhidaoa').candidates
        .length,
    ).toBeGreaterThan(0)
    expect(
      requestCandidates(
        'wobuanguanzhidaogaizenmbannenihusnechifanlemewohuzhidaoawobuanguanzhidaogaizenmbannenihusonechifanlemewohuzhidaoawobuanguanzhidaogaizenmbannenihusonechifanlemewohuzhidaoawobuanguanzhidaogaizenmbannenihusonechifanlemewohuzhidaoawobuanguanzhidaogaizenmbannenihusonechifanlemewohuzhidaoa',
      ).candidates.length,
    ).toBeGreaterThan(0)
  })

  it('should not include duplicate candidates', () => {
    expect(hasDuplicateCandidate(requestCandidates('nihao').candidates)).toBeFalsy()
    expect(hasDuplicateCandidate(requestCandidates('meiyoushenme').candidates)).toBeFalsy()
  })
})
