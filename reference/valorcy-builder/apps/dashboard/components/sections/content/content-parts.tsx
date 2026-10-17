"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { FieldSpec, NoteBlock } from "@/components/sections/schema/section-schema"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the content catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Content sections are the most bespoke in the library — bios, schedules,
 * code tabs, credential lists — so most of their blocks need their own type
 * scale. These helpers keep that to one line per block while preserving the
 * pre-slot `data-element-id`s, so selections and AI targeting survive.
 */

type EditableTag = "span" | "p" | "h2" | "h3" | "div" | "blockquote"

const writeProp = (instanceId: string, key: string) => (t: string) =>
  useBuilderStore.getState().updateSectionProps(instanceId, { [key]: t })

/** Reads a string prop, or the fallback when it was never set. */
export function textOf (props: Record<string, unknown>, key: string, fallback?: string): string | undefined {
  const raw = props[key]
  return typeof raw === "string" ? raw : fallback
}

/**
 * One inline-editable flat prop, bound to `${instanceId}::${propKey}`.
 *
 * Renders nothing when the prop is empty, or absent with no fallback — the
 * pre-slot markup guarded these the same way (`{eyebrow && …}`). A fallback is
 * only for copy that used to be hardcoded in JSX, so pages saved before the
 * migration keep rendering it.
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
  const value = textOf(instance.props, propKey, fallback)
  if (!value) return null
  const write = writeProp(instance.id, propKey)
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

/** Override that draws a block's primary prop with section-specific chrome. */
export function propText (
  key: string,
  opts: { className?: string; as?: EditableTag; fallback?: string } = {}
): BlockOverride {
  return function PropTextOverride ({ instance, isPreview }) {
    return <PropText instance={instance} propKey={key} isPreview={isPreview} {...opts} />
  }
}

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
  /** `data-element-id` suffix — kept from the pre-slot markup where one existed. */
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
 * A single action bound to flat `ctaLabel` / `ctaHref` props — how every
 * content section has always stored its button.
 */
export function ActionLink ({
  instance,
  isPreview,
  className,
  labelProp = "ctaLabel",
  hrefProp = "ctaHref",
}: {
  instance: SectionInstance
  isPreview?: boolean
  className?: string
  labelProp?: string
  hrefProp?: string
  /** Accepted for existing call sites; buttons no longer append an arrow (§6.5). */
  arrow?: boolean
}) {
  const label = textOf(instance.props, labelProp)
  if (!label) return null
  const href = textOf(instance.props, hrefProp) ?? "#"
  const write = writeProp(instance.id, labelProp)
  return (
    <SectionLink
      link={linkValueFromProp(href || "#")}
      isPreview={isPreview}
      data-element-id={`${instance.id}::${labelProp}`}
      data-element-type="textLink"
      data-element-href-prop={hrefProp}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90",
        className
      )}
    >
      <InlineEditableText as="span" value={label} isPreview={isPreview} onChange={write} onCommit={write} />
    </SectionLink>
  )
}

/**
 * The flat `ctaLabel` / `ctaHref` pair as two note blocks: the label draws the
 * button (see `actionOverrides`), the link is an inspector field only.
 */
export function actionBlocks (opts: { maxLength: number; slot?: string }): NoteBlock[] {
  const slot = opts.slot ? { slot: opts.slot } : {}
  return [
    {
      kind: "note",
      id: "ctaLabel",
      label: "CTA label",
      ...slot,
      field: { key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", maxLength: opts.maxLength, group: "cta" },
    },
    {
      kind: "note",
      id: "ctaHref",
      label: "CTA link",
      ...slot,
      field: { key: "ctaHref", label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" },
    },
  ]
}

/** Overrides for `actionBlocks` — the button, and nothing for its link. */
export function actionOverrides (className: string, opts: { arrow?: boolean } = {}): Record<string, BlockOverride> {
  return {
    ctaLabel: ({ instance, isPreview }) => (
      <ActionLink instance={instance} isPreview={isPreview} className={className} arrow={opts.arrow} />
    ),
    // Carried by the button above; edited in the inspector.
    ctaHref: () => null,
  }
}

/**
 * Some content sections store plain string lists (credentials, pain points)
 * edited as a JSON array in the inspector. Accepts the array, a JSON string,
 * or newline-separated text, so a hand-edited value never crashes the render.
 */
export function toStringList (value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v ?? "")).filter(Boolean)
  if (typeof value !== "string" || value.trim() === "") return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map((v) => String(v ?? "")).filter(Boolean)
  } catch {
    // Not JSON — treat as one entry per line.
  }
  return value.split("\n").map((s) => s.trim()).filter(Boolean)
}

/**
 * A string-list prop as a note block. Kept a note (not an `items` block) because
 * the stored value is `string[]`, not objects — an items block would hand the
 * collection editor strings it cannot address.
 */
export function stringListBlock (field: FieldSpec & { key: string }, slot?: string): NoteBlock {
  return {
    kind: "note",
    id: field.key,
    label: field.label,
    ...(slot ? { slot } : {}),
    field: { type: "textarea", group: "content", ...field },
  }
}

/**
 * A label that used to be hardcoded inside a block's chrome ("Challenge",
 * "Phone", …). Declared as a schema setting so it is editable in the inspector
 * without becoming a reorderable entry of its own; rendered with `fallback`
 * when absent so pre-migration pages are unchanged.
 */
export function labelSetting (key: string, label: string, maxLength = 30): FieldSpec {
  return { key, label, type: "text", group: "content", maxLength }
}

/** Collections span the slot even when the slot centres its entries. */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

/** Shared slot className for the eyebrow → headline → description header pattern. */
export const CENTERED_HEADER = "flex w-full flex-col items-center gap-5 text-center"
