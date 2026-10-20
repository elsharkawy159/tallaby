/**
 * RED scaffold — ANIM-01, ANIM-02, ANIM-03
 * Tests fail until plan 02 creates AnimationWrapper.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AnimationWrapper } from '@/components/website-builder/animation-wrapper'

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function () { return { observe: vi.fn(), disconnect: vi.fn() } })
  )
})

describe('AnimationWrapper', () => {
  it('ANIM-02: wrapper div has .anim-ready class on mount when animation type is set', async () => {
    const { container } = render(
      <AnimationWrapper animation={{ type: 'fade' }} sectionId="s1">
        <div>content</div>
      </AnimationWrapper>
    )
    await act(async () => {})
    expect(container.firstElementChild?.classList.contains('anim-ready')).toBe(true)
  })

  it('ANIM-03: no wrapper element rendered when animation is undefined (passthrough)', async () => {
    const { container } = render(
      <AnimationWrapper animation={undefined} sectionId="s1">
        <div>content</div>
      </AnimationWrapper>
    )
    await act(async () => {})
    expect(container.querySelector('[data-section-id]')).toBeNull()
  })

  it('ANIM-01: wrapper div has data-section-id attribute when animation type is set', async () => {
    const { container } = render(
      <AnimationWrapper animation={{ type: 'slide' }} sectionId="s1">
        <div>content</div>
      </AnimationWrapper>
    )
    await act(async () => {})
    expect(container.querySelector('[data-section-id="s1"]')).not.toBeNull()
  })
})
