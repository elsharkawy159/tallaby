"use client"

import { SectionBadge } from "@/components/sections/_primitives/section-badge"
import { SectionCtaRow } from "@/components/sections/_primitives/section-cta-row"
import { SectionEyebrow } from "@/components/sections/_primitives/section-eyebrow"
import { SectionHeadline } from "@/components/sections/_primitives/section-headline"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { MEASURE, TYPE_LEAD, TYPE_SMALL } from "@/components/sections/_primitives/type-scale"
import { useBuilderStore } from "@/lib/builder/store"
import type { CtaButtonShape } from "@/components/sections/_primitives/section-cta-row"
import type { CompiledBlock } from "@/components/sections/schema/compile-schema"
import type { SectionInstance } from "@/components/sections/registry.types"
import type { ReactNode } from "react"

/**
 * The one place a schema block kind becomes a rendered primitive.
 *
 * Every slot-driven section renders through here, so "badge looks like this,
 * headline edits like that" is stated once rather than re-typed per section.
 * A section that needs bespoke chrome for one block passes a `SectionSlot`
 * override instead of adding a branch here — see `section-slot.tsx`.
 */

/** Everything a block (or an override) needs to render itself. */
export interface BlockRenderCtx {
  instance: SectionInstance
  block: CompiledBlock
  isPreview?: boolean
  /** Position within the slot's visible entries — used for bento rhythms. */
  index: number
  /** Resolved prop value for the block's primary key. */
  value: unknown
}

/** Per-block render hook. `undefined` falls through to the shared renderer. */
export type BlockOverride = (ctx: BlockRenderCtx) => ReactNode | undefined

export interface BlockRendererProps extends BlockRenderCtx {
  /** Renders an `items` block. Collections are always section-specific. */
  renderItems?: (ctx: BlockRenderCtx) => ReactNode
  /** Heading level for `heading` blocks. Heroes pass 1. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** Overrides the headline type scale. */
  headingClassName?: string
  bodyClassName?: string
  noteClassName?: string
  ctaClassName?: string
  /** Badge treatment. Heroes differ: outline, soft or solid. */
  badgeVariant?: "outline" | "soft" | "solid"
  align?: "left" | "center"
  mediaProps?: Partial<Parameters<typeof SectionMedia>[0]>
}

/** Reads a string prop defensively — instance props are untyped JSONB. */
function str (props: Record<string, unknown>, key: string | undefined): string | undefined {
  if (!key) return undefined
  const v = props[key]
  return typeof v === "string" ? v : undefined
}

export function BlockRenderer ({
  instance,
  block,
  isPreview,
  index,
  renderItems,
  headingLevel = 2,
  headingClassName,
  bodyClassName,
  noteClassName,
  ctaClassName,
  badgeVariant = "soft",
  align = "left",
  mediaProps,
}: BlockRendererProps) {
  const store = useBuilderStore.getState
  const p = instance.props
  const id = instance.id
  const [primary, secondary] = block.propKeys

  switch (block.kind) {
    case "eyebrow": {
      const value = str(p, primary)
      if (value === undefined) return null
      return (
        <SectionEyebrow
          instanceId={id}
          value={value}
          propKey={primary}
          isPreview={isPreview}
        />
      )
    }

    case "badge": {
      const value = str(p, primary)
      if (!value) return null
      return (
        <SectionBadge
          instanceId={id}
          value={value}
          propKey={primary}
          isPreview={isPreview}
          variant={badgeVariant}
        />
      )
    }

    case "heading": {
      // block.propKeys is [headline, accentWord?, headlineSuffix?] in that order.
      const [headlineKey, accentKey, suffixKey] = block.propKeys
      return (
        <SectionHeadline
          instanceId={id}
          isPreview={isPreview}
          headline={str(p, headlineKey) ?? ""}
          accentWord={str(p, accentKey)}
          headlineSuffix={str(p, suffixKey)}
          headlineProp={headlineKey}
          {...(accentKey ? { accentWordProp: accentKey } : {})}
          {...(suffixKey ? { headlineSuffixProp: suffixKey } : {})}
          level={headingLevel}
          {...(headingClassName ? { className: headingClassName } : {})}
        />
      )
    }

    case "body": {
      const value = str(p, primary)
      if (value === undefined) return null
      return (
        <InlineEditableText
          as="p"
          data-element-id={`${id}::${primary}`}
          data-element-type="text"
          className={bodyClassName ?? `${TYPE_LEAD} ${MEASURE}`}
          value={value}
          isPreview={isPreview}
          onChange={(t) => store().updateSectionProps(id, { [primary!]: t })}
          onCommit={(t) => store().updateSectionProps(id, { [primary!]: t })}
        />
      )
    }

    case "note": {
      const value = str(p, primary)
      if (value === undefined) return null
      return (
        <InlineEditableText
          as="p"
          data-element-id={`${id}::${primary}`}
          data-element-type="text"
          className={noteClassName ?? TYPE_SMALL}
          value={value}
          isPreview={isPreview}
          onChange={(t) => store().updateSectionProps(id, { [primary!]: t })}
          onCommit={(t) => store().updateSectionProps(id, { [primary!]: t })}
        />
      )
    }

    case "media": {
      const srcKey = primary ?? "imageUrl"
      const altKey = secondary ?? "imageAlt"
      return (
        <SectionMedia
          instanceId={id}
          elementKey={block.id}
          src={str(p, srcKey)}
          alt={str(p, altKey) ?? ""}
          srcProp={srcKey}
          altProp={altKey}
          isPreview={isPreview}
          {...mediaProps}
        />
      )
    }

    case "ctaRow": {
      const key = block.collectionKey ?? "buttons"
      const buttons = (p[key] as CtaButtonShape[] | undefined) ?? []
      if (buttons.length === 0) return null
      return (
        <SectionCtaRow
          instanceId={id}
          isPreview={isPreview}
          buttons={buttons}
          propKey={key}
          className={ctaClassName}
          align={align}
        />
      )
    }

    case "items":
      return renderItems?.({ instance, block, isPreview, index, value: p[block.collectionKey ?? "items"] }) ?? null

    default:
      return null
  }
}
