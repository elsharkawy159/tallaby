"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionEyebrow } from "@/components/sections/_primitives/section-eyebrow"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { PlaceholderKind } from "@/components/sections/placeholders"
import type {
  EyebrowBlock,
  FieldSpec,
  HeadingBlock,
  ItemsBlock,
  MediaRatio,
} from "@/components/sections/schema/section-schema"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the gallery catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Three collection shapes exist in this category and all are kept verbatim so
 * every saved page keeps its images:
 *
 *   • `items` — `{ imageUrl, alt, title, caption }` (six of the eight sections)
 *   • `items` — `{ imageUrl, name, country, tagline, price, href }` (Voyage)
 *   • `items` — `{ imageUrl, title, category, description, href }` (Casebook)
 */

type EditableTag = "span" | "p" | "div" | "h3"

export type GalleryImage = { imageUrl?: string; alt?: string; title?: string; caption?: string }

/** The `items` collection, read defensively — instance props are untyped JSONB. */
export function itemsOf<T> (instance: SectionInstance): T[] {
  const v = instance.props.items
  return Array.isArray(v) ? (v as T[]) : []
}

/** A string prop, or `fallback` when it has never been set. */
export function propOr (instance: SectionInstance, key: string, fallback: string): string {
  const v = instance.props[key]
  return typeof v === "string" ? v : fallback
}

/** One inline-editable field of an `items` entry, using the pre-slot element attributes. */
export function ItemText ({
  instance,
  index,
  field,
  value,
  className,
  as = "div",
  isPreview,
  elementId,
}: {
  instance: SectionInstance
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
    useBuilderStore.getState().updateItem(instance.id, "items", index, { [field]: t })
  return (
    <InlineEditableText
      as={as}
      {...(elementId
        ? { "data-element-id": `${instance.id}::${elementId}`, "data-element-type": "text" }
        : {})}
      data-element-collection="items"
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
 * The image of one `items` entry. Keeps the pre-slot element key (`item-<i>`)
 * so selections and the media picker keep resolving to the same element.
 */
export function ItemImage ({
  instance,
  index,
  src,
  alt,
  altProp,
  ratio = "square",
  placeholder,
  rounded = "lg",
  className,
  imgClassName,
  sizes,
  isPreview,
}: {
  instance: SectionInstance
  index: number
  src: unknown
  alt?: string
  /** Item key holding the alt text; omit when the collection stores none. */
  altProp?: string
  ratio?: MediaRatio
  placeholder?: PlaceholderKind
  rounded?: "none" | "md" | "lg"
  className?: string
  imgClassName?: string
  sizes?: string
  isPreview?: boolean
}) {
  return (
    <SectionMedia
      instanceId={instance.id}
      elementKey={`item-${index}`}
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      collectionKey="items"
      collectionIndex={index}
      itemSrcProp="imageUrl"
      {...(altProp ? { itemAltProp: altProp } : {})}
      ratio={ratio}
      placeholder={placeholder}
      rounded={rounded}
      className={cn("bg-muted", className)}
      imgClassName={imgClassName}
      sizes={sizes}
      isPreview={isPreview}
    />
  )
}

/**
 * The gallery eyebrow: muted, widely tracked, tighter to the headline than the
 * shared primary-tinted eyebrow. Rendered only when the prop is a string, like
 * the shared renderer.
 */
export function mutedEyebrow (className: string, isPreview?: boolean): BlockOverride {
  return function MutedEyebrow ({ instance }) {
    const v = instance.props.eyebrow
    if (typeof v !== "string") return null
    return (
      <SectionEyebrow
        instanceId={instance.id}
        value={v}
        propKey="eyebrow"
        tone="muted"
        isPreview={isPreview}
        className={cn("", className)}
      />
    )
  }
}

// ─── Schema blocks ────────────────────────────────────────────────────────────

/**
 * A per-card label that used to be hardcoded JSX ("From", "Explore", "View
 * project"). It is a setting, not a slot entry, because it renders once per
 * card; pages saved before the migration carry no prop, so the renderer falls
 * back to the old literal via `propOr`.
 */
export function labelSetting (key: string, label: string, fallback: string): FieldSpec {
  return { key, label, type: "text", group: "content", maxLength: 30, default: fallback }
}

/** The eyebrow every gallery has stored under `eyebrow`. */
export function galleryEyebrowBlock (): EyebrowBlock {
  return {
    kind: "eyebrow",
    field: {
      key: "eyebrow",
      canonical: "eyebrow",
      aiHint: "Short label above the headline (1–3 words, sentence case)",
      maxLength: 30,
      group: "content",
    },
  }
}

/** The plain (accent-free) gallery headline. */
export function galleryHeadingBlock (maxLength = 80): HeadingBlock {
  return {
    kind: "heading",
    level: 2,
    accent: false,
    fields: {
      headline: {
        key: "headline",
        canonical: "headline",
        aiHint: "Primary section headline (6–10 words, no period)",
        maxLength,
        group: "content",
      },
    },
  }
}

const IMAGE_FIELDS: FieldSpec[] = [
  { key: "imageUrl", label: "Image", type: "image" },
  { key: "alt", label: "Alt text", type: "text", canonical: "imageAlt", aiHint: "Image alt text", maxLength: 120, group: "media" },
  { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Section title (4–8 words)", maxLength: 60, group: "content" },
  { key: "caption", label: "Caption", type: "text" },
]

/**
 * Schema block for the `{ imageUrl, alt, title, caption }` collection. The item
 * keys are exactly what these sections have always stored.
 */
export function galleryImagesBlock (opts: {
  label: string
  minItems: number
  maxItems: number
  slot?: string
}): ItemsBlock {
  return {
    kind: "items",
    key: "items",
    canonical: "items",
    label: opts.label,
    pick: [],
    itemFields: IMAGE_FIELDS,
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: () => ({ imageUrl: "", alt: "", title: "", caption: "" }),
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}
