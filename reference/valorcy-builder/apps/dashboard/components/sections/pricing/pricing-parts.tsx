"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { SectionHeadline } from "@/components/sections/_primitives/section-headline"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { FieldSpec, ItemsBlock, SectionBlock } from "@/components/sections/schema/section-schema"
import type { SectionInstance } from "@/components/sections/registry.types"
import type { ComponentProps, CSSProperties } from "react"

type TextTag = ComponentProps<typeof InlineEditableText>["as"]

/**
 * Chrome shared by the pricing catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Every pricing section used to read its header copy with a hardcoded fallback
 * (`props.headline ?? "Simple, transparent"`). The overrides here keep those
 * fallbacks, so a stored page that never set a key renders exactly what it did
 * before the slot migration; defaults still only apply on insert.
 */

export type Plan = {
  name?: string
  price?: string
  priceSuffix?: string
  annualPrice?: string
  description?: string
  features?: string[]
  ctaLabel?: string
  ctaHref?: string
  isPopular?: boolean
}

const write = (instanceId: string, key: string) => (t: string) =>
  useBuilderStore.getState().updateSectionProps(instanceId, { [key]: t })

/** `String(props[key] ?? fallback)` — the read every pre-slot pricing section did. */
export function textProp (props: Record<string, unknown>, key: string, fallback: string): string {
  const v = props[key]
  return v === undefined || v === null ? fallback : String(v)
}

/** A collection read that tolerates malformed JSONB. */
export function readItems<T> (props: Record<string, unknown>, key: string): T[] {
  const v = props[key]
  return Array.isArray(v) ? (v as T[]) : []
}

/** Stretches a collection entry across a centered column; other entries keep their width. */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}

// ─── Header overrides ─────────────────────────────────────────────────────────

/**
 * The kicker above every pricing headline. Name kept for call sites; it used to
 * be a tinted ALL-CAPS pill, now a plain sentence-case line (§6.5).
 */
export function eyebrowPill (opts: {
  primary: string
  fallback: string
  className?: string
}): BlockOverride {
  return function EyebrowPill ({ instance, isPreview }) {
    return (
      <div className={cn("text-sm font-medium text-muted-foreground", opts.className)}>
        <InlineEditableText
          as="span"
          data-element-id={`${instance.id}::eyebrow`}
          data-element-type="text"
          value={textProp(instance.props, "eyebrow", opts.fallback)}
          isPreview={isPreview}
          onChange={write(instance.id, "eyebrow")}
          onCommit={write(instance.id, "eyebrow")}
        />
      </div>
    )
  }
}

/** Headline + accent word, falling back to the pre-slot hardcoded copy. */
export function headlineWithFallback (opts: {
  headline: string
  accentWord?: string
  className: string
}): BlockOverride {
  return function HeadlineWithFallback ({ instance, isPreview }) {
    return (
      <SectionHeadline
        instanceId={instance.id}
        isPreview={isPreview}
        headline={textProp(instance.props, "headline", opts.headline)}
        accentWord={
          opts.accentWord === undefined
            ? undefined
            : textProp(instance.props, "accentWord", opts.accentWord)
        }
        level={2}
        className={opts.className}
      />
    )
  }
}

/** A scalar text prop drawn inline-editable, with the pre-slot fallback. */
export function textWithFallback (opts: {
  propKey: string
  fallback: string
  className?: string
  as?: TextTag
}): BlockOverride {
  return function TextWithFallback ({ instance, isPreview }) {
    return (
      <InlineEditableText
        as={opts.as ?? "p"}
        data-element-id={`${instance.id}::${opts.propKey}`}
        data-element-type="text"
        className={opts.className}
        value={textProp(instance.props, opts.propKey, opts.fallback)}
        isPreview={isPreview}
        onChange={write(instance.id, opts.propKey)}
        onCommit={write(instance.id, opts.propKey)}
      />
    )
  }
}

// ─── Plan item parts ──────────────────────────────────────────────────────────

/** One plan field, inline-editable in place, keeping the pre-slot element grammar. */
export function PlanText ({
  instance,
  isPreview,
  index,
  field,
  value,
  as = "span",
  className,
  collection = "plans",
}: {
  instance: SectionInstance
  isPreview?: boolean
  index: number
  field: string
  value: unknown
  as?: TextTag
  className?: string
  collection?: string
}) {
  const store = useBuilderStore.getState
  return (
    <InlineEditableText
      as={as}
      data-element-collection={collection}
      data-element-index={String(index)}
      data-element-item-label-prop={field}
      className={className}
      value={value === undefined || value === null ? "" : String(value)}
      isPreview={isPreview}
      onChange={(t) => store().updateItem(instance.id, collection, index, { [field]: t })}
      onCommit={(t) => store().updateItem(instance.id, collection, index, { [field]: t })}
    />
  )
}

