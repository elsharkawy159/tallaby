'use client'

import * as React from 'react'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Enter, comma (Latin or Arabic "،") or Tab adds the typed tag. */
const SEPARATORS = /[,،\n]/

/**
 * Free-text tags (keywords) as removable chips in one field. Typing a comma
 * or pressing Enter adds a tag, Backspace in an empty field removes the last
 * one, and a pasted list is split on commas and new lines. Repeats (ignoring
 * case) are skipped.
 */
export function TagsInput ({
  id,
  value,
  onChange,
  max,
  maxLength,
  placeholder,
  removeLabel,
  className,
  inputClassName,
  'aria-describedby': describedBy,
}: {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  max?: number
  maxLength?: number
  placeholder?: string
  /** Accessible name of a chip's remove button. */
  removeLabel: (tag: string) => string
  className?: string
  inputClassName?: string
  'aria-describedby'?: string
}) {
  const [draft, setDraft] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const full = max != null && value.length >= max

  const add = (raw: string[]) => {
    const next = [...value]
    const seen = new Set(next.map((tag) => tag.toLowerCase()))
    for (const part of raw) {
      const tag = part.trim().replace(/\s+/g, ' ').slice(0, maxLength)
      if (!tag || seen.has(tag.toLowerCase())) continue
      if (max != null && next.length >= max) break
      seen.add(tag.toLowerCase())
      next.push(tag)
    }
    if (next.length !== value.length) onChange(next)
  }

  const commit = () => {
    if (draft.trim()) add([draft])
    setDraft('')
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    inputRef.current?.focus()
  }

  return (
    <div
      className={cn(
        'flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-[10px] border border-input bg-card px-2 py-1.5 transition-[border-color,box-shadow] hover:border-faint focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20',
        className
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) inputRef.current?.focus()
      }}
    >
      {value.map((tag, index) => (
        <span
          key={`${index}-${tag}`}
          className='inline-flex max-w-full items-center gap-1 rounded-md bg-primary-soft py-0.5 ps-2 pe-1 text-[13px] font-medium text-primary-ink'
        >
          <span className='truncate'>{tag}</span>
          <button
            type='button'
            onClick={() => remove(index)}
            aria-label={removeLabel(tag)}
            className='grid size-5 shrink-0 place-items-center rounded hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none'
          >
            <X className='size-3.5' aria-hidden />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        disabled={full}
        maxLength={maxLength}
        placeholder={full ? undefined : placeholder}
        aria-describedby={describedBy}
        enterKeyHint='enter'
        onChange={(event) => {
          const text = event.target.value
          if (SEPARATORS.test(text)) {
            add(text.split(SEPARATORS))
            setDraft('')
          } else {
            setDraft(text)
          }
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === 'Enter' || (event.key === 'Tab' && draft.trim())) {
            event.preventDefault()
            commit()
          } else if (event.key === 'Backspace' && !draft && value.length) {
            event.preventDefault()
            remove(value.length - 1)
          }
        }}
        onPaste={(event) => {
          const text = event.clipboardData.getData('text')
          if (!SEPARATORS.test(text)) return
          event.preventDefault()
          add([draft, ...text.split(SEPARATORS)])
          setDraft('')
        }}
        onBlur={commit}
        className={cn(
          'h-8 min-w-[8rem] flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:hidden',
          inputClassName
        )}
      />
    </div>
  )
}
