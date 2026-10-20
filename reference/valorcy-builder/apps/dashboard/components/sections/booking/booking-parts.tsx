"use client"

import { type LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { SectionBadge } from "@/components/sections/_primitives/section-badge"
import { linkValueFromProp } from "@/lib/builder/links"
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
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the booking catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Booking sections are coupled to the business kits (`packages/kits` seeds name
 * these ids), and several hold functional widgets — the appointment form posts
 * through `useBookingSubmit`. So every section keeps the prop keys and item keys
 * it has always stored; these helpers only state the inline-editing plumbing and
 * the header block specs once.
 */

type EditableTag = "span" | "p" | "div" | "h3" | "h4"

// ─── Inline editing ───────────────────────────────────────────────────────────

/**
 * One inline-editable flat prop. `fallback` renders while the prop has never been
 * set — the literal a pre-migration page always showed there. An empty string
 * (the user cleared it) and an unset prop without a fallback render nothing.
 */
export function PropText ({
  instance,
  propKey,
  className,
  as = "span",
  isPreview,
  fallback,
  elementId,
}: {
  instance: SectionInstance
  propKey: string
  className?: string
  as?: EditableTag
  isPreview?: boolean
  fallback?: string
  /** `data-element-id` suffix when it differs from the prop key. */
  elementId?: string
}) {
  const value = textOr(instance, propKey, fallback)
  if (value === undefined || value === "") return null
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [propKey]: t })
  return (
    <InlineEditableText
      as={as}
      data-element-id={`${instance.id}::${elementId ?? propKey}`}
      data-element-type="text"
      className={className}
      value={value}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

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
}: {
  instance: SectionInstance
  collection: string
  index: number
  field: string
  value: unknown
  className?: string
  as?: EditableTag
  isPreview?: boolean
}) {
  const write = (t: string) =>
    useBuilderStore.getState().updateItem(instance.id, collection, index, { [field]: t })
  return (
    <InlineEditableText
      as={as}
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

/** A prop's string value, or `fallback` when it was never set. */
export function textOr<T extends string | undefined> (
  instance: SectionInstance,
  key: string,
  fallback: T
): string | T {
  const v = instance.props[key]
  return typeof v === "string" ? v : fallback
}

/** A stored collection, defensively — instance props are untyped JSONB. */
export function listOf<T> (instance: SectionInstance, key: string, fallback: T[] = []): T[] {
  const v = instance.props[key]
  return Array.isArray(v) ? (v as T[]) : fallback
}

/** A collection item field as display text. */
export function s (v: unknown): string {
  return v === undefined || v === null ? "" : String(v)
}

// ─── Overrides ────────────────────────────────────────────────────────────────

/** A flat prop drawn as plain inline-editable text. Hidden when empty. */
export function propNote (
  key: string,
  className: string,
  isPreview?: boolean,
  opts: { as?: EditableTag; fallback?: string } = {}
): BlockOverride {
  return function PropNote ({ instance }) {
    return (
      <PropText
        instance={instance}
        propKey={key}
        as={opts.as ?? "p"}
        className={className}
        isPreview={isPreview}
        fallback={opts.fallback}
      />
    )
  }
}

/** A flat prop led by an icon, one detail line. Hidden when empty. */
export function iconNote (
  key: string,
  Icon: LucideIcon,
  className: string,
  iconClassName: string,
  isPreview?: boolean
): BlockOverride {
  return function IconNote ({ instance }) {
    const v = textOr(instance, key, undefined)
    if (!v) return null
    return (
      <div className={className}>
        <Icon className={iconClassName} aria-hidden />
        <PropText instance={instance} propKey={key} isPreview={isPreview} />
      </div>
    )
  }
}

/** The small uppercase primary-coloured kicker most booking sections lead with. */
export function kickerEyebrow (className: string, isPreview?: boolean): BlockOverride {
  return propNote("eyebrow", cn("text-xs font-semibold text-primary", className), isPreview)
}

/** The eyebrow drawn as the shared pill badge. Hidden when empty. */
export function badgeEyebrow (isPreview?: boolean, className?: string): BlockOverride {
  return function BadgeEyebrow ({ instance }) {
    const v = textOr(instance, "eyebrow", undefined)
    if (!v) return null
    return (
      <div className={className}>
        <SectionBadge instanceId={instance.id} propKey="eyebrow" value={v} isPreview={isPreview} />
      </div>
    )
  }
}

/** Renders nothing — for a block another block's override already draws. */
export const carried: BlockOverride = () => null

/**
 * A single action bound to flat `label` / `href` props. With no `hrefProp` it is
 * a plain button (several booking cards never linked anywhere). The label was
 * always drawn, even when empty, so it is here too.
 */
export function FlatAction ({
  instance,
  isPreview,
  labelProp = "ctaLabel",
  hrefProp,
  fallback = "",
  className,
  elementId,
}: {
  instance: SectionInstance
  isPreview?: boolean
  labelProp?: string
  hrefProp?: string
  fallback?: string
  className?: string
  /** Accepted for existing call sites; actions no longer append an arrow (§6.5). */
  arrow?: boolean
  arrowClassName?: string
  /** `data-element-id` suffix — only for actions that always emitted one. */
  elementId?: string
}) {
  const label = textOr(instance, labelProp, fallback)
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [labelProp]: t })
  const body = (
    <>
      <InlineEditableText
        as="span"
        {...(elementId && !hrefProp
          ? { "data-element-id": `${instance.id}::${elementId}`, "data-element-type": "text" }
          : {})}
        value={label}
        isPreview={isPreview}
        onChange={write}
        onCommit={write}
      />
    </>
  )

  if (!hrefProp) {
    return (
      <button type="button" className={className}>
        {body}
      </button>
    )
  }

  const href = instance.props[hrefProp]
  return (
    <SectionLink
      link={linkValueFromProp(typeof href === "string" ? href : "#")}
      isPreview={isPreview}
      data-element-id={`${instance.id}::${elementId ?? labelProp}`}
      data-element-type="textLink"
      data-element-href-prop={hrefProp}
      className={className}
    >
      {body}
    </SectionLink>
  )
}

