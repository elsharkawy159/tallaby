"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { HTMLAttributes } from "react"
import { cn } from "@workspace/ui/lib/utils"
import type { ComponentStyle, DeepPartial } from "@/lib/builder/component-style"

const TAGS = [
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "div",
  "blockquote",
  "footer",
] as const
type EditableTag = (typeof TAGS)[number]

type InlineEditableTextProps = {
  as?: EditableTag
  value: string
  onCommit: (next: string) => void
  onChange?: (next: string) => void
  isPreview?: boolean
  /** When set, show a compact floating format bar that patches section-level typography styles (builder only). */
  onFormatStyle?: (patch: DeepPartial<ComponentStyle>) => void
  /** Current effective styles for toggles (optional). */
  formatStyle?: Partial<ComponentStyle>
} & Omit<
  HTMLAttributes<HTMLElement>,
  "onFocus" | "onBlur" | "onChange" | "value" | "children"
> & {
    onFocus?: HTMLAttributes<HTMLElement>["onFocus"]
    onBlur?: HTMLAttributes<HTMLElement>["onBlur"]
  }

/**
 * Inline text editing for builder canvas; commits on blur.
 */
export function InlineEditableText({
  as = "span",
  value,
  onCommit,
  onChange,
  isPreview,
  onFormatStyle,
  formatStyle,
  onFocus: onParentFocus,
  onBlur: onParentBlur,
  className,
  ...rest
}: InlineEditableTextProps) {
  const Tag = as as React.ElementType
  const [focused, setFocused] = useState(false)
  const showBar = Boolean(!isPreview && onFormatStyle && focused)
  const tagRef = useRef<HTMLElement>(null)

  // Restore innerText from value when entering focused state — React clears
  // children (sets to undefined) on focus to prevent cursor-reset on re-render,
  // so we imperatively seed the DOM content once on the focused=true transition.
  useEffect(() => {
    if (focused && tagRef.current) {
      tagRef.current.innerText = value
      // Place cursor at end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(tagRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    // Only run on focus transition, not on every value change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused])

  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      onParentFocus?.(e)
      if (isPreview) return
      setFocused(true)
    },
    [isPreview, onParentFocus]
  )

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      onParentBlur?.(e)
      if (isPreview) return
      const wrap = (e.currentTarget as HTMLElement).closest(
        "[data-inline-editor]"
      )
      const rel = e.relatedTarget as Node | null
      if (rel && wrap?.contains(rel)) return
      const innerText = e.currentTarget.innerText
      setFocused(false)
      onCommit(innerText)
    },
    [isPreview, onCommit, onParentBlur]
  )

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLElement>) => {
      if (isPreview) return
      onChange?.(e.currentTarget.innerText)
    },
    [isPreview, onChange]
  )

  // Selection-mode styling UI is now provided by ElementPopover; the legacy
  // BuilderFormatBar render is intentionally omitted. `onFormatStyle` /
  // `formatStyle` props remain accepted for backward compatibility.
  void showBar
  void formatStyle
  void onFormatStyle
  if (isPreview) {
    return (
      <Tag {...rest} className={cn(className)}>
        {value}
      </Tag>
    )
  }

  const wrapperClass =
    as === "span" ? "relative inline" : "relative block w-full max-w-full"
  return (
    <div className={wrapperClass} data-inline-editor>
      <Tag
        {...rest}
        ref={tagRef as React.Ref<HTMLElement>}
        className={cn(className)}
        contentEditable={focused}
        suppressHydrationWarning
        suppressContentEditableWarning
        onFocus={onFocus}
        onBlur={onBlur}
        onDoubleClick={() => setFocused(true)}
        onInput={handleInput}
      >
        {focused ? undefined : value}
      </Tag>
    </div>
  )
}
