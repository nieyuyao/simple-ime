import { describe, expect, it } from 'vitest'
import { getCandidates } from '../src/engine'

describe('test engine output', () => {
  it('getCandidates', () => {
    expect(getCandidates('i')).toEqual([['i', 'I'], [1, 1]])
  })
})
