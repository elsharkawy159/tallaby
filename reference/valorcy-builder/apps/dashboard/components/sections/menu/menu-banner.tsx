"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatLinkAction,
  bodyBlock,
  coverEntry,
  coverImageOverride,
  eyebrowBlock,
  flatActionBlocks,
  headingBlock,
  noteBlock,
  textOverride,
} from "@/components/sections/menu/menu-parts"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** The action breaks onto its own line under the price row. */
function actionOnOwnLine (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.id === "ctaLabel" ? "basis-full" : undefined
}

/**
 * Spotlight — banner archetype.
 *
 * One signature dish as a full-width banner: the photo fills the card behind a
 * dark start-side scrim (dark in both themes so the white type always reads),
 * with the dish story, price, availability and a booking action over it.
 */
function MenuBanner ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="group relative overflow-hidden rounded-3xl bg-black text-white" style={{ minHeight: 480 }}>
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="background"
            className="absolute inset-0"
            entryClassName={coverEntry}
            overrides={{
              imageUrl: coverImageOverride({
                srcKey: "imageUrl",
                altKey: "dishName",
                elementKey: "banner-img",
                className: "absolute inset-0 size-full object-cover opacity-50 transition-transform duration-700",
                isPreview,
              }),
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

          <div className="relative flex h-full flex-col justify-center gap-5 p-10 lg:max-w-lg lg:p-14">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="copy"
              className="flex flex-col gap-5"
              align="left"
              headingClassName={`${TYPE_H2} text-white`}
              bodyClassName="text-sm leading-relaxed text-white/80"
              overrides={{
                eyebrow: textOverride("eyebrow", "text-xs font-semibold text-white/70", isPreview),
              }}
            />
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="details"
              className="flex flex-wrap items-center gap-x-4 gap-y-5"
              entryClassName={actionOnOwnLine}
              overrides={{
                price: textOverride("price", "text-2xl font-semibold text-accent", isPreview, { as: "span" }),
                available: textOverride("available", "text-xs text-white/60", isPreview, { as: "span" }),
                ctaLabel: ({ instance: inst }) => (
                  <FlatLinkAction
                    instance={inst}
                    isPreview={isPreview}
                    labelProp="ctaLabel"
                    hrefProp="ctaHref"
                    fallback=""
                    hideEmpty={false}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
                  />
                ),
                // Carried by the button above; edited in the inspector.
                ctaHref: () => null,
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const menuBannerSection = defineSection({
  id: "menu-banner",
  displayName: "Spotlight",
  description: "Full-width signature-dish banner — photo, story, price and a booking action.",
  category: "menu",
  layoutArchetype: "banner",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "catering", "hotel", "cafe"],
  styles: ["bold", "editorial", "dark"],
  goals: ["sales", "bookings", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: true,
  mobileScore: 92,
  editable: true,
  tags: ["menu", "banner", "hero", "signature", "dish"],
  funnelStage: "decision",
  conversionWeight: 70,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "background", label: "Photo", accepts: ["media"], max: 1, acceptsElements: false, eject: { overlay: true } },
      { id: "copy", label: "Copy", isDefault: true },
      { id: "details", label: "Price & action", eject: { direction: "row" } },
    ],
    blocks: [
      {
        kind: "media",
        slot: "background",
        ratio: "wide",
        placeholder: "landscape",
        fields: { src: { key: "imageUrl", label: "Dish photo", type: "image", group: "media" } },
      },
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ key: "dishName", label: "Dish name", aiHint: "Signature dish name", maxLength: 60 }),
      bodyBlock({ aiHint: "Ingredients and cooking method (2–3 sentences)", maxLength: 240 }),
      noteBlock({ key: "price", label: "Price", aiHint: "e.g. $42", maxLength: 20 }, { slot: "details" }),
      noteBlock(
        { key: "available", label: "Availability note", aiHint: "When it's available (1 short sentence)", maxLength: 80 },
        { slot: "details", label: "Availability" }
      ),
      ...flatActionBlocks({ labelKey: "ctaLabel", hrefKey: "ctaHref", labelText: "CTA label", labelAiHint: "CTA text (2–4 words)", maxLength: 30, slot: "details" }),
    ],
  },
  defaultProps: {
    eyebrow: "House signature",
    dishName: "Whole roasted sea bream",
    description: "Stuffed with fennel and lemon, roasted over vine cuttings and finished with green olive salsa. Made for sharing.",
    price: "$46",
    available: "Friday & Saturday evenings",
    ctaLabel: "Book a table",
    ctaHref: "#",
  },
  Component: MenuBanner,
})
