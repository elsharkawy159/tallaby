"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatLinkAction,
  MENU_EYEBROW_CLASS,
  PropText,
  bodyBlock,
  eyebrowBlock,
  flatActionBlocks,
  headingBlock,
  noteBlock,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** The badge floats over the photo's corner rather than stacking under it. */
function floatBadge (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.id === "badge" ? "absolute start-4 top-4 z-10" : undefined
}

/**
 * Signature — product-first archetype.
 *
 * One dish, sold like a product: a large square photo with a corner badge
 * beside its intro line, name, price, description, pairing note and booking
 * action. Two slots — the photo card and the copy column.
 */
function MenuFeatured ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            className="relative overflow-hidden rounded-3xl"
            entryClassName={floatBadge}
            overrides={{
              imageUrl: ({ instance: inst }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey="imageUrl"
                  src={typeof inst.props.imageUrl === "string" ? inst.props.imageUrl : undefined}
                  alt={typeof inst.props.dishName === "string" ? inst.props.dishName : ""}
                  srcProp="imageUrl"
                  ratio="square"
                  placeholder="product"
                  rounded="none"
                  isPreview={isPreview}
                />
              ),
              badge: ({ instance: inst }) => {
                const v = inst.props.badge
                if (typeof v !== "string" || v === "") return null
                return (
                  <PropText
                    instance={inst}
                    propKey="badge"
                    as="div"
                    isPreview={isPreview}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  />
                )
              },
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-start"
            align="left"
            headingClassName={`${TYPE_H2} mt-2 text-foreground`}
            bodyClassName={`${TYPE_LEAD} mt-5`}
            overrides={{
              eyebrow: textOverride("eyebrow", `mb-3 ${MENU_EYEBROW_CLASS}`, isPreview, { hideEmpty: true }),
              headline: textOverride("headline", "text-sm text-muted-foreground", isPreview),
              price: textOverride("price", "mt-2 text-3xl font-semibold text-primary", isPreview),
              pairings: textOverride("pairings", "mt-4 text-sm italic text-muted-foreground", isPreview, { hideEmpty: true }),
              ctaLabel: ({ instance: inst }) => (
                <FlatLinkAction
                  instance={inst}
                  isPreview={isPreview}
                  labelProp="ctaLabel"
                  hrefProp="ctaHref"
                  fallback=""
                  className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                />
              ),
              // Carried by the button above; edited in the inspector.
              ctaHref: () => null,
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const menuFeaturedSection = defineSection({
  id: "menu-featured",
  displayName: "Signature",
  description: "Single-dish spotlight — a large photo beside its name, price, story and booking action.",
  category: "menu",
  layoutArchetype: "product-first",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "catering", "hotel"],
  styles: ["modern", "editorial", "bold"],
  goals: ["sales", "conversion", "engagement"],
  complexity: "low",
  density: "low",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 75,
  trustWeight: 60,
  tags: ["menu", "featured", "dish", "spotlight", "restaurant"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "media", label: "Photo", accepts: ["media", "badge"], max: 2, acceptsElements: false },
      { id: "copy", label: "Copy", isDefault: true },
    ],
    blocks: [
      {
        kind: "media",
        slot: "media",
        ratio: "square",
        placeholder: "product",
        fields: {
          src: { key: "imageUrl", label: "Dish photo", type: "image", canonical: "image", group: "media" },
        },
      },
      {
        kind: "badge",
        slot: "media",
        field: { key: "badge", label: "Badge (optional)", type: "text", canonical: "badge", maxLength: 30, group: "content" },
      },
      eyebrowBlock(),
      noteBlock(
        { key: "headline", label: "Intro label", aiHint: "e.g. Tonight's featured dish", maxLength: 50 },
        { label: "Intro label" }
      ),
      headingBlock({ key: "dishName", label: "Dish name", maxLength: 70 }),
      noteBlock({ key: "price", label: "Price", aiHint: "e.g. $65", maxLength: 20 }),
      bodyBlock({ maxLength: 300 }),
      noteBlock(
        { key: "pairings", label: "Wine pairing note (optional)", type: "textarea", maxLength: 200 },
        { label: "Pairing note" }
      ),
      ...flatActionBlocks({ labelKey: "ctaLabel", hrefKey: "ctaHref", labelText: "CTA label", maxLength: 40 }),
    ],
  },
  defaultProps: {
    eyebrow: "Chef's signature",
    headline: "Tonight's featured dish",
    dishName: "Slow-braised short rib",
    description: "Twelve hours in red wine and aromatics, finished over open flame and served with smoked potato purée and charred shallots.",
    price: "$42",
    badge: "Chef's pick",
    pairings: "Pairs beautifully with our 2019 Rioja Reserva.",
    ctaLabel: "Reserve a table",
    ctaHref: "#",
  },
  Component: MenuFeatured,
})
