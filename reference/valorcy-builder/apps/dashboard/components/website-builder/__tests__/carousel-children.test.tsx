// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ComponentNode } from '@/lib/builder/component-node'

// ResizeObserver (needed by @dnd-kit/dom at import time) is polyfilled globally
// in __tests__/setup/dom-polyfills.ts.

// Replace the embla-backed carousel with plain divs — embla needs real layout
// measurement (ResizeObserver) that jsdom does not provide.
vi.mock('@workspace/ui/components/carousel', () => ({
  Carousel: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="carousel">{children}</div>
  ),
  CarouselContent: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CarouselItem: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="carousel-item">{children}</div>
  ),
  CarouselNext: () => <button data-testid="carousel-next" />,
  CarouselPrevious: () => <button data-testid="carousel-prev" />,
}))

import { StaticComponentTreeRenderer } from '@/components/website-builder/component-tree-renderer'

let nodeSeq = 0
function node (
  type: ComponentNode['type'],
  props: Record<string, unknown> = {},
  children: ComponentNode[] = []
): ComponentNode {
  return { id: `n${++nodeSeq}`, type, props, children }
}

describe('shadcn-carousel children rendering', () => {
  it('renders each direct child as one slide', () => {
    const tree: ComponentNode[] = [
      node('shadcn-carousel', {}, [
        node('shadcn-card', {}, [node('paragraph', { text: 'Great product.' })]),
        node('shadcn-card', {}, [node('paragraph', { text: 'Love it.' })]),
        node('shadcn-card', {}, [node('paragraph', { text: 'Five stars.' })]),
      ]),
    ]
    const { getAllByTestId, getByText, queryByText } = render(
      <StaticComponentTreeRenderer sectionId="sec1" tree={tree} />
    )
    expect(getAllByTestId('carousel-item')).toHaveLength(3)
    expect(getByText('Great product.')).toBeTruthy()
    expect(getByText('Five stars.')).toBeTruthy()
    // No placeholder slides when real children exist.
    expect(queryByText('Slide 1')).toBeNull()
  })

  it('falls back to placeholder slides when the carousel has no children', () => {
    const tree: ComponentNode[] = [node('shadcn-carousel')]
    const { getAllByTestId, getByText } = render(
      <StaticComponentTreeRenderer sectionId="sec1" tree={tree} />
    )
    expect(getAllByTestId('carousel-item')).toHaveLength(2)
    expect(getByText('Slide 1')).toBeTruthy()
    expect(getByText('Slide 2')).toBeTruthy()
  })
})
