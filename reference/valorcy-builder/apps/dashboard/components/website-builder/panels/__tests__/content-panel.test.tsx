/**
 * Wave 0 scaffolding — SYNC-01 / SYNC-02 freeform branch
 * Tests are RED today; Plan 03 will implement the custom-section branch in ContentPanel.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// --- Module mocks (must precede store import) ---

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

vi.mock('@/lib/builder/section-migrations', () => ({
  applyMigrations: vi.fn((s) => s),
}))

// Mock sectionRegistry: custom sections won't be in the real registry
vi.mock('@/components/sections', () => ({
  sectionRegistry: {
    get: vi.fn(() => undefined),
  },
}))

// Mock workspace UI components
vi.mock('@workspace/ui/components/button', () => ({
  Button: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick}>{children}</button>
  ),
}))
vi.mock('@workspace/ui/components/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))
vi.mock('@workspace/ui/components/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}))
vi.mock('@workspace/ui/components/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}))
vi.mock('@workspace/ui/components/label', () => ({
  Label: ({ children, htmlFor }: React.PropsWithChildren<{ htmlFor?: string }>) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))
vi.mock('@workspace/ui/components/separator', () => ({
  Separator: () => <hr />,
}))
vi.mock('@workspace/ui/components/accordion', () => ({
  Accordion: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AccordionContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AccordionItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AccordionTrigger: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
}))
vi.mock('@/components/website-builder/controls', () => ({
  ColorInput: () => null,
  StyleSelect: () => null,
}))
vi.mock('lucide-react', () => ({
  ChevronDown: () => null,
  ChevronUp: () => null,
  Copy: () => null,
  Trash2: () => null,
}))

import { useBuilderStore } from '@/lib/builder/store'
import { ContentPanel } from '@/components/website-builder/panels/content-panel'
import type { ComponentNode } from '@/lib/builder/component-node'
import type { SectionInstance } from '@/components/sections/registry.types'

// Helper: build a minimal SectionInstance for custom sections
function makeCustomInstance(id: string, componentTree: ComponentNode[]): SectionInstance {
  return {
    id,
    sectionId: 'custom',
    props: { componentTree },
    // SectionInstance shape from registry.types — fill required fields
  } as unknown as SectionInstance
}

const INITIAL_STORE_SUBSET = {
  sections: [],
  selectedSectionId: null,
}

describe('ContentPanel custom-section branch', () => {
  beforeEach(() => {
    useBuilderStore.setState(INITIAL_STORE_SUBSET)
  })

  afterEach(() => {
    useBuilderStore.setState(INITIAL_STORE_SUBSET)
    vi.clearAllMocks()
  })

  it('renders empty state when custom section has no text-bearing nodes', () => {
    const instance = makeCustomInstance('sec-1', [
      { id: 'c1', type: 'div', props: {}, children: [] },
    ])
    useBuilderStore.setState({
      sections: [instance],
      selectedSectionId: 'sec-1',
    })

    render(<ContentPanel />)

    expect(screen.getByText(/No editable text fields/i)).toBeTruthy()
  })

  it('renders one Input per text-bearing node with Type+index labels', () => {
    const instance = makeCustomInstance('sec-2', [
      { id: 'h1', type: 'heading', props: { text: 'Hello', level: 2 }, children: [] },
      { id: 'b1', type: 'button', props: { text: 'Click' }, children: [] },
      { id: 'h2', type: 'heading', props: { text: 'World', level: 3 }, children: [] },
    ])
    useBuilderStore.setState({
      sections: [instance],
      selectedSectionId: 'sec-2',
    })

    render(<ContentPanel />)

    expect(screen.getByText('Heading 1')).toBeTruthy()
    expect(screen.getByText('Button 1')).toBeTruthy()
    expect(screen.getByText('Heading 2')).toBeTruthy()

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    const values = inputs.map((i) => i.value)
    expect(values).toContain('Hello')
    expect(values).toContain('Click')
    expect(values).toContain('World')
  })

  it('editing a freeform field calls updateComponentNodeProps with { text: newValue } (D-07)', () => {
    const instance = makeCustomInstance('sec-3', [
      { id: 'h1', type: 'heading', props: { text: 'Hello', level: 2 }, children: [] },
      { id: 'b1', type: 'button', props: { text: 'Click' }, children: [] },
      { id: 'h2', type: 'heading', props: { text: 'World', level: 3 }, children: [] },
    ])
    // Inject a mock for the action instead of spying on the live store method:
    // `vi.spyOn` on a store-state method leaves a non-configurable descriptor
    // that Vitest's global restoreAllMocks can't roll back.
    const spy = vi.fn()
    useBuilderStore.setState({
      sections: [instance],
      selectedSectionId: 'sec-3',
      updateComponentNodeProps: spy,
    })

    render(<ContentPanel />)

    // Find input labeled "Heading 1"
    const label = screen.getByText('Heading 1')
    const inputId = label.getAttribute('for')
    const input = inputId
      ? document.getElementById(inputId)
      : screen.getAllByRole('textbox')[0]

    fireEvent.change(input!, { target: { value: 'Hi' } })

    expect(spy).toHaveBeenCalledWith('sec-3', 'h1', { text: 'Hi' })
  })

  it('excludes container-type nodes from the field list but surfaces nested text nodes (D-06)', () => {
    const instance = makeCustomInstance('sec-4', [
      {
        id: 'd1',
        type: 'div',
        props: {},
        children: [
          { id: 'h1', type: 'heading', props: { text: 'Inner' }, children: [] },
        ],
      },
    ])
    useBuilderStore.setState({
      sections: [instance],
      selectedSectionId: 'sec-4',
    })

    render(<ContentPanel />)

    // Container should NOT appear as a label
    expect(screen.queryByText('Div 1')).toBeNull()
    // Nested text node SHOULD appear
    expect(screen.getByText('Heading 1')).toBeTruthy()
  })
})
