"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionEditableImage } from "@/components/sections/section-editable-image"
import { SectionEyebrow } from "@/components/sections/_primitives/section-eyebrow"
import { placeholderFor } from "@/components/sections/placeholders"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type {
  BodyBlock,
  EyebrowBlock,
  FieldSpec,
  HeadingBlock,
  ItemsBlock,
  NoteBlock,
} from "@/components/sections/schema/section-schema"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { CanonicalField } from "@/components/sections/registry.constants"
import type { SectionInstance } from "@/components/sections/registry.types"
import type { ReactNode } from "react"

/**
 * Chrome shared by the listings catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Listings are data-bound: the CMS smart-connect (`lib/cms/section-bindings.ts`)
 * and the server enrichment write published CMS rows straight into the section's
 * collection prop (`listings`, `items`, …), with `href` pointing at the detail
 * route. So every section here reads its collection from `instance.props` under
 * the key it has always used, keeps each card a plain link to `item.href`, and
 * only the copy around the collection is made of blocks.
 */

type EditableTag = "span" | "p" | "div" | "h2" | "h3" | "h4"

// ─── Reading ──────────────────────────────────────────────────────────────────

/** A collection prop as an array — stored instances can lack it entirely. */
export function itemsOf<T> (instance: SectionInstance, key: string): T[] {
  const v = instance.props[key]
  return Array.isArray(v) ? (v as T[]) : []
}

/** A flat prop as a string, or the literal pre-migration pages rendered. */
export function textOr (instance: SectionInstance, key: string, fallback: string): string {
  const v = instance.props[key]
  return typeof v === "string" ? v : fallback
}

/** Item value as display text (item fields are untyped JSONB). */
export function txt (v: unknown): string {
  return v === undefined || v === null ? "" : String(v)
}

// ─── Inline editing ───────────────────────────────────────────────────────────

/** One inline-editable field of a collection item, with the pre-slot element attributes. */
export function ItemText ({
  instance,
  collection,
  index,
  field,
  value,
  className,
  as = "span",
  isPreview,
  elementId,
}: {
  instance: SectionInstance
  collection: string
  index: number
  field: string
  value: unknown
  className?: string
  as?: EditableTag
  isPreview?: boolean
  /** `data-element-id` suffix — only for sections that always emitted one. */
  elementId?: string
}) {
  const write = (t: string) =>
    useBuilderStore.getState().updateItem(instance.id, collection, index, { [field]: t })
  return (
    <InlineEditableText
      as={as}
      {...(elementId
        ? { "data-element-id": `${instance.id}::${elementId}`, "data-element-type": "text" }
        : {})}
      data-element-collection={collection}
      data-element-index={String(index)}
      data-element-item-label-prop={field}
      className={className}
      value={txt(value)}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/**
 * One inline-editable flat prop. Renders nothing while the prop is unset unless
 * a `fallback` (the literal a pre-migration page showed) is given.
 */
export function PropText ({
  instance,
  propKey,
  className,
  as = "span",
  isPreview,
  fallback,
}: {
  instance: SectionInstance
  propKey: string
  className?: string
  as?: EditableTag
  isPreview?: boolean
  fallback?: string
}) {
  const raw = instance.props[propKey]
  const value = typeof raw === "string" ? raw : fallback
  if (value === undefined) return null
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [propKey]: t })
  return (
    <InlineEditableText
      as={as}
      data-element-id={`${instance.id}::${propKey}`}
      data-element-type="text"
      className={className}
      value={value}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/**
 * A card photo bound to an item's `image` field. Renders `empty` (the muted box
 * the pre-slot markup drew) when the item has no image.
 */
export function ItemPhoto ({
  instance,
  collection,
  index,
  src,
  alt,
  elementKey,
  className,
  empty,
  field = "image",
}: {
  instance: SectionInstance
  collection: string
  index: number
  src: unknown
  alt: unknown
  /** Element key — kept from the pre-slot markup so selections survive. */
  elementKey: string
  className?: string
  empty?: ReactNode
  field?: string
}) {
  const url = txt(src)
  if (!url) return <>{empty ?? <div className="absolute inset-0 bg-muted" />}</>
  return (
    <SectionEditableImage
      instanceId={instance.id}
      elementKey={elementKey}
      src={url}
      alt={txt(alt)}
      collectionKey={collection}
      collectionIndex={index}
      itemSrcProp={field}
      className={className ?? "absolute inset-0 size-full object-cover"}
    />
  )
}

// ─── Overrides ────────────────────────────────────────────────────────────────

/** The small uppercase kicker most listings sections share. Hidden when empty. */
export function kickerEyebrow (isPreview?: boolean, className?: string): BlockOverride {
  return function KickerEyebrow ({ instance }) {
    const v = instance.props.eyebrow
    if (typeof v !== "string" || v === "") return null
    return (
      <SectionEyebrow
        instanceId={instance.id}
        value={v}
        isPreview={isPreview}
        className={cn("mb-1 text-xs font-semibold", className)}
      />
    )
  }
}

/** Collection grids must span the slot even when the slot centres its entries. */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

/**
 * A single action bound to flat `label` / `href` props. Renders nothing when the
 * label was cleared and the pre-slot fallback label when it was never set.
 */
export function FlatLinkAction ({
  instance,
  isPreview,
  labelProp,
  hrefProp,
  fallback,
  className,
}: {
  instance: SectionInstance
  isPreview?: boolean
  labelProp: string
  hrefProp: string
  fallback: string
  className?: string
}) {
  const label = textOr(instance, labelProp, fallback)
  if (label === "") return null
  const href = textOr(instance, hrefProp, "#")
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [labelProp]: t })
  return (
    <a href={href} data-element-href-prop={hrefProp} className={className}>
      <InlineEditableText
        as="span"
        data-element-id={`${instance.id}::${labelProp}`}
        data-element-type="text"
        value={label}
        isPreview={isPreview}
        onChange={write}
        onCommit={write}
      />
     
    </a>
  )
}

