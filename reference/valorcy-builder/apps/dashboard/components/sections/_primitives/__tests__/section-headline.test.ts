import { describe, expect, it } from 'vitest'
import { containsWord } from '@/components/sections/_primitives/section-headline'

describe('containsWord — accentWord duplicate guard', () => {
  it('detects a pack-style accent that is already inside the headline', () => {
    expect(containsWord('Ready to talk?', 'talk')).toBe(true)
    expect(containsWord('Make a stronger first impression', 'Stronger')).toBe(true)
  })

  it('keeps a default-style accent that completes the headline', () => {
    expect(containsWord('Ship your next idea', 'faster')).toBe(false)
  })

  it('ignores empty accents', () => {
    expect(containsWord('Anything', '  ')).toBe(false)
  })
})
