/**
 * Wave 0 scaffolding — SYNC-01
 * Tests are RED today; Plan 02 will add `onChange` prop to InlineEditableText to flip GREEN.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

// Mock heavy workspace UI imports
vi.mock('@workspace/ui/components/button', () => ({
  Button: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...rest}>{children}</button>
  ),
}))
vi.mock('@workspace/ui/components/toggle-group', () => ({
  ToggleGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ToggleGroupItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))
vi.mock('@workspace/ui/components/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))
vi.mock('@workspace/ui/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))
vi.mock('lucide-react', () => ({
  Bold: () => null,
  Italic: () => null,
  AlignLeft: () => null,
  AlignCenter: () => null,
  AlignRight: () => null,
}))

import { InlineEditableText } from '@/components/website-builder/inline-editable'

describe('InlineEditableText live sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onChange on input when focused and not in preview mode', async () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()

    const { getByTestId } = render(
      <InlineEditableText
        value="Hello"
        as="h2"
        onChange={onChange}
        onCommit={onCommit}
        data-testid="inline-editable"
      />
    )

    const el = getByTestId('inline-editable')

    // Enter focused mode
    fireEvent.doubleClick(el)

    // Fire input event with updated innerText
    Object.defineProperty(el, 'innerText', { value: 'Hello World', configurable: true })
    fireEvent.input(el)

    expect(onChange).toHaveBeenCalledWith('Hello World')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('still calls onCommit on blur as a safety flush (D-02)', async () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()

    const { getByTestId } = render(
      <InlineEditableText
        value="Hello"
        as="h2"
        onChange={onChange}
        onCommit={onCommit}
        data-testid="inline-editable"
      />
    )

    const el = getByTestId('inline-editable')

    fireEvent.doubleClick(el)
    Object.defineProperty(el, 'innerText', { value: 'Hello World', configurable: true })
    fireEvent.input(el)
    fireEvent.blur(el)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('Hello World')
  })

  it('does not call onChange when isPreview is true', () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()

    const { getByTestId } = render(
      <InlineEditableText
        value="Hello"
        as="h2"
        isPreview={true}
        onChange={onChange}
        onCommit={onCommit}
        data-testid="inline-editable"
      />
    )

    const el = getByTestId('inline-editable')

    fireEvent.doubleClick(el)
    Object.defineProperty(el, 'innerText', { value: 'Hello World', configurable: true })
    fireEvent.input(el)

    expect(onChange).not.toHaveBeenCalled()
  })
})
