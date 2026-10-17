'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface InlineEditProps {
  value: string
  onCommit: (next: string) => void
  ariaLabel: string
  placeholder?: string
  className?: string
  readOnly?: boolean
  /** Accept an empty value (e.g. clearing an optional description). */
  allowEmpty?: boolean
  /** Wrap long text (and edit it in a textarea) instead of truncating it. */
  multiline?: boolean
  maxLength?: number
}

/** Text that turns into an input on click; Enter/blur saves, Escape cancels. */
export function InlineEdit ({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  className,
  readOnly,
  allowEmpty,
  multiline,
  maxLength = 60,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit () {
    setEditing(false)
    const next = draft.trim()
    if (next === value.trim()) return
    if (!next && !allowEmpty) {
      setDraft(value)
      return
    }
    onCommit(next)
  }

  if (readOnly) {
    return (
      <span className={cn('block px-1.5 py-0.5', !multiline && 'truncate', !value && 'text-muted-foreground', className)}>
        {value || placeholder}
      </span>
    )
  }

  if (editing) {
    const shared = {
      ref: inputRef,
      value: draft,
      maxLength,
      dir: 'auto' as const,
      'aria-label': ariaLabel,
      placeholder,
      onBlur: commit,
      className: cn(
        'block w-full rounded-md border border-input bg-background px-1.5 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        multiline && 'min-h-16 resize-y',
        className
      ),
    }
    return multiline ? (
      <textarea
        {...shared}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
      />
    ) : (
      <input
        {...shared}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      dir="auto"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className={cn(
        'block w-full rounded-md px-1.5 py-0.5 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        multiline ? 'whitespace-pre-wrap' : 'truncate',
        !value && 'text-muted-foreground',
        className
      )}
    >
      {value || placeholder}
    </button>
  )
}

type DraftFieldProps = {
  value: string
  onCommit: (next: string) => void
  multiline?: boolean
  /** Show `length / maxLength` under the field. */
  showCount?: boolean
  /** Soft limit shown in the counter (turns amber past it). */
  softMax?: number
} & Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'onBlur' | 'defaultValue'>

/**
 * An always-visible field that edits a local draft and commits on blur (or
 * Enter for single-line fields) — so every keystroke isn't a plan change.
 * Follows outside updates (an AI edit) while it isn't focused.
 */
export function DraftField ({
  value,
  onCommit,
  multiline,
  showCount,
  softMax,
  className,
  maxLength,
  ...rest
}: DraftFieldProps) {
  const [draft, setDraft] = useState(value)
  const [focused, setFocused] = useState(false)
  const [syncedValue, setSyncedValue] = useState(value)

  // Adopt outside changes while not editing (adjusting state during render,
  // not in an effect, so there is no extra render pass).
  if (!focused && value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  function commit () {
    setFocused(false)
    if (draft !== value) onCommit(draft)
  }

  const base = cn(
    'w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
    className
  )
  const limit = softMax ?? maxLength

  return (
    <div className="w-full">
      {multiline ? (
        <textarea
          value={draft}
          maxLength={maxLength}
          dir="auto"
          rows={3}
          aria-label={rest['aria-label']}
          placeholder={rest.placeholder}
          disabled={rest.disabled}
          id={rest.id}
          onFocus={() => setFocused(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(value)
              ;(e.target as HTMLTextAreaElement).blur()
            }
          }}
          className={cn(base, 'min-h-18 resize-y leading-relaxed')}
        />
      ) : (
        <input
          {...rest}
          value={draft}
          maxLength={maxLength}
          dir="auto"
          onFocus={() => setFocused(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ;(e.target as HTMLInputElement).blur()
            } else if (e.key === 'Escape') {
              setDraft(value)
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          className={cn(base, 'h-8')}
        />
      )}
      {showCount && limit ? (
        <p
          className={cn(
            'mt-1 text-end text-[11px] tabular-nums text-muted-foreground',
            draft.length > limit && 'text-amber-600 dark:text-amber-400'
          )}
        >
          {draft.length}/{limit}
        </p>
      ) : null}
    </div>
  )
}
