/**
 * Wave 0 scaffolding — CTX-01, CTX-03
 * Tests are RED today; Plan 03 will implement CanvasContextMenu to flip GREEN.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'

// Mock heavy workspace UI imports — render children unconditionally so menu items are queryable
vi.mock('@workspace/ui/components/context-menu', () => ({
  ContextMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ContextMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ContextMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ContextMenuSub: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ContextMenuSubContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ContextMenuSubTrigger: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
  ContextMenuSeparator: () => <hr />,
  ContextMenuItem: ({
    children,
    onSelect,
    disabled,
  }: React.PropsWithChildren<{ onSelect?: () => void; disabled?: boolean }>) => (
    <button onClick={onSelect} disabled={disabled}>
      {children}
    </button>
  ),
  ContextMenuCheckboxItem: ({
    children,
    onSelect,
    checked,
  }: React.PropsWithChildren<{ onSelect?: () => void; checked?: boolean }>) => (
    <button onClick={onSelect} aria-checked={checked}>
      {children}
    </button>
  ),
}))

// Use the real lucide-react module so newly added icons (e.g. Bookmark) don't
// break this mock. The icons render as tiny SVGs, which is fine for these
// menu-structure assertions.
vi.mock('lucide-react', async (importOriginal) => {
  return await importOriginal<typeof import('lucide-react')>()
})

// Store mock — seeded per test via mockStoreState
const mockSetSelectedElement = vi.fn()
const mockSetSelectedSection = vi.fn()
const mockDuplicateComponentNode = vi.fn()
const mockCutElement = vi.fn()
const mockCopyElement = vi.fn()
const mockPasteClipboard = vi.fn()
const mockCutSection = vi.fn()
const mockCopySection = vi.fn()

let storeState = {
  clipboard: null as null | { type: string; data: unknown; sourceSectionId: string; sourceNodeId?: string },
  canvasPreview: false,
  selectedElementId: null as string | null,
  selectedSectionId: null as string | null,
}

vi.mock('@/lib/builder/store', () => ({
  useBuilderStore: vi.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      ...storeState,
      setSelectedElement: mockSetSelectedElement,
      setSelectedSection: mockSetSelectedSection,
      duplicateComponentNode: mockDuplicateComponentNode,
      cutElement: mockCutElement,
      copyElement: mockCopyElement,
      pasteClipboard: mockPasteClipboard,
      cutSection: mockCutSection,
      copySection: mockCopySection,
    }
    if (typeof selector === 'function') return selector(state)
    return state
  }),
}))

import { CanvasContextMenu } from '../canvas-context-menu'

describe('CanvasContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeState = {
      clipboard: null,
      canvasPreview: false,
      selectedElementId: null,
      selectedSectionId: null,
    }
  })

  it('renders children without throwing', () => {
    expect(() =>
      render(
        <CanvasContextMenu>
          <div data-element-id="sec-1::n-1">x</div>
        </CanvasContextMenu>
      )
    ).not.toThrow()
  })

  it('end-click on element with data-element-id calls setSelectedElement and setSelectedSection', () => {
    const { getByText } = render(
      <CanvasContextMenu>
        <div data-element-id="sec-1::n-1">element</div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getByText('element'))
    expect(mockSetSelectedElement).toHaveBeenCalledWith('sec-1::n-1')
    expect(mockSetSelectedSection).toHaveBeenCalledWith('sec-1')
  })

  it('end-click on section-only target calls setSelectedSection but NOT setSelectedElement', () => {
    const { getByText } = render(
      <CanvasContextMenu>
        <div data-section-instance-id="sec-1">
          <span>section-child</span>
        </div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getByText('section-child'))
    expect(mockSetSelectedSection).toHaveBeenCalledWith('sec-1')
    expect(mockSetSelectedElement).not.toHaveBeenCalled()
  })

  it('element-id ancestor wins over section-instance-id when both are present', () => {
    const { getByText } = render(
      <CanvasContextMenu>
        <div data-section-instance-id="sec-1">
          <div data-element-id="sec-1::n-1">
            <span>nested</span>
          </div>
        </div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getByText('nested'))
    expect(mockSetSelectedElement).toHaveBeenCalledWith('sec-1::n-1')
    expect(mockSetSelectedSection).toHaveBeenCalledWith('sec-1')
  })

  it('paste item is disabled when clipboard is null (element menu)', () => {
    storeState.clipboard = null
    const { getAllByText } = render(
      <CanvasContextMenu>
        <div data-element-id="sec-1::n-1">elem</div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getAllByText('elem')[0]!)
    const pasteButtons = getAllByText('Paste')
    const disabledPaste = pasteButtons.find((b) => (b as HTMLButtonElement).disabled)
    expect(disabledPaste).toBeDefined()
  })

  it('paste item is NOT disabled when clipboard has element data', () => {
    storeState.clipboard = {
      type: 'element',
      data: { id: 'n-1', type: 'container', props: {}, children: [] },
      sourceSectionId: 'sec-1',
      sourceNodeId: 'n-1',
    }
    const { getAllByText } = render(
      <CanvasContextMenu>
        <div data-element-id="sec-1::n-1">elem</div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getAllByText('elem')[0]!)
    const pasteButtons = getAllByText('Paste')
    const enabledPaste = pasteButtons.find((b) => !(b as HTMLButtonElement).disabled)
    expect(enabledPaste).toBeDefined()
  })

  it('does not call setSelectedElement or setSelectedSection when canvasPreview is true', () => {
    storeState.canvasPreview = true
    const { getByText } = render(
      <CanvasContextMenu>
        <div data-element-id="sec-1::n-1">preview-elem</div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getByText('preview-elem'))
    expect(mockSetSelectedElement).not.toHaveBeenCalled()
    expect(mockSetSelectedSection).not.toHaveBeenCalled()
  })

  it('element-level menu renders Cut, Copy, Paste, Duplicate, Change Tag, Delete', () => {
    const { getByText, getAllByText } = render(
      <CanvasContextMenu>
        <div data-element-id="sec-1::n-1">elem2</div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getAllByText('elem2')[0]!)
    expect(getByText('Cut')).toBeDefined()
    expect(getByText('Copy')).toBeDefined()
    expect(getByText('Paste')).toBeDefined()
    expect(getByText('Duplicate')).toBeDefined()
    expect(getByText('Change Tag')).toBeDefined()
    expect(getByText('Delete')).toBeDefined()
  })

  it('section-level menu renders Cut, Copy, Paste, Duplicate Section, Delete Section — no Change Tag', () => {
    const { getByText, queryByText, getByTestId } = render(
      <CanvasContextMenu>
        <div data-section-instance-id="sec-1" data-testid="sec-wrapper">
          <span>sec-text</span>
        </div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getByTestId('sec-wrapper'))
    expect(getByText('Cut')).toBeDefined()
    expect(getByText('Copy')).toBeDefined()
    expect(getByText('Paste')).toBeDefined()
    expect(getByText('Duplicate Section')).toBeDefined()
    expect(getByText('Delete Section')).toBeDefined()
    expect(queryByText('Change Tag')).toBeNull()
  })

  it('clicking Duplicate element item calls duplicateComponentNode with sectionId and nodeId', () => {
    const { getAllByText, getByText } = render(
      <CanvasContextMenu>
        <div data-element-id="sec-1::n-1">dup-elem</div>
      </CanvasContextMenu>
    )
    fireEvent.contextMenu(getAllByText('dup-elem')[0]!)
    fireEvent.click(getByText('Duplicate'))
    expect(mockDuplicateComponentNode).toHaveBeenCalledTimes(1)
    expect(mockDuplicateComponentNode).toHaveBeenCalledWith('sec-1', 'n-1')
  })
})
