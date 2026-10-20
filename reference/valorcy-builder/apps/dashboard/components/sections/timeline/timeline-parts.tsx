"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { FieldSpec, HeadingBlock, ItemsBlock } from "@/components/sections/schema/section-schema"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the timeline catalog, rendered through `<SectionSlot>`
 * `renderItems`.
 *
 * Two collection shapes exist in this category and both are kept verbatim so
 * every saved page keeps its entries:
 *
 *   • `items`      — `{ year, title, body, status }` (+ `imageUrl` on Chapters)
 *   • `milestones` — `{ phase, title, description, duration, status }` (Blueprint)
 */

export type TimelineStatus = "done" | "active" | "planned"

export type TimelineItem = {
  year?: string
  title?: string
  body?: string
  imageUrl?: string
  status?: TimelineStatus
}

type EditableTag = "span" | "p" | "div" | "h3"

/**
 * One inline-editable field of a collection item. `elementId` keeps the
 * `${instanceId}::<key><index>` ids these sections emitted before the slot
 * migration, so existing selections and instrumentation still resolve.
 */
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
  labelProp = false,
}: {
  instance: SectionInstance
  collection: string
  index: number
  field: string
  value: unknown
  className?: string
  as?: EditableTag
  isPreview?: boolean
  elementId?: string
  /** Emit `data-element-item-label-prop` (the item's navigator label). */
  labelProp?: boolean
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
      {...(labelProp ? { "data-element-item-label-prop": field } : {})}
      className={className}
      value={String(value ?? "")}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/** Reads a collection defensively — instance props are untyped JSONB. */
export function itemsOf<T> (instance: SectionInstance, key: string): T[] {
  const v = instance.props[key]
  return Array.isArray(v) ? (v as T[]) : []
}

/** The headline block every timeline shares — bound to the stored `headline` key. */
export const TIMELINE_HEADING: HeadingBlock = {
  kind: "heading",
  level: 2,
  accent: false,
  fields: {
    headline: {
      key: "headline",
      label: "Headline",
      type: "text",
      canonical: "headline",
      aiHint: "Primary section headline (6–10 words, no period)",
      maxLength: 80,
      group: "content",
    },
  },
}

const STATUS_FIELD: FieldSpec = {
  key: "status",
  label: "Status",
  type: "select",
  options: [
    { label: "Done", value: "done" },
    { label: "Active", value: "active" },
    { label: "Planned", value: "planned" },
  ],
}

/**
 * Schema block for the `items` collection — `{ year, title, body, status }`.
 * The item keys, labels and AI hints are exactly what these sections declared
 * before the migration; only the per-section labels vary.
 */
export function timelineItemsBlock (opts: {
  label: string
  yearLabel: string
  bodyLabel: string
  minItems: number
  maxItems: number
  newItem: () => Record<string, unknown>
  /** Chapters carries an image per item, declared between `body` and `status`. */
  withImage?: boolean
  /** Roadmap labels its active state "In Progress". */
  statusOptions?: FieldSpec["options"]
}): ItemsBlock {
  return {
    kind: "items",
    key: "items",
    canonical: "items",
    label: opts.label,
    pick: [],
    itemFields: [
      { key: "year", label: opts.yearLabel, type: "text" },
      {
        key: "title",
        label: "Title",
        type: "text",
        canonical: "headline",
        aiHint: "Section title (4–8 words)",
        maxLength: 60,
        group: "content",
      },
      {
        key: "body",
        label: opts.bodyLabel,
        type: "textarea",
        canonical: "body",
        aiHint: "Body copy (1–3 sentences)",
        maxLength: 300,
        group: "content",
      },
      ...(opts.withImage ? [{ key: "imageUrl", label: "Image", type: "image" as const }] : []),
      opts.statusOptions ? { ...STATUS_FIELD, options: opts.statusOptions } : STATUS_FIELD,
    ],
    ...(opts.withImage ? { itemPlaceholder: "landscape" as const } : {}),
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: opts.newItem,
  }
}

/** Node fill for a status — brand colour unless the entry is still planned. */
export function statusFillClass (status: string | undefined): string {
  return status === "planned" ? "bg-muted-foreground" : "bg-primary"
}
