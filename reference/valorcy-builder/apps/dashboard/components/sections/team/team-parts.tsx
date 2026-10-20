"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { EyebrowBlock, FieldSpec, HeadingBlock, ItemsBlock, MediaRatio } from "@/components/sections/schema/section-schema"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionInstance } from "@/components/sections/registry.types"
import type { PlaceholderKind } from "@/components/sections/placeholders"

/**
 * Chrome shared by the team catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Every team section except Ethos stores the same `members` collection —
 * `{ imageUrl, name, role, bio? }` — and those item keys are kept verbatim so
 * every saved page keeps its people. Ethos stores a `values` collection
 * (`{ emoji, title, description }`) beside a single culture photo.
 */

type EditableTag = "span" | "p" | "div" | "h3"

export type Member = { imageUrl?: string; name?: string; role?: string; bio?: string }

/** Reads a collection prop defensively — instance props are untyped JSONB. */
export function membersOf (instance: SectionInstance): Member[] {
  const raw = instance.props.members
  return Array.isArray(raw) ? (raw as Member[]) : []
}

/** One inline-editable field of a collection item, using the pre-slot element attributes. */
export function ItemText ({
  instance,
  collection = "members",
  index,
  field,
  value,
  className,
  as = "div",
  isPreview,
  elementId,
}: {
  instance: SectionInstance
  collection?: string
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

/** A member's photo, keeping the pre-slot `member-<i>` element key. */
export function MemberPhoto ({
  instance,
  member,
  index,
  isPreview,
  ratio = "square",
  placeholder = "avatar",
  rounded = "lg",
  className,
  imgClassName,
  sizes,
}: {
  instance: SectionInstance
  member: Member
  index: number
  isPreview?: boolean
  ratio?: MediaRatio
  placeholder?: PlaceholderKind
  rounded?: "none" | "lg" | "full"
  className?: string
  imgClassName?: string
  sizes?: string
}) {
  return (
    <SectionMedia
      instanceId={instance.id}
      elementKey={`member-${index}`}
      src={member.imageUrl}
      alt={member.name ?? ""}
      collectionKey="members"
      collectionIndex={index}
      itemSrcProp="imageUrl"
      itemAltProp="name"
      ratio={ratio}
      placeholder={placeholder}
      rounded={rounded}
      className={className}
      imgClassName={imgClassName}
      sizes={sizes ?? "(max-width: 640px) 50vw, 25vw"}
      isPreview={isPreview}
    />
  )
}

/**
 * Eyebrow with section-specific type. The shared eyebrow is always primary and
 * `mb-4`; the team sections have their own scales, so the block is overridden.
 * An absent value renders nothing, like the shared renderer.
 */
export function eyebrowAs (className: string, isPreview?: boolean): BlockOverride {
  return function TeamEyebrow ({ instance }) {
    const raw = instance.props.eyebrow
    if (typeof raw !== "string") return null
    const write = (t: string) =>
      useBuilderStore.getState().updateSectionProps(instance.id, { eyebrow: t })
    return (
      <InlineEditableText
        as="div"
        data-element-id={`${instance.id}::eyebrow`}
        data-element-type="text"
        className={className}
        value={raw}
        isPreview={isPreview}
        onChange={write}
        onCommit={write}
      />
    )
  }
}

/** Shared team headline scale. */
export const TEAM_HEADING_CLASS = `${TYPE_H2} text-foreground`

/** Muted, tracked uppercase kicker used by most team sections. */
export const TEAM_EYEBROW_CLASS = "text-xs font-semibold text-muted-foreground"

/**
 * Collection grids must span the slot even when the slot centres its entries;
 * a centred flex column would otherwise shrink the grid to its content.
 */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

// ─── Collection blocks ────────────────────────────────────────────────────────

/**
 * Schema block for the `members` collection. The item keys and labels are
 * exactly what these sections have always stored and shown.
 */
export function membersBlock (opts: {
  label: string
  maxItems: number
  newItem: () => Record<string, unknown>
  /** `bio` field: absent for photo-only sections, `text` when it is optional. */
  bio?: "textarea" | "optional" | false
  photoLabel?: string
  itemPlaceholder?: PlaceholderKind
}): ItemsBlock {
  const bio: FieldSpec[] =
    opts.bio === false
      ? []
      : opts.bio === "optional"
        ? [{ key: "bio", label: "Bio (optional)", type: "text" }]
        : [{ key: "bio", label: "Bio", type: "textarea" }]
  return {
    kind: "items",
    key: "members",
    canonical: "members",
    label: opts.label,
    pick: [],
    itemFields: [
      { key: "imageUrl", label: opts.photoLabel ?? "Photo", type: "image" },
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      ...bio,
    ],
    itemPlaceholder: opts.itemPlaceholder ?? "avatar",
    minItems: 1,
    maxItems: opts.maxItems,
    newItem: opts.newItem,
  }
}

/** The eyebrow block every team section carries, bound to the stored `eyebrow` key. */
export const TEAM_EYEBROW_BLOCK: EyebrowBlock = {
  kind: "eyebrow",
  field: {
    key: "eyebrow",
    aiHint: "Short label above the headline (1–3 words, sentence case)",
    maxLength: 30,
  },
}

/** The headline block every team section carries. */
export const TEAM_HEADING_BLOCK: HeadingBlock = {
  kind: "heading",
  level: 2,
  accent: false,
  fields: {
    headline: {
      key: "headline",
      aiHint: "Primary section headline (6–10 words, no period)",
      maxLength: 80,
    },
  },
}
