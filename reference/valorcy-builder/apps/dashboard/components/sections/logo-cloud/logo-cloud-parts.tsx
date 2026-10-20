"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionEditableImage } from "@/components/sections/section-editable-image"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionInstance } from "@/components/sections/registry.types"
import type {
  EyebrowBlock,
  FieldSpec,
  ItemsBlock,
} from "@/components/sections/schema/section-schema"

/**
 * Chrome shared by the logo-cloud catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Every logo cloud is the same two kinds of content — a short label and a
 * `logos` collection — arranged differently. The arrangement is each section's
 * JSX; the label, the logo mark and the collection schema live here so the
 * inline-editing plumbing is written once.
 */

export type LogoItem = { name?: string; imageUrl?: string; badge?: string }

/** Reads a collection defensively — instance props are untyped JSONB. */
export function readLogos (instance: SectionInstance, key = "logos"): LogoItem[] {
  const value = instance.props[key]
  return Array.isArray(value) ? (value as LogoItem[]) : []
}

const writeProp = (instanceId: string, key: string) => (t: string) =>
  useBuilderStore.getState().updateSectionProps(instanceId, { [key]: t })

const writeItem = (instanceId: string, collection: string, index: number, key: string) => (t: string) =>
  useBuilderStore.getState().updateItem(instanceId, collection, index, { [key]: t })

/** True when the user hid `blockId` in `slotId` — for chrome that mirrors a block. */
export function isBlockHidden (instance: SectionInstance, slotId: string, blockId: string): boolean {
  return Boolean(instance.slots?.[slotId]?.hidden?.includes(blockId))
}

/**
 * A short text label bound to the block's own prop. Every logo cloud styles its
 * label differently (inverted on a band, rotated on a rail), so the class is the
 * section's; the element id stays `${instanceId}::<key>`, as it always was.
 */
export function labelOverride (
  className: string,
  isPreview?: boolean,
  as: "p" | "span" = "p"
): BlockOverride {
  return function LogoCloudLabel ({ instance, block }) {
    const key = block.propKeys[0]
    if (!key) return null
    const value = instance.props[key]
    if (typeof value !== "string" || value === "") return null
    return (
      <InlineEditableText
        as={as}
        data-element-id={`${instance.id}::${key}`}
        data-element-type="text"
        className={className}
        value={value}
        isPreview={isPreview}
        onChange={writeProp(instance.id, key)}
        onCommit={writeProp(instance.id, key)}
      />
    )
  }
}

/** A plain inline-editable span bound to a flat prop, for composite overrides. */
export function PropText ({
  instance,
  propKey,
  className,
  isPreview,
}: {
  instance: SectionInstance
  propKey: string
  className?: string
  isPreview?: boolean
}) {
  const value = instance.props[propKey]
  if (typeof value !== "string") return null
  return (
    <InlineEditableText
      as="span"
      data-element-id={`${instance.id}::${propKey}`}
      data-element-type="text"
      className={className}
      value={value}
      isPreview={isPreview}
      onChange={writeProp(instance.id, propKey)}
      onCommit={writeProp(instance.id, propKey)}
    />
  )
}

/** Inline-editable text bound to one field of one collection item. */
export function ItemText ({
  instance,
  collection,
  index,
  field,
  value,
  className,
  isPreview,
}: {
  instance: SectionInstance
  collection: string
  index: number
  field: string
  value: unknown
  className?: string
  isPreview?: boolean
}) {
  return (
    <InlineEditableText
      as="span"
      data-element-id={`${instance.id}::${collection}.${index}.${field}`}
      data-element-type="text"
      className={className}
      value={String(value ?? "")}
      isPreview={isPreview}
      onChange={writeItem(instance.id, collection, index, field)}
      onCommit={writeItem(instance.id, collection, index, field)}
    />
  )
}

/**
 * One logo: the uploaded image when there is one, otherwise the section's
 * no-image treatment — the company name as type (`name`) or a muted bar
 * (`box`), exactly as each section drew it before the slot migration.
 */
export function LogoMark ({
  instance,
  logo,
  index,
  isPreview,
  imgClassName,
  nameClassName,
  boxClassName = "h-8 w-24 rounded bg-muted",
  fallback = "name",
  collection = "logos",
}: {
  instance: SectionInstance
  logo: LogoItem
  index: number
  isPreview?: boolean
  imgClassName: string
  nameClassName?: string
  boxClassName?: string
  fallback?: "name" | "box"
  collection?: string
}) {
  if (logo.imageUrl) {
    return (
      <SectionEditableImage
        instanceId={instance.id}
        elementKey={`${collection}.${index}.imageUrl`}
        src={logo.imageUrl}
        alt={logo.name ?? ""}
        collectionKey={collection}
        collectionIndex={index}
        itemSrcProp="imageUrl"
        isPreview={isPreview}
        className={imgClassName}
      />
    )
  }
  if (fallback === "box") {
    return <div className={boxClassName} title={logo.name} />
  }
  return (
    <ItemText
      instance={instance}
      collection={collection}
      index={index}
      field="name"
      value={logo.name}
      className={nameClassName}
      isPreview={isPreview}
    />
  )
}

// ─── Schema helpers ───────────────────────────────────────────────────────────

/** A label block (eyebrow kind) bound to an existing flat prop key. */
export function labelBlock (
  key: string,
  field: Omit<FieldSpec, "key">,
  slot?: string
): EyebrowBlock {
  return {
    kind: "eyebrow",
    id: key,
    label: field.label ?? "Label",
    field: { key, type: "text", canonical: "eyebrow", group: "content", ...field },
    ...(slot ? { slot } : {}),
  }
}

/**
 * The `logos` collection, compiled to exactly the item keys every logo cloud has
 * always stored (`name`, `imageUrl`, plus any extras such as `badge`).
 */
export function logosBlock (opts: {
  minItems: number
  maxItems: number
  label?: string
  nameLabel?: string
  imageLabel?: string
  /** False for clouds that only ever stored names (the trust strip). */
  withImage?: boolean
  extraFields?: FieldSpec[]
  newItem?: () => Record<string, unknown>
  slot?: string
}): ItemsBlock {
  const withImage = opts.withImage !== false
  return {
    kind: "items",
    key: "logos",
    canonical: "logos",
    label: opts.label ?? "Logos",
    pick: withImage ? ["name", "imageUrl"] : ["name"],
    itemFields: [
      { key: "name", label: opts.nameLabel ?? "Company name", type: "text" },
      ...(withImage ? [{ key: "imageUrl", label: opts.imageLabel ?? "Logo image", type: "image" as const }] : []),
      ...(opts.extraFields ?? []),
    ],
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: opts.newItem ?? (() => ({ name: "Company" })),
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

/** Fictional customer names for freshly inserted sections. */
const SAMPLE_NAMES = [
  "Northwind",
  "Lumen",
  "Arcadia",
  "Vertex",
  "Halcyon",
  "Quarry",
  "Brightline",
  "Solace",
  "Kestrel",
  "Monarch",
] as const

export function sampleLogos (count: number): { name: string }[] {
  return Array.from({ length: count }, (_, i) => ({ name: SAMPLE_NAMES[i % SAMPLE_NAMES.length]! }))
}
