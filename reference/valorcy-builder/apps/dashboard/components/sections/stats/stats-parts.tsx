"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { FieldSpec, ItemsBlock } from "@/components/sections/schema/section-schema"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the stats catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Two collection shapes exist in this category and both are kept verbatim so
 * every saved page keeps its numbers:
 *
 *   • `cells` — `{ value, unit, label, accent }` (+ `badge` on Pulse)
 *   • `stats` — `{ value, label, description }` (+ `trend`/`trendValue` on Trajectory)
 */

type EditableTag = "span" | "p" | "h2" | "h3" | "div"

/** One inline-editable field of a collection item, using the pre-slot element attributes. */
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
  /** Optional `data-element-id` suffix — only for sections that always emitted one. */
  elementId?: string
}) {
  const store = useBuilderStore.getState
  const write = (t: string) => store().updateItem(instance.id, collection, index, { [field]: t })
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

/** One inline-editable flat prop, bound to `${instanceId}::${propKey}`. */
export function PropText ({
  instance,
  propKey,
  className,
  as = "p",
  isPreview,
}: {
  instance: SectionInstance
  propKey: string
  className?: string
  as?: EditableTag
  isPreview?: boolean
}) {
  const raw = instance.props[propKey]
  if (typeof raw !== "string") return null
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [propKey]: t })
  return (
    <InlineEditableText
      as={as}
      data-element-id={`${instance.id}::${propKey}`}
      data-element-type="text"
      className={className}
      value={raw}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/**
 * Override for a block that was optional before the slot migration (rendered
 * only when non-empty). Renders nothing for an empty value, otherwise falls
 * through to the shared renderer.
 */
export function whenFilled (key: string): BlockOverride {
  return function WhenFilled ({ instance }) {
    const v = instance.props[key]
    return typeof v === "string" && v.trim() !== "" ? undefined : null
  }
}

/**
 * Collection grids must span the slot even when the slot centres its entries;
 * a centred flex column would otherwise shrink the grid to its content.
 */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

/** Static `lg:` column classes, so Tailwind sees every one it may need. */
const LG_COLS = ["lg:grid-cols-1", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"] as const

/** `lg:grid-cols-N` for a collection of `count` items, capped at four. */
export function lgColsFor (count: number): string {
  return LG_COLS[Math.max(0, Math.min(count, 4))]!
}

// ─── Collection blocks ────────────────────────────────────────────────────────

const VALUE_FIELD: FieldSpec = {
  key: "value",
  label: "Value",
  type: "text",
  canonical: "body",
  aiHint: "Numeric value or metric (e.g. 99.9% or 10k+)",
  maxLength: 20,
  group: "content",
}

const UNIT_FIELD: FieldSpec = {
  key: "unit",
  label: "Unit (optional)",
  type: "text",
  canonical: "eyebrow",
  aiHint: "Unit or suffix (e.g. %, users, ms)",
  maxLength: 15,
  group: "content",
}

const ACCENT_FIELD: FieldSpec = { key: "accent", label: "Gradient accent", type: "switch" }

export type StatCell = { value?: string; unit?: string; label?: string; badge?: string; accent?: boolean }

/**
 * Schema block for the `cells` collection — `{ value, unit, label, accent }`.
 * The item keys are exactly what these sections have always stored.
 */
export function statCellsBlock (opts: {
  label: string
  minItems: number
  maxItems: number
  newItem: () => Record<string, unknown>
  slot?: string
  /** `label` field type — Matrix stores multi-line labels. */
  labelType?: "text" | "textarea"
  /** Whether the collection carries the gradient `accent` switch. */
  accent?: boolean
  /** Extra fields inserted before `accent` (Pulse's trend badge). */
  extra?: FieldSpec[]
}): ItemsBlock {
  return {
    kind: "items",
    key: "cells",
    canonical: "stats",
    label: opts.label,
    pick: [],
    itemFields: [
      VALUE_FIELD,
      UNIT_FIELD,
      { key: "label", label: "Label", type: opts.labelType ?? "text" },
      ...(opts.extra ?? []),
      ...(opts.accent === false ? [] : [ACCENT_FIELD]),
    ],
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

export type StatItem = { value?: string; label?: string; description?: string }

/**
 * Schema block for the `stats` collection — `{ value, label, description }`,
 * the canonical stats shape. `valueHint` keeps each section's original example.
 */
export function statItemsBlock (opts: {
  valueHint: string
  newItem: () => Record<string, unknown>
  slot?: string
}): ItemsBlock {
  return {
    kind: "items",
    key: "stats",
    canonical: "stats",
    label: "Stats",
    pick: [],
    itemFields: [
      { key: "value", label: "Value", type: "text", aiHint: opts.valueHint, maxLength: 20 },
      { key: "label", label: "Label", type: "text", canonical: "headline", maxLength: 40 },
      { key: "description", label: "Description (optional)", type: "text", canonical: "body", maxLength: 60 },
    ],
    minItems: 2,
    maxItems: 6,
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}
