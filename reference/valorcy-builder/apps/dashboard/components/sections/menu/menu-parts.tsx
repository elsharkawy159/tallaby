"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import { SectionEditableImage } from "@/components/sections/shared"
import { resolveMediaSrc, type PlaceholderKind } from "@/components/sections/placeholders"
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
import type { SectionInstance } from "@/components/sections/registry.types"
import type { ReactNode } from "react"

/**
 * Chrome shared by the menu catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Every menu section keeps the prop keys and collection item keys it has always
 * stored — the restaurant kit, CMS smart-connect (`lib/cms/section-bindings.ts`
 * maps CMS rows onto `name` / `description` / `price` / `image` / `dietary` /
 * `category`, with currency formatting applied there) and saved pages all read
 * them. The dish collection is always the section's FIRST item collection,
 * because CMS binding targets `itemCollections[0]`.
 */

type EditableTag = "span" | "p" | "div" | "h3" | "h4"

// ─── Reading props ────────────────────────────────────────────────────────────

/** A collection prop as an array — instance props are untyped JSONB. */
export function itemsOf<T> (instance: SectionInstance, key: string): T[] {
  const v = instance.props[key]
  return Array.isArray(v) ? (v as T[]) : []
}

/** A string prop, or the literal pre-migration pages rendered when it was never set. */
export function textOr (instance: SectionInstance, key: string, fallback: string): string {
  const v = instance.props[key]
  return typeof v === "string" ? v : fallback
}

/**
 * Groups a dish list by its `category` field, keeping each dish's index in
 * the stored collection so inline edits write back to the right row.
 */
export function groupByCategory<T extends { category?: string }> (
  items: T[],
  fallback: string
): [string, { item: T; index: number }[]][] {
  const groups = new Map<string, { item: T; index: number }[]>()
  items.forEach((item, index) => {
    const cat = item?.category || fallback
    const list = groups.get(cat)
    if (list) list.push({ item, index })
    else groups.set(cat, [{ item, index }])
  })
  return [...groups.entries()]
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
      value={String(value ?? "")}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/**
 * One inline-editable flat prop. `fallback` is what renders while the prop has
 * never been set — the literal a pre-migration page always showed there.
 * Without a fallback an unset prop renders nothing.
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
 * Override that draws a flat text prop with section-specific markup.
 * `hideEmpty` mirrors pre-slot markup that skipped an empty value.
 */
export function textOverride (
  propKey: string,
  className: string,
  isPreview?: boolean,
  opts: { as?: EditableTag; fallback?: string; hideEmpty?: boolean } = {}
): BlockOverride {
  return function TextOverride ({ instance }) {
    if (opts.hideEmpty && instance.props[propKey] === "") return null
    return (
      <PropText
        instance={instance}
        propKey={propKey}
        as={opts.as ?? "p"}
        className={className}
        isPreview={isPreview}
        fallback={opts.fallback}
      />
    )
  }
}

/** The small uppercase brand-coloured kicker most menu sections open with. */
export const MENU_EYEBROW_CLASS = "text-xs font-semibold text-primary"

/**
 * A single action bound to flat `label` / `href` props. Renders nothing when the
 * label was cleared and the old default label when it was never set.
 */
export function FlatLinkAction ({
  instance,
  isPreview,
  labelProp,
  hrefProp,
  fallback,
  className,
  suffix,
  hideEmpty = true,
}: {
  instance: SectionInstance
  isPreview?: boolean
  labelProp: string
  hrefProp: string
  fallback: string
  className?: string
  suffix?: ReactNode
  hideEmpty?: boolean
}) {
  const label = textOr(instance, labelProp, fallback)
  if (hideEmpty && label === "") return null
  const href = instance.props[hrefProp]
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [labelProp]: t })
  return (
    <SectionLink
      link={linkValueFromProp(typeof href === "string" ? href : "#")}
      isPreview={isPreview}
      data-element-id={`${instance.id}::${labelProp}`}
      data-element-type="textLink"
      data-element-href-prop={hrefProp}
      className={className}
    >
      <InlineEditableText as="span" value={label} isPreview={isPreview} onChange={write} onCommit={write} />
      {suffix}
    </SectionLink>
  )
}

// ─── Slot helpers ─────────────────────────────────────────────────────────────

/**
 * Collections must span the slot even when the slot centres its entries; a
 * centred flex column would otherwise shrink the list to its content.
 */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

// ─── Block specs ──────────────────────────────────────────────────────────────

type FieldOpts = { aiHint?: string; maxLength?: number }