/** A plan's call to action: its link carries `ctaHref`, its label is editable in place. */
export function PlanCta ({
  instance,
  isPreview,
  index,
  plan,
  className,
  style,
  collection = "plans",
}: {
  instance: SectionInstance
  isPreview?: boolean
  index: number
  plan: Plan
  className?: string
  style?: CSSProperties
  collection?: string
}) {
  const store = useBuilderStore.getState
  return (
    <SectionLink
      link={linkValueFromProp(plan.ctaHref)}
      isPreview={isPreview}
      data-element-collection={collection}
      data-element-index={String(index)}
      data-element-item-href-prop="ctaHref"
      className={className}
      style={style}
    >
      <InlineEditableText
        as="span"
        value={String(plan.ctaLabel ?? "")}
        isPreview={isPreview}
        onChange={(t) => store().updateItem(instance.id, collection, index, { ctaLabel: t })}
        onCommit={(t) => store().updateItem(instance.id, collection, index, { ctaLabel: t })}
      />
    </SectionLink>
  )
}

// ─── Schema helpers ───────────────────────────────────────────────────────────

/** The header fields every pricing section has always declared, verbatim. */
const HEADER_FIELDS = {
  eyebrow: {
    key: "eyebrow",
    label: "Eyebrow",
    type: "text",
    canonical: "eyebrow",
    aiHint: "Short label above the headline (1–3 words, sentence case)",
    maxLength: 30,
    group: "content",
  },
  headline: {
    key: "headline",
    label: "Headline",
    type: "text",
    canonical: "headline",
    aiHint: "Primary section headline (6–10 words, no period)",
    maxLength: 80,
    group: "content",
  },
  accentWord: {
    key: "accentWord",
    label: "Accent word",
    type: "text",
    canonical: "headline",
    aiHint: "Highlighted word or phrase in the headline (1–3 words)",
    maxLength: 30,
    group: "content",
  },
  description: {
    key: "description",
    label: "Description",
    type: "textarea",
    canonical: "body",
    aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)",
    maxLength: 280,
    group: "content",
  },
} satisfies Record<string, FieldSpec>

/** Eyebrow → headline (with accent) → description, bound to the stored keys. */
export function pricingHeaderBlocks (opts: { eyebrow?: boolean; description?: boolean } = {}): SectionBlock[] {
  const blocks: SectionBlock[] = []
  if (opts.eyebrow !== false) {
    blocks.push({ kind: "eyebrow", label: "Eyebrow", field: HEADER_FIELDS.eyebrow })
  }
  blocks.push({
    kind: "heading",
    level: 2,
    accent: true,
    fields: { headline: HEADER_FIELDS.headline, accentWord: HEADER_FIELDS.accentWord },
  })
  if (opts.description !== false) {
    blocks.push({ kind: "body", field: HEADER_FIELDS.description })
  }
  return blocks
}

/** Every plan item field the catalog has ever declared, with its original metadata. */
const PLAN_FIELDS: Record<string, FieldSpec> = {
  name: { key: "name", label: "Name", type: "text" },
  price: { key: "price", label: "Price", type: "text" },
  priceSuffix: { key: "priceSuffix", label: "Price suffix", type: "text" },
  annualPrice: { key: "annualPrice", label: "Annual price", type: "text" },
  description: {
    key: "description",
    label: "Description",
    type: "text",
    canonical: "body",
    aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)",
    maxLength: 280,
    group: "content",
  },
  isPopular: { key: "isPopular", label: "Popular", type: "switch" },
  ctaLabel: {
    key: "ctaLabel",
    label: "CTA label",
    type: "text",
    canonical: "ctaPrimary",
    aiHint: "CTA button label (1–4 words)",
    maxLength: 30,
    group: "cta",
  },
  ctaHref: { key: "ctaHref", label: "CTA link", type: "url", group: "cta" },
}

/**
 * The `plans` items block. `pick: []` + explicit `itemFields` reproduce each
 * section's stored item keys exactly — the canonical `plans` shape is close but
 * not identical (`priceSuffix`, `annualPrice` are not in it).
 */
export function plansBlock (opts: {
  fields: (keyof typeof PLAN_FIELDS | FieldSpec)[]
  minItems: number
  maxItems: number
  newItem: () => Record<string, unknown>
  label?: string
  slot?: string
}): ItemsBlock {
  return {
    kind: "items",
    key: "plans",
    canonical: "plans",
    label: opts.label ?? "Plans",
    pick: [],
    itemFields: opts.fields.map((f) => (typeof f === "string" ? PLAN_FIELDS[f]! : f)),
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

/**
 * Label text that used to be hardcoded in a card ("Most popular"). It is a
 * section setting rather than a block — it renders inside every popular card,
 * not as an entry of its own — and its reader falls back to the old literal.
 */
export function labelSetting (key: string, label: string, fallback: string): FieldSpec {
  return { key, label, type: "text", group: "content", maxLength: 30, default: fallback }
}
