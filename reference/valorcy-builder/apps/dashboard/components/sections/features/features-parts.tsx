"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { SectionEyebrow } from "@/components/sections/_primitives/section-eyebrow"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import type { LucideIcon } from "lucide-react"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type {
  BodyBlock,
  EyebrowBlock,
  FieldSpec,
  HeadingBlock,
  NoteBlock,
} from "@/components/sections/schema/section-schema"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionInstance } from "@/components/sections/registry.types"
import type { ReactNode } from "react"

/**
 * Chrome shared by the features catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Every features section keeps the prop keys and collection item keys it has
 * always stored; these helpers only state the shared editing plumbing and the
 * standard header block specs once.
 */

type EditableTag = "span" | "p" | "div" | "h3" | "h4"

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

/** A setting's string value, or the literal pre-migration pages rendered. */
export function textOr (instance: SectionInstance, key: string, fallback: string): string {
  const v = instance.props[key]
  return typeof v === "string" ? v : fallback
}

// ─── Slot helpers ─────────────────────────────────────────────────────────────

/**
 * Collection grids must span the slot even when the slot centres its entries;
 * a centred flex column would otherwise shrink the grid to its content.
 */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

/** The icon a stored name refers to, or the section's fallback icon. */
export function iconFor (icons: Record<string, LucideIcon>, name: unknown, fallback: LucideIcon): LucideIcon {
  return (typeof name === "string" ? icons[name] : undefined) ?? fallback
}

/** Item `icon` select field over a section's icon set (unchanged from the hand-written definitions). */
export function iconField (icons: Record<string, LucideIcon>): FieldSpec {
  return {
    key: "icon",
    label: "Icon",
    type: "select",
    options: Object.keys(icons).map((k) => ({ label: k, value: k })),
  }
}

/**
 * Override for the pill-styled eyebrow several features sections share.
 * Renders nothing for an absent or empty value.
 */
export function pillEyebrow (isPreview?: boolean, className?: string): BlockOverride {
  return function PillEyebrow ({ instance }) {
    const v = instance.props.eyebrow
    if (typeof v !== "string" || v === "") return null
    return (
      <PropText
        instance={instance}
        propKey="eyebrow"
        as="div"
        isPreview={isPreview}
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-muted-foreground",
          className
        )}
      />
    )
  }
}

/** Override for a plain eyebrow with a section-specific type scale. Hidden when empty. */
export function styledEyebrow (className: string, isPreview?: boolean): BlockOverride {
  return function StyledEyebrow ({ instance }) {
    const v = instance.props.eyebrow
    if (typeof v !== "string" || v === "") return null
    return <SectionEyebrow instanceId={instance.id} value={v} isPreview={isPreview} className={className} />
  }
}

/**
 * A single action bound to flat `label` / `href` props. Renders nothing when the
 * label was cleared (the pre-slot markup hid it then) and the old default label
 * when it was never set.
 */
export function FlatLinkAction ({
  instance,
  isPreview,
  labelProp,
  hrefProp,
  fallback,
  className,
  suffix,
}: {
  instance: SectionInstance
  isPreview?: boolean
  labelProp: string
  hrefProp: string
  fallback: string
  className?: string
  suffix?: ReactNode
}) {
  const label = textOr(instance, labelProp, fallback)
  if (label === "") return null
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

// ─── Standard header blocks ───────────────────────────────────────────────────

/** AI hints the original hand-written definitions carried, kept verbatim. */
export const HINTS = {
  eyebrow: "Short label above the headline (1–3 words, sentence case)",
  headline: "Primary section headline (6–10 words, no period)",
  accentWord: "Highlighted word or phrase in the headline (1–3 words)",
  headlineSuffix: "Trailing words after the accented part of the headline",
  description: "Short descriptive paragraph (1–3 sentences, 20–60 words)",
  itemTitle: "Section title (4–8 words)",
  itemBody: "Body copy (1–3 sentences)",
} as const

type FieldOpts = { aiHint?: string; maxLength?: number }

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

export function headingBlock (opts: {
  accent?: boolean
  suffix?: boolean
  headline?: FieldOpts & { key?: string; label?: string }
  /** Bind to a legacy key — the block id follows it. */
  id?: string
} = {}): HeadingBlock {
  const h = opts.headline ?? {}
  return {
    kind: "heading",
    level: 2,
    accent: opts.accent ?? false,
    ...(opts.suffix ? { suffix: true } : {}),
    ...(opts.id ? { id: opts.id } : {}),
    fields: {
      headline: {
        key: h.key ?? "headline",
        label: h.label ?? "Headline",
        type: "text",
        canonical: "headline",
        ...(h.aiHint ? { aiHint: h.aiHint } : {}),
        maxLength: h.maxLength ?? 80,
        group: "content",
      },
      ...(opts.accent
        ? {
            accentWord: {
              key: "accentWord",
              label: "Accent word",
              type: "text" as const,
              canonical: "headline" as const,
              aiHint: HINTS.accentWord,
              maxLength: 30,
              group: "content" as const,
            },
          }
        : {}),
      ...(opts.suffix
        ? {
            headlineSuffix: {
              key: "headlineSuffix",
              label: "Headline suffix",
              type: "text" as const,
              canonical: "headline" as const,
              aiHint: HINTS.headlineSuffix,
              maxLength: 40,
              group: "content" as const,
            },
          }
        : {}),
    },
  }
}

export function descriptionBlock (opts: FieldOpts & { key?: string; label?: string; id?: string } = {}): BodyBlock {
  const key = opts.key ?? "description"
  return {
    kind: "body",
    ...(key !== "description" ? { id: opts.id ?? key } : {}),
    field: {
      key,
      label: opts.label ?? "Description",
      type: "textarea",
      canonical: "body",
      ...(opts.aiHint ? { aiHint: opts.aiHint } : {}),
      maxLength: opts.maxLength ?? 280,
      group: "content",
    },
  }
}

/** The house header — eyebrow, headline (optional accent) and description — with the original hints. */
export function standardHeader (opts: { accent?: boolean; suffix?: boolean } = {}) {
  return [
    eyebrowBlock({ aiHint: HINTS.eyebrow }),
    headingBlock({ accent: opts.accent, suffix: opts.suffix, headline: { aiHint: HINTS.headline } }),
    descriptionBlock({ aiHint: HINTS.description }),
  ]
}

/**
 * A flat label + link action as two note blocks: the label draws the link
 * (override), the href is carried by it and edited in the inspector.
 */
export function flatActionBlocks (opts: {
  labelKey: string
  hrefKey: string
  labelAiHint?: string
  maxLength: number
}): [NoteBlock, NoteBlock] {
  return [
    {
      kind: "note",
      id: opts.labelKey,
      label: "Link label",
      field: {
        key: opts.labelKey,
        label: "CTA label",
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
      label: "Link",
      field: { key: opts.hrefKey, label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" },
    },
  ]
}
