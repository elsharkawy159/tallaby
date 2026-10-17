"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { FieldSpec, SectionBlock } from "@/components/sections/schema/section-schema"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome and schema blocks shared by the FAQ catalog.
 *
 * Every FAQ stores the same prop keys it always has — `headline` + `subheadline`
 * (or `title` for the two compact variants) and an `items` collection of
 * `{ question, answer }` — so the blocks below bind to those keys rather than to
 * the kind defaults. Pages saved before the slot migration render unchanged.
 */

export type FaqEntry = { question?: string; answer?: string; category?: string }

/** Reads the `items` collection defensively — instance props are untyped JSONB. */
export function faqItems (instance: SectionInstance, key = "items"): FaqEntry[] {
  const raw = instance.props[key]
  return Array.isArray(raw) ? (raw as FaqEntry[]) : []
}

// ─── Schema blocks ────────────────────────────────────────────────────────────

/** `headline` — the h2 of the five full-size FAQs. No accent word was ever stored. */
export function faqHeadlineBlock (): SectionBlock {
  return {
    kind: "heading",
    level: 2,
    accent: false,
    fields: {
      headline: {
        key: "headline",
        label: "Headline",
        canonical: "headline",
        aiHint: "Primary section headline (6–10 words, no period)",
        maxLength: 80,
        group: "content",
      },
    },
  }
}

/** `title` — the h2 of the compact FAQs (Frame, Hush), bound to the stored key. */
export function faqTitleBlock (): SectionBlock {
  return {
    kind: "heading",
    id: "title",
    label: "Title",
    level: 2,
    accent: false,
    fields: {
      headline: {
        key: "title",
        label: "Title",
        canonical: "headline",
        aiHint: "Section title (4–8 words)",
        maxLength: 60,
        group: "content",
      },
    },
  }
}

/** `subheadline` — a short supporting line, rendered as the body block. */
export function faqSubheadlineBlock (): SectionBlock {
  return {
    kind: "body",
    id: "subheadline",
    label: "Subheadline",
    field: {
      key: "subheadline",
      label: "Subheadline",
      type: "text",
      canonical: "subheadline",
      aiHint: "Supporting subheadline (8–14 words)",
      maxLength: 120,
      group: "content",
    },
  }
}

const QUESTION_FIELD: FieldSpec = { key: "question", label: "Question", type: "text" }
const ANSWER_FIELD: FieldSpec = { key: "answer", label: "Answer", type: "textarea" }

/** The `items` collection of `{ question, answer }` pairs, plus any extra item fields. */
export function faqItemsBlock (opts: {
  label?: string
  maxItems?: number
  extraFields?: FieldSpec[]
  newItem: () => Record<string, unknown>
  slot?: string
}): SectionBlock {
  return {
    kind: "items",
    key: "items",
    canonical: "faqs",
    label: opts.label ?? "FAQ items",
    pick: [],
    itemFields: [QUESTION_FIELD, ANSWER_FIELD, ...(opts.extraFields ?? [])],
    minItems: 1,
    maxItems: opts.maxItems ?? 20,
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

/**
 * Entry class for a header-then-list slot: the collection fills the row and sits
 * `gap` further down than the header lines sit from each other.
 */
export function listEntryClass (itemsClassName: string) {
  return (entry: SlotEntry) =>
    entry.kind === "block" && entry.block.kind === "items" ? itemsClassName : undefined
}

// ─── Chrome ───────────────────────────────────────────────────────────────────

/** One inline-editable field of one FAQ item, with the collection selection attrs. */
export function FaqItemText ({
  instance,
  isPreview,
  index,
  field,
  value,
  as = "p",
  className,
  collection = "items",
}: {
  instance: SectionInstance
  isPreview?: boolean
  index: number
  field: "question" | "answer"
  value: string | undefined
  as?: "p" | "span" | "h3" | "h4"
  className?: string
  collection?: string
}) {
  const write = (t: string) =>
    useBuilderStore.getState().updateItem(instance.id, collection, index, { [field]: t })
  return (
    <InlineEditableText
      as={as}
      data-element-collection={collection}
      data-element-index={String(index)}
      data-element-item-label-prop={field}
      className={className}
      value={String(value ?? "")}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/** The round chevron that flips when a `<details>` row opens. */
export function FaqChevron ({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border border-border text-primary transition-transform group-open:rotate-180",
        className
      )}
      aria-hidden
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