// ─── Status tones ─────────────────────────────────────────────────────────────

/** Availability pill tones — semantic status tokens, never palette colours. */
export const TONE = {
  positive: "bg-success/10 text-success",
  caution: "bg-warning/10 text-warning",
  neutral: "bg-muted text-muted-foreground",
} as const

// ─── Block specs ──────────────────────────────────────────────────────────────

export function eyebrowBlock (opts: { aiHint?: string; maxLength?: number } = {}): EyebrowBlock {
  return {
    kind: "eyebrow",
    field: {
      key: "eyebrow",
      label: "Eyebrow",
      type: "text",
      canonical: "eyebrow",
      ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
      maxLength: opts.maxLength ?? 30,
      group: "content",
    },
  }
}

export function headingBlock (opts: {
  key?: string
  label?: string
  aiHint?: string
  maxLength: number
  canonical?: CanonicalField
} ): HeadingBlock {
  const key = opts.key ?? "headline"
  return {
    kind: "heading",
    level: 2,
    accent: false,
    ...(key !== "headline" ? { id: key } : {}),
    fields: {
      headline: {
        key,
        label: opts.label ?? "Headline",
        type: "text",
        canonical: opts.canonical ?? "headline",
        ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
        maxLength: opts.maxLength,
        group: "content",
      },
    },
  }
}

export function descriptionBlock (opts: {
  key?: string
  label?: string
  aiHint?: string
  maxLength: number
}): BodyBlock {
  const key = opts.key ?? "description"
  return {
    kind: "body",
    ...(key !== "description" ? { id: key } : {}),
    field: {
      key,
      label: opts.label ?? "Description",
      type: "textarea",
      canonical: "body",
      ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
      maxLength: opts.maxLength,
      group: "content",
    },
  }
}

/** A note block bound to a flat prop; the id follows the key. */
export function noteBlock (field: FieldSpec & { label: string }, slot?: string): NoteBlock {
  return {
    kind: "note",
    id: field.key,
    label: field.label,
    ...(slot ? { slot } : {}),
    field,
  }
}

/** A flat label + link action as two note blocks (label draws the link; href rides on it). */
export function flatActionBlocks (opts: {
  labelKey: string
  hrefKey: string
  aiHint?: string
  maxLength: number
  slot?: string
}): [NoteBlock, NoteBlock] {
  return [
    noteBlock(
      {
        key: opts.labelKey,
        label: "CTA label",
        type: "text",
        canonical: "ctaPrimary",
        ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
        maxLength: opts.maxLength,
        group: "cta",
      },
      opts.slot
    ),
    noteBlock({ key: opts.hrefKey, label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" }, opts.slot),
  ]
}

/**
 * The listing collection as one `items` block. `fields` reproduce the item keys
 * the section has always stored (and the CMS binding writes), in order.
 */
export function collectionBlock (opts: {
  key: string
  label: string
  canonical?: CanonicalField
  minItems: number
  maxItems: number
  fields: FieldSpec[]
  newItem: () => Record<string, unknown>
  slot?: string
}): ItemsBlock {
  return {
    kind: "items",
    key: opts.key,
    canonical: opts.canonical ?? "listings",
    label: opts.label,
    pick: [],
    itemFields: opts.fields,
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: opts.newItem,
    itemPlaceholder: "landscape",
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

/** Local placeholder art for default listing photos — never an external URL. */
export const PHOTO = placeholderFor("landscape")
export const PORTRAIT = placeholderFor("portrait")
