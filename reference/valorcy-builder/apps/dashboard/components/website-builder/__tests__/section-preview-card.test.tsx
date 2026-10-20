/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import { SectionPreviewCard } from '@/components/website-builder/section-preview-card'
import type { SectionInstance } from '@/components/sections/registry.types'

vi.mock('@/components/website-builder/section-ui-preview', () => ({
  SectionUiPreview: () => <div data-testid="section-ui-preview">Preview</div>,
}))

const mockStoreState = {
  designSystem: {},
  projectLogoUrl: null,
  projectName: 'Test Project',
  defaultLocale: 'en',
  supportedLocales: ['en'],
}

vi.mock('@/lib/builder/store', () => ({
  useBuilderStore: vi.fn((selector?: (s: typeof mockStoreState) => unknown) => {
    if (typeof selector === 'function') return selector(mockStoreState)
    return mockStoreState
  }),
}))

const previewInstance: SectionInstance = {
  id: 'palette-preview-test',
  sectionId: 'hero-centered',
  version: 1,
  props: {},
}

describe('SectionPreviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens detail dialog when preview button is clicked without calling card onClick', () => {
    const onClick = vi.fn()

    render(
      <SectionPreviewCard
        instance={previewInstance}
        label="Hero Centered"
        onClick={onClick}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Preview section' }))

    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Hero Centered' })).toBeTruthy()
  })

  it('calls card onClick when clicking the card body outside the preview button', () => {
    const onClick = vi.fn()

    render(
      <SectionPreviewCard
        instance={previewInstance}
        label="Hero Centered"
        onClick={onClick}
      />,
    )

    fireEvent.click(screen.getByText('Hero Centered'))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows Use section in detail dialog when card is clickable', () => {
    const onClick = vi.fn()

    render(
      <SectionPreviewCard
        instance={previewInstance}
        label="Hero Centered"
        onClick={onClick}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Preview section' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use section' }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