/** The menu eyebrow, with the hand-written definition's hint and limit. */
export function eyebrowBlock (opts: FieldOpts = {}): EyebrowBlock {
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

/** A plain (accent-less) level-2 heading bound to `key` (default `headline`). */
export function headingBlock (
  opts: FieldOpts & { key?: string; label?: string; id?: string } = {}
): HeadingBlock {
  const key = opts.key ?? "headline"
  return {
    kind: "heading",
    level: 2,
    accent: false,
    ...(key !== "headline" ? { id: opts.id ?? key } : {}),
    fields: {
      headline: {
        key,
        label: opts.label ?? "Headline",
        type: "text",
        canonical: "headline",
        ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
        maxLength: opts.maxLength ?? 70,
        group: "content",
      },
    },
  }
}

/** A descriptive paragraph bound to `key` (default `description`). */
export function bodyBlock (
  opts: FieldOpts & { key?: string; label?: string; type?: "text" | "textarea"; slot?: string } = {}
): BodyBlock {
  const key = opts.key ?? "description"
  return {
    kind: "body",
    ...(key !== "description" ? { id: key } : {}),
    ...(opts.slot ? { slot: opts.slot } : {}),
    field: {
      key,
      label: opts.label ?? "Description",
      type: opts.type ?? "textarea",
      canonical: "body",
      ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
      maxLength: opts.maxLength ?? 280,
      group: "content",
    },
  }
}

/** A short single-value line (price, availability, tagline …) as a note block. */
export function noteBlock (
  field: FieldSpec & { key: string },
  opts: { label?: string; slot?: string } = {}
): NoteBlock {
  return {
    kind: "note",
    id: field.key,
    label: opts.label ?? field.label ?? "Note",
    ...(opts.slot ? { slot: opts.slot } : {}),
    field: { type: "text", group: "content", ...field },
  }
}

/**
 * A flat label + link action as two note blocks: the label draws the link
 * (override), the href is carried by it and edited in the inspector.
 */
export function flatActionBlocks (opts: {
  labelKey: string
  hrefKey: string
  labelText: string
  hrefText?: string
  labelAiHint?: string
  maxLength: number
  slot?: string
}): [NoteBlock, NoteBlock] {
  const slot = opts.slot ? { slot: opts.slot } : {}
  return [
    {
      kind: "note",
      id: opts.labelKey,
      label: "Button label",
      ...slot,
      field: {
        key: opts.labelKey,
        label: opts.labelText,
        type: "text",
        canonical: "ctaPrimary",
        ...(opts.labelAiHint ? { aiHint: opts.labelAiHint } : {}),
        maxLength: opts.maxLength,
        group: "cta",
      },
    },
    {
      kind: "note",
      id: opts.hrefKey,
      label: "Button link",
      ...slot,
      field: { key: opts.hrefKey, label: opts.hrefText ?? "CTA link", type: "url", canonical: "ctaLink", group: "cta" },
    },
  ]
}

/**
 * A dish / course / wine collection. `fields` reproduces the hand-written
 * `itemPropDefinitions` exactly (keys, order, hints, limits); `pick: []` keeps
 * the canonical shape from adding keys the section never stored.
 */
export function menuItemsBlock (opts: {
  key: string
  label: string
  minItems: number
  maxItems: number
  fields: FieldSpec[]
  newItem: () => Record<string, unknown>
  canonical?: ItemsBlock["canonical"]
  slot?: string
}): ItemsBlock {
  return {
    kind: "items",
    key: opts.key,
    canonical: opts.canonical ?? "menuItems",
    label: opts.label,
    pick: [],
    itemFields: opts.fields,
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

/** Shorthand for a plain item text field. */
export function itemField (
  key: string,
  label: string,
  opts: Omit<FieldSpec, "key" | "label"> = {}
): FieldSpec {
  return { key, label, type: "text", ...opts }
}

// ─── Cover media ──────────────────────────────────────────────────────────────

/**
 * Override for a media block drawn as a cover layer filling its slot host
 * (which keeps the old aspect / positioning chrome). Falls back to local
 * placeholder art when the prop is empty. Pair with `coverEntry` so the
 * entry wrapper fills the host in the builder as well.
 */
export function coverImageOverride (opts: {
  srcKey: string
  /** Prop whose text doubles as the alt (the pre-slot markup used the dish name / headline). */
  altKey: string
  elementKey: string
  className: string
  isPreview?: boolean
  placeholder?: PlaceholderKind
}): BlockOverride {
  return function CoverImage ({ instance }) {
    const src = instance.props[opts.srcKey]
    const alt = instance.props[opts.altKey]
    return (
      <SectionEditableImage
        instanceId={instance.id}
        elementKey={opts.elementKey}
        src={resolveMediaSrc(typeof src === "string" ? src : undefined, opts.placeholder ?? "landscape")}
        alt={typeof alt === "string" ? alt : ""}
        srcProp={opts.srcKey}
        isPreview={opts.isPreview}
        className={opts.className}
      />
    )
  }
}

/** Entry class that stretches a media entry over its slot host. */
export function coverEntry (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "media" ? "absolute inset-0" : undefined
}
