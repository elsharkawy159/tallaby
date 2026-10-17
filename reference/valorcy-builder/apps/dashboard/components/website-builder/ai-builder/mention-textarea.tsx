"use client"

import { useId, useMemo, useState, type ComponentProps, type KeyboardEvent, type RefObject } from "react"
import { FileText, LayoutPanelTop, Rows3 } from "lucide-react"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@/lib/utils"
import { fuzzySearch } from "@/lib/builder/fuzzy-search"
import {
  findMentionTrigger,
  insertMention,
  type MentionOption,
} from "@/lib/ai/mentions"

const MAX_RESULTS = 8

type MentionTextareaProps = Omit<ComponentProps<typeof Textarea>, "value" | "onChange" | "ref"> & {
  value: string
  onValueChange: (value: string) => void
  options: MentionOption[]
  groupLabels: Record<MentionOption["group"], string>
  /** Accessible name of the suggestion list. */
  listLabel: string
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

const GROUP_ICON = {
  pages: FileText,
  sections: Rows3,
  shared: LayoutPanelTop,
} as const

/**
 * The chat input with @mention autocomplete: typing "@" lists pages, page
 * sections and the shared navbar/footer; ↑/↓ + Enter/Tab inserts the token.
 * Mentions stay plain "@Label" text — they're resolved from the text at send.
 */
export function MentionTextarea ({
  value,
  onValueChange,
  options,
  groupLabels,
  listLabel,
  textareaRef,
  onKeyDown,
  className,
  ...textareaProps
}: MentionTextareaProps) {
  const listId = useId()
  const [caret, setCaret] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  /** Trigger position the user dismissed with Escape — stays closed until it changes. */
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)

  const trigger = useMemo(() => findMentionTrigger(value, caret), [value, caret])

  const results = useMemo(() => {
    if (!trigger) return []
    const searchable = options.map((o) => ({
      ...o,
      keywords: [o.pageLabel ?? "", o.sectionId ?? "", o.pageSlug ?? ""].filter(Boolean),
    }))
    return fuzzySearch(searchable, trigger.query)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, MAX_RESULTS)
  }, [options, trigger])

  const open = !!trigger && results.length > 0 && dismissedAt !== trigger.start
  const safeIndex = Math.min(activeIndex, Math.max(0, results.length - 1))

  function syncCaret (el: HTMLTextAreaElement) {
    setCaret(el.selectionStart ?? el.value.length)
  }

  function choose (option: MentionOption) {
    if (!trigger) return
    const next = insertMention(value, trigger, option)
    onValueChange(next.text)
    setCaret(next.caret)
    setActiveIndex(0)
    requestAnimationFrame(() => {
      const el = textareaRef?.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.caret, next.caret)
    })
  }

  function handleKeyDown (e: KeyboardEvent<HTMLTextAreaElement>) {
    if (open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const delta = e.key === "ArrowDown" ? 1 : -1
        setActiveIndex((safeIndex + delta + results.length) % results.length)
        return
      }
      if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
        e.preventDefault()
        const option = results[safeIndex]
        if (option) choose(option)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setDismissedAt(trigger!.start)
        return
      }
    }
    onKeyDown?.(e)
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Textarea
        {...textareaProps}
        ref={textareaRef}
        value={value}
        className={cn("w-full", className)}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${safeIndex}` : undefined}
        onChange={(e) => {
          onValueChange(e.target.value)
          syncCaret(e.target)
          setActiveIndex(0)
        }}
        onSelect={(e) => syncCaret(e.currentTarget)}
        onClick={(e) => syncCaret(e.currentTarget)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          textareaProps.onBlur?.(e)
          // Let a click on a suggestion land before closing.
          setTimeout(() => setDismissedAt(trigger?.start ?? null), 120)
        }}
        onFocus={(e) => {
          textareaProps.onFocus?.(e)
          setDismissedAt(null)
        }}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={listLabel}
          className="absolute bottom-full start-0 z-50 mb-2 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {results.map((option, i) => {
            const Icon = GROUP_ICON[option.group]
            const showGroup = i === 0 || results[i - 1]!.group !== option.group
            return (
              <li key={option.key} role="presentation">
                {showGroup && (
                  <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {groupLabels[option.group]}
                  </p>
                )}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === safeIndex}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(option)
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                    i === safeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  )}
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">@{option.label}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
