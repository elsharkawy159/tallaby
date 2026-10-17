"use client"

import type { CSSProperties, ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionEditableImage } from "@/components/sections/section-editable-image"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { FieldSpec, ItemsBlock } from "@/components/sections/schema/section-schema"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the social-proof catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Social proof is mostly small, precisely styled type (a kicker, a score, a
 * source line) and logo rows, so the parts here are thin: they bind one prop or
 * one collection to the exact markup each section has always rendered, keeping
 * saved pages visually identical while every value becomes a slot entry.
 */

/** Tags `InlineEditableText` can render as. */
type TextTag = "span" | "p" | "div" | "h2" | "h3" | "blockquote"

const write = (instanceId: string, key: string) => (t: string) =>
  useBuilderStore.getState().updateSectionProps(instanceId, { [key]: t })

/** Reads a string prop defensively — instance props are untyped JSONB. */
export function propText (instance: SectionInstance, key: string): string | undefined {
  const v = instance.props[key]
  return typeof v === "string" ? v : undefined
}

/**
 * One inline-editable element bound to a flat prop. An absent prop renders
 * nothing (like the shared renderer); an empty string still renders, so a
 * cleared value stays selectable on the canvas.
 */
export function PropText ({
  instance,
  propKey,
  as = "p",
  className,
  style,
  isPreview,
}: {
  instance: SectionInstance
  propKey: string
  as?: TextTag
  className?: string
  style?: CSSProperties
  isPreview?: boolean
}) {
  const value = propText(instance, propKey)
  if (value === undefined) return null
  return (
    <InlineEditableText
      as={as}
      data-element-id={`${instance.id}::${propKey}`}
      data-element-type="text"
      className={className}
      style={style}
      value={value}
      isPreview={isPreview}
      onChange={write(instance.id, propKey)}
      onCommit={write(instance.id, propKey)}
    />
  )
}

/** A block drawn as a single `PropText` with section-specific type. */
export function textOverride ({
  key,
  ...rest
}: {
  key: string
  as?: TextTag
  className?: string
  style?: CSSProperties
  isPreview?: boolean
}): BlockOverride {
  return function TextOverride ({ instance }) {
    if (propText(instance, key) === undefined) return null
    return <PropText instance={instance} propKey={key} {...rest} />
  }
}

/** Inline-editable span bound to a flat prop, for lines that combine several props. */
export function PropSpan ({
  instance,
  propKey,
  isPreview,
  className,
}: {
  instance: SectionInstance
  propKey: string
  isPreview?: boolean
  className?: string
}) {
  return (
    <InlineEditableText
      as="span"
      data-element-id={`${instance.id}::${propKey}`}
      data-element-type="text"
      className={className}
      value={propText(instance, propKey) ?? ""}
      isPreview={isPreview}
      onChange={write(instance.id, propKey)}
      onCommit={write(instance.id, propKey)}
    />
  )
}

/** Inline-editable field of one collection item. */
export function ItemText ({
  instance,
  collection,
  index,
  field,
  as = "p",
  className,
  isPreview,
  elementKey,
  labelProp,
}: {
  instance: SectionInstance
  collection: string
  index: number
  field: string
  as?: TextTag
  className?: string
  isPreview?: boolean
  /** Element id suffix — kept from the pre-slot markup so selections survive. */
  elementKey?: string
  /** Marks this field as the item's label in the builder outline. */
  labelProp?: boolean
}) {
  const item = ((instance.props[collection] as Record<string, unknown>[] | undefined) ?? [])[index] ?? {}
  const raw = item[field]
  const update = (t: string) =>
    useBuilderStore.getState().updateItem(instance.id, collection, index, { [field]: t })
  return (
    <InlineEditableText
      as={as}
      data-element-id={`${instance.id}::${elementKey ?? `${collection}.${index}.${field}`}`}
      data-element-type="text"
      data-element-collection={collection}
      data-element-index={String(index)}
      {...(labelProp ? { "data-element-item-label-prop": field } : {})}
      className={className}
      value={raw === undefined || raw === null ? "" : String(raw)}
      isPreview={isPreview}
      onChange={update}
      onCommit={update}
    />
  )
}

/**
 * An item's image when one is set, else the section's own empty-state chrome
 * (a muted bar, an icon, a company name). Set images are canvas-selectable and
 * open the media picker; the fallback keeps unconfigured pages unchanged.
 */
export function ItemImage ({
  instance,
  collection,
  index,
  srcField,
  alt,
  className,
  isPreview,
  fallback,
}: {
  instance: SectionInstance
  collection: string
  index: number
  srcField: string
  alt: string
  className: string
  isPreview?: boolean
  fallback: ReactNode
}) {
  const item = ((instance.props[collection] as Record<string, unknown>[] | undefined) ?? [])[index] ?? {}
  const src = item[srcField]
  if (typeof src !== "string" || src.trim() === "") return <>{fallback}</>
  return (
    <SectionEditableImage
      instanceId={instance.id}
      elementKey={`${collection}.${index}.${srcField}`}
      src={src}
      alt={alt}
      collectionKey={collection}
      collectionIndex={index}
      itemSrcProp={srcField}
      isPreview={isPreview}
      className={className}
    />
  )
}

type LogoItem = { name?: string; imageUrl?: string }

/**
 * A row of grayscale logos. Unset logos render the muted bar these sections
 * have always shown, titled with the company name.
 */
export function ProofLogoRow ({
  instance,
  isPreview,
  className,
  itemClassName,
  imgClassName,
  barClassName,
  collection = "logos",
}: {
  instance: SectionInstance
  isPreview?: boolean
  className?: string
  itemClassName?: string
  imgClassName: string
  barClassName: string
  collection?: string
}) {
  const logos = (instance.props[collection] as LogoItem[] | undefined) ?? []
  if (logos.length === 0) return null
  return (
    <div className={className}>
      {logos.map((logo, i) => (
        <div key={i} className={itemClassName}>
          <ItemImage
            instance={instance}
            collection={collection}
            index={i}
            srcField="imageUrl"
            alt={String(logo.name ?? "")}
            className={imgClassName}
            isPreview={isPreview}
            fallback={<div className={cn("rounded bg-muted", barClassName)} title={logo.name} />}
          />
        </div>
      ))}
    </div>
  )
}

/** Schema block for a `{ name, imageUrl }` logo collection, compiled identically everywhere. */
export function logosBlock ({
  label = "Logos",
  nameLabel = "Company name",
  maxItems,
  newName = "Company",
  slot,
}: {
  label?: string
  nameLabel?: string
  maxItems: number
  newName?: string
  slot?: string
}): ItemsBlock {
  const itemFields: FieldSpec[] = [
    { key: "name", label: nameLabel, type: "text" },
    { key: "imageUrl", label: "Logo image", type: "image" },
  ]
  return {
    kind: "items",
    key: "logos",
    canonical: "logos",
    label,
    pick: ["name", "imageUrl"],
    itemFields,
    itemPlaceholder: "logo",
    minItems: 1,
    maxItems,
    newItem: () => ({ name: newName }),
    ...(slot ? { slot } : {}),
  }
}

/** Five filled stars — decorative, the score beside it carries the meaning. */
export function StarGlyphs ({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style} aria-hidden>
      ★★★★★
    </div>
  )
}

/**
 * True when the user hid `blockId` in `slotId`. For blocks whose value another
 * block draws (a stat label under its value), so hiding still takes effect.
 */
export function isBlockHidden (instance: SectionInstance, slotId: string, blockId: string): boolean {
  return instance.slots?.[slotId]?.hidden?.includes(blockId) ?? false
}