// ─── Slot helpers ─────────────────────────────────────────────────────────────

/**
 * Collections must span the slot even when the slot centres its entries; a
 * centred flex column would otherwise shrink them to their content.
 */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch text-start" : undefined
}

/** Primary-tinted surface used to highlight a recommended option. */
export const HIGHLIGHT_SURFACE = "bg-[color-mix(in_oklch,var(--primary)_5%,var(--card))]"

// ─── Block specs ──────────────────────────────────────────────────────────────

type FieldOpts = { aiHint?: string; maxLength?: number; label?: string }

export function eyebrowBlock (opts: FieldOpts = {}): EyebrowBlock {
  return {
    kind: "eyebrow",
    field: {
      key: "eyebrow",
      label: opts.label ?? "Eyebrow",
      type: "text",
      canonical: "eyebrow",
      ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
      maxLength: opts.maxLength ?? 30,
      group: "content",
    },
  }
}

export function headingBlock (opts: FieldOpts = {}): HeadingBlock {
  return {
    kind: "heading",
    level: 2,
    accent: false,
    fields: {
      headline: {
        key: "headline",
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

export function descriptionBlock (opts: FieldOpts = {}): BodyBlock {
  return {
    kind: "body",
    field: {
      key: "description",
      label: opts.label ?? "Description",
      type: "textarea",
      canonical: "body",
      ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
      maxLength: opts.maxLength ?? 200,
      group: "content",
    },
  }
}

/** A flat prop as a note block whose id follows its key. */
export function noteBlock (
  field: FieldSpec & { label: string },
  opts: { slot?: string; blockLabel?: string } = {}
): NoteBlock {
  return {
    kind: "note",
    id: field.key,
    label: opts.blockLabel ?? field.label,
    ...(opts.slot ? { slot: opts.slot } : {}),
    field,
  }
}

/** A collection bound to its existing key and item shape (no canonical remap). */
export function collectionBlock (opts: {
  key: string
  label: string
  itemFields: FieldSpec[]
  minItems?: number
  maxItems?: number
  newItem: () => Record<string, unknown>
  slot?: string
}): ItemsBlock {
  return {
    kind: "items",
    key: opts.key,
    canonical: "items",
    label: opts.label,
    pick: [],
    itemFields: opts.itemFields,
    ...(opts.minItems !== undefined ? { minItems: opts.minItems } : {}),
    ...(opts.maxItems !== undefined ? { maxItems: opts.maxItems } : {}),
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

/** Button colourways shared by the booking cards. */
export const PRIMARY_BUTTON =
  "bg-primary text-primary-foreground transition hover:opacity-90"

export const OUTLINE_BUTTON =
  "border-[1.5px] border-primary text-primary transition hover:opacity-90"
