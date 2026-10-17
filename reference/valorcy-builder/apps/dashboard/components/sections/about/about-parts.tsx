"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { FieldSpec, ItemsBlock } from "@/components/sections/schema/section-schema"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the about catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Every helper writes to the exact prop / collection keys these sections have
 * always stored, and keeps the pre-slot `data-element-*` attributes, so saved
 * pages keep both their content and their canvas selections.
 */

type EditableTag = "span" | "p" | "h2" | "h3" | "div" | "footer"

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
 * One inline-editable flat prop, bound to `${instanceId}::${propKey}`. Renders
 * nothing when the prop is absent, unless a `fallback` is given — which is how
 * copy that used to be hardcoded in JSX keeps rendering on pages saved before
 * it became a prop.
 */
export function PropText ({
  instance,
  propKey,
  className,
  as = "p",
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

/** Block override that renders one flat prop with section-specific type. */
export function propTextOverride (
  propKey: string,
  className: string,
  opts: { as?: EditableTag; isPreview?: boolean; fallback?: string } = {}
): BlockOverride {
  return function PropTextOverride ({ instance }) {
    // A cleared hardcoded-copy block stays cleared rather than snapping back.
    if (opts.fallback !== undefined && instance.props[propKey] === "") return null
    return (
      <PropText
        instance={instance}
        propKey={propKey}
        className={className}
        as={opts.as}
        isPreview={opts.isPreview}
        fallback={opts.fallback}
      />
    )
  }
}

/**
 * The pill badge with a brand dot used by Origin and Heritage. Bound to the
 * `badgeText` key both have always stored.
 */
export function DotBadge ({
  instance,
  isPreview,
  propKey = "badgeText",
  className,
}: {
  instance: SectionInstance
  isPreview?: boolean
  propKey?: string
  className?: string
}) {
  const raw = instance.props[propKey]
  if (typeof raw !== "string") return null
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [propKey]: t })
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground",
        className
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      <InlineEditableText
        as="span"
        data-element-id={`${instance.id}::${propKey}`}
        data-element-type="text"
        value={raw}
        isPreview={isPreview}
        onChange={write}
        onCommit={write}
      />
    </div>
  )
}

/**
 * Collection grids must span the slot even when the slot centres its entries;
 * a centred flex column would otherwise shrink the grid to its content.
 */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

// ─── Collection blocks ────────────────────────────────────────────────────────

/**
 * Schema block for a `{ text }` collection (Heritage's bullets, Essay's
 * paragraphs). The item key is exactly what these sections have always stored.
 */
export function textItemsBlock (opts: {
  key: string
  label: string
  itemLabel: string
  type: "text" | "textarea"
  minItems: number
  maxItems: number
  newText: string
  slot?: string
}): ItemsBlock {
  const field: FieldSpec = {
    key: "text",
    label: opts.itemLabel,
    type: opts.type,
    canonical: "body",
    aiHint: "Text content (1–3 sentences)",
    maxLength: 300,
    group: "content",
  }
  return {
    kind: "items",
    key: opts.key,
    canonical: "items",
    label: opts.label,
    pick: [],
    itemFields: [field],
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: () => ({ text: opts.newText }),
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}
