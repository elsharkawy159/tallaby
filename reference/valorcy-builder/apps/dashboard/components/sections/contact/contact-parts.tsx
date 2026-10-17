"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionHeadline } from "@/components/sections/_primitives/section-headline"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type {
  BodyBlock,
  FieldSpec,
  HeadingBlock,
  NoteBlock,
} from "@/components/sections/schema/section-schema"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the contact catalog, rendered through `<SectionSlot>`
 * overrides and `renderItems`.
 *
 * Contact sections predate the slot engine and always read their copy as
 * `String(props.x ?? '<literal>')`, so a page saved without a key rendered the
 * literal. Every helper here keeps that: an absent prop renders its fallback, a
 * stored value (even an empty one) renders as stored. The working forms
 * (`useContactSubmit` → business_leads) stay in the section files, drawn by one
 * override entry each — only their surrounding copy is made of blocks.
 */

type EditableTag = "span" | "p" | "div" | "h2" | "h3"

/** A prop's string value, or the literal pre-migration pages rendered while it was unset. */
export function textOr (instance: SectionInstance, key: string, fallback: string): string {
  const v = instance.props[key]
  return v === undefined || v === null ? fallback : String(v)
}

const writeProp = (instanceId: string, key: string) => (t: string) =>
  useBuilderStore.getState().updateSectionProps(instanceId, { [key]: t })

/** One inline-editable flat prop, with the pre-slot `data-element-id`. */
export function PropText ({
  instance,
  propKey,
  fallback,
  className,
  as = "span",
  isPreview,
  bare,
}: {
  instance: SectionInstance
  propKey: string
  fallback: string
  className?: string
  as?: EditableTag
  isPreview?: boolean
  /** Omit the element id — for text the pre-slot markup addressed through its parent link/button. */
  bare?: boolean
}) {
  const write = writeProp(instance.id, propKey)
  return (
    <InlineEditableText
      as={as}
      {...(bare ? {} : { "data-element-id": `${instance.id}::${propKey}`, "data-element-type": "text" })}
      className={className}
      value={textOr(instance, propKey, fallback)}
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
  labelled = true,
}: {
  instance: SectionInstance
  collection: string
  index: number
  field: string
  value: unknown
  className?: string
  as?: EditableTag
  isPreview?: boolean
  /** Emit the collection label attributes (false where the pre-slot markup did not). */
  labelled?: boolean
}) {
  const write = (t: string) =>
    useBuilderStore.getState().updateItem(instance.id, collection, index, { [field]: t })
  return (
    <InlineEditableText
      as={as}
      {...(labelled
        ? {
            "data-element-collection": collection,
            "data-element-index": String(index),
            "data-element-item-label-prop": field,
          }
        : {})}
      className={className}
      value={String(value ?? "")}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

// ─── Overrides ────────────────────────────────────────────────────────────────

/** A text block bound to `key`, rendering its pre-slot fallback while unset. */
export function textOverride (
  key: string,
  fallback: string,
  className: string,
  isPreview?: boolean,
  as: EditableTag = "p"
): BlockOverride {
  return function ContactText ({ instance }) {
    return (
      <PropText
        instance={instance}
        propKey={key}
        fallback={fallback}
        className={className}
        as={as}
        isPreview={isPreview}
      />
    )
  }
}

/** A block drawn by a sibling override (a form, a card); editable in the content panel. */
export const drawnElsewhere: BlockOverride = () => null

/** The house headline + accent word, with the literals pre-slot pages fell back to. */
export function headingOverride (opts: {
  className: string
  isPreview?: boolean
  headline: string
  accentWord?: string
}): BlockOverride {
  return function ContactHeadline ({ instance }) {
    return (
      <SectionHeadline
        instanceId={instance.id}
        isPreview={opts.isPreview}
        level={2}
        className={opts.className}
        headline={textOr(instance, "headline", opts.headline)}
        {...(opts.accentWord !== undefined
          ? { accentWord: textOr(instance, "accentWord", opts.accentWord) }
          : {})}
      />
    )
  }
}

/** The pill badge with a primary dot that several contact sections lead with. */
export function dotBadge (fallback: string, isPreview?: boolean, pulse?: boolean): BlockOverride {
  return function ContactBadge ({ instance }) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground">
        <span className={cn("size-1.5 rounded-full bg-primary", pulse && "animate-pulse")} />
        <PropText instance={instance} propKey="badgeText" fallback={fallback} isPreview={isPreview} />
      </div>
    )
  }
}

// ─── Block specs ──────────────────────────────────────────────────────────────

/** AI hints the original hand-written definitions carried, kept verbatim. */
export const HINTS = {
  headline: "Primary section headline (6–10 words, no period)",
  accentWord: "Highlighted word or phrase in the headline (1–3 words)",
  description: "Short descriptive paragraph (1–3 sentences, 20–60 words)",
  itemTitle: "Section title (4–8 words)",
  itemBody: "Body copy (1–3 sentences)",
  tag: "Short tag label (1–3 words)",
  cta: "CTA button text (1–4 words)",
} as const

/** The `badgeText` pill (label/type exactly as the hand-written definition). */
export function badgeTextBlock (): NoteBlock {
  return {
    kind: "note",
    id: "badgeText",
    label: "Badge",
    field: { key: "badgeText", label: "Badge", type: "text", canonical: "badge", maxLength: 30 },
  }
}

export function headlineBlock (opts: { accent?: boolean; label?: string } = {}): HeadingBlock {
  return {
    kind: "heading",
    level: 2,
    accent: opts.accent ?? false,
    fields: {
      headline: {
        key: "headline",
        label: opts.label ?? "Headline",
        type: "text",
        canonical: "headline",
        aiHint: HINTS.headline,
        maxLength: 80,
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
    },
  }
}

export function descriptionBlock (): BodyBlock {
  return {
    kind: "body",
    field: {
      key: "description",
      label: "Description",
      type: "textarea",
      canonical: "body",
      aiHint: HINTS.description,
      maxLength: 280,
      group: "content",
    },
  }
}

/** A flat text prop as a note block. The id follows the key so element ids stay stable. */
export function noteBlock (
  key: string,
  label: string,
  field: Omit<FieldSpec, "key" | "label"> = {},
  slot?: string
): NoteBlock {
  return {
    kind: "note",
    id: key,
    label,
    ...(slot ? { slot } : {}),
    field: { key, label, type: "text", ...field },
  }
}

/** A flat href prop: an inspector field carried by the link that renders it. */
export function hrefBlock (key: string, label: string, slot?: string): NoteBlock {
  return noteBlock(key, label, { type: "url", canonical: "ctaLink", group: "cta" }, slot)
}
