"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { FieldSpec, SectionBlock } from "@/components/sections/schema/section-schema"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the testimonials catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Every testimonials section stores the same `items` collection shape
 * (quote / author / role / company / rating) and the same `headline` +
 * `subheadline` header, so the schema blocks and the attribution markup live
 * here once. A new testimonials layout is a new arrangement of these parts.
 */

export type TestimonialItem = {
  quote?: string
  author?: string
  role?: string
  company?: string
  rating?: number
}

/**
 * The fill behind an initials avatar: a flat muted disc. It used to be a brand
 * gradient, which is decoration the content does not need (§6.5).
 */
export const AVATAR_GRADIENT = "var(--muted)"

/** Readable items array — instance props are untyped JSONB. */
export function itemsOf<T = TestimonialItem> (instance: SectionInstance, key = "items"): T[] {
  const raw = instance.props[key]
  return Array.isArray(raw) ? (raw as T[]) : []
}

/** Writes one field of one collection item. */
export function writeItem (instanceId: string, key: string, index: number, field: string) {
  return (t: string) => useBuilderStore.getState().updateItem(instanceId, key, index, { [field]: t })
}

// ─── Schema ──────────────────────────────────────────────────────────────────

/**
 * Headline + subheadline, bound to the keys every testimonials section has
 * always stored. The subheadline keeps its legacy `subheadline` key and
 * canonical rather than the body block's `description` default.
 */
export function headerBlocks (): SectionBlock[] {
  return [
    {
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
    },
    {
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
    },
  ]
}

const QUOTE_FIELD: FieldSpec = {
  key: "quote",
  label: "Quote",
  type: "textarea",
  canonical: "body",
  aiHint: "Pull quote (1–3 sentences, 20–60 words)",
  maxLength: 300,
  group: "content",
}

const AUTHOR_FIELD: FieldSpec = {
  key: "author",
  label: "Author",
  type: "text",
  canonical: "subheadline",
  aiHint: "Author name",
  maxLength: 60,
  group: "content",
}

const ROLE_FIELD: FieldSpec = { key: "role", label: "Role", type: "text" }
const COMPANY_FIELD: FieldSpec = { key: "company", label: "Company", type: "text" }
const RATING_FIELD: FieldSpec = { key: "rating", label: "Rating (1-5)", type: "number", min: 1, max: 5 }

/**
 * The `items` collection block. Item keys reproduce the stored shape exactly;
 * `fields` picks which of them a section exposes, in inspector order.
 */
export function testimonialItemsBlock (opts: {
  label?: string
  minItems: number
  maxItems: number
  newItem: () => Record<string, unknown>
  fields?: ("quote" | "author" | "role" | "company" | "rating")[]
  extraFields?: FieldSpec[]
  slot?: string
}): SectionBlock {
  const all: Record<string, FieldSpec> = {
    quote: QUOTE_FIELD,
    author: AUTHOR_FIELD,
    role: ROLE_FIELD,
    company: COMPANY_FIELD,
    rating: RATING_FIELD,
  }
  const fields = opts.fields ?? ["quote", "author", "role", "company", "rating"]
  return {
    kind: "items",
    key: "items",
    canonical: "testimonials",
    label: opts.label ?? "Testimonials",
    pick: fields,
    itemFields: [...fields.map((f) => all[f]!), ...(opts.extraFields ?? [])],
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

// ─── Chrome ──────────────────────────────────────────────────────────────────

const STAR_PATH =
  "M8 1.5l1.84 3.73 4.11.6-2.97 2.9.7 4.1L8 10.77l-3.68 1.93.7-4.1L2.05 5.83l4.11-.6z"

/** Five-star rating in the brand colour. Decorative — the rating is an inspector field. */
export function Stars ({
  n,
  className,
  starClassName = "size-3.5",
}: {
  n: number
  className?: string
  starClassName?: string
}) {
  return (
    <div className={cn("flex gap-0.5 text-primary", className)} aria-label={`${n} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={starClassName}
          viewBox="0 0 16 16"
          fill={i < n ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

/** Initials disc derived from the author name. */
export function InitialsAvatar ({ name, className }: { name?: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-muted font-semibold text-foreground",
        className
      )}
    >
      {(name || "A").slice(0, 2).toUpperCase()}
    </div>
  )
}

/**
 * Author name over "role, company", each inline-editable in place with the
 * collection element attributes the pre-slot markup used.
 */
export function Attribution ({
  instanceId,
  item,
  index,
  isPreview,
  collection = "items",
  className,
  nameClassName,
  metaClassName,
  separatorClassName,
}: {
  instanceId: string
  item: TestimonialItem
  index: number
  isPreview?: boolean
  collection?: string
  className?: string
  nameClassName?: string
  metaClassName?: string
  separatorClassName?: string
}) {
  const attrs = (prop: string) => ({
    "data-element-collection": collection,
    "data-element-index": String(index),
    "data-element-item-label-prop": prop,
  })
  return (
    <div className={className}>
      <InlineEditableText
        as="div"
        {...attrs("author")}
        className={nameClassName}
        value={String(item.author ?? "")}
        isPreview={isPreview}
        onChange={writeItem(instanceId, collection, index, "author")}
        onCommit={writeItem(instanceId, collection, index, "author")}
      />
      <div className={metaClassName}>
        <InlineEditableText
          as="span"
          {...attrs("role")}
          value={String(item.role ?? "")}
          isPreview={isPreview}
          onChange={writeItem(instanceId, collection, index, "role")}
          onCommit={writeItem(instanceId, collection, index, "role")}
        />
        {item.company && item.role ? <span className={separatorClassName}>, </span> : null}
        <InlineEditableText
          as="span"
          {...attrs("company")}
          value={String(item.company ?? "")}
          isPreview={isPreview}
          onChange={writeItem(instanceId, collection, index, "company")}
          onCommit={writeItem(instanceId, collection, index, "company")}
        />
      </div>
    </div>
  )
}

/** The quote text of one item, inline-editable. */
export function ItemQuote ({
  instanceId,
  item,
  index,
  isPreview,
  className,
  collection = "items",
}: {
  instanceId: string
  item: TestimonialItem
  index: number
  isPreview?: boolean
  className?: string
  collection?: string
}) {
  return (
    <InlineEditableText
      as="p"
      data-element-collection={collection}
      data-element-index={String(index)}
      data-element-item-label-prop="quote"
      className={className}
      value={String(item.quote ?? "")}
      isPreview={isPreview}
      onChange={writeItem(instanceId, collection, index, "quote")}
      onCommit={writeItem(instanceId, collection, index, "quote")}
    />
  )
}
