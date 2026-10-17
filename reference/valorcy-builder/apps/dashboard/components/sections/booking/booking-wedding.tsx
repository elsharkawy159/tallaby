"use client"

import { Calendar, Heart, Users } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  listOf,
  propNote,
  s,
  textOr,
} from "@/components/sections/booking/booking-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Package = { name?: string; capacity?: string; price?: string; description?: string; includes?: string }

/**
 * Venue — spec-cards archetype.
 *
 * A venue photo under a dark scrim carries the headline; below it, package
 * cards with capacity, price, a description and a ruled-off inclusions line.
 * The scrim stays dark and the copy on it stays white in both themes. Three
 * slots: the photo, the copy on it, the packages.
 */
function BookingWedding ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="relative mb-10 overflow-hidden rounded-3xl" style={{ minHeight: 340 }}>
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="background"
            className="absolute inset-0"
            overrides={{
              imageUrl: ({ instance: inst }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey="wedding-img"
                  src={textOr(inst, "imageUrl", undefined)}
                  alt={textOr(inst, "imageAlt", textOr(inst, "headline", ""))}
                  ratio="wide"
                  placeholder="wide"
                  rounded="none"
                  className="absolute inset-0 aspect-auto h-full w-full"
                  imgClassName="opacity-80"
                  sizes="100vw"
                  isPreview={isPreview}
                />
              ),
            }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative flex flex-col items-center justify-end gap-3 pb-10 text-center text-white">
            <Heart className="size-8 fill-white/60 text-white/60" aria-hidden />
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="copy"
              className="flex flex-col items-center gap-3 text-center"
              align="center"
              headingClassName={`${TYPE_H2} text-white`}
              bodyClassName="max-w-md text-sm text-white/70"
              overrides={{
                eyebrow: propNote("eyebrow", "text-xs font-semibold text-white/70", isPreview),
              }}
            />
          </div>
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="packages"
          className="flex flex-col"
          renderItems={({ instance: inst }) => {
            const packages = listOf<Package>(inst, "packages")
            const ctaLabel = textOr(inst, "ctaLabel", "")
            const writeCta = (t: string) => store().updateSectionProps(inst.id, { ctaLabel: t })
            if (packages.length === 0) return null
            return (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {packages.map((pkg, i) => {
                  const featured = i === 1
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col gap-4 overflow-hidden rounded-2xl border p-6",
                        featured ? "border-primary/40 bg-[color-mix(in_oklch,var(--primary)_4%,var(--card))]" : "border-border/60 bg-card"
                      )}
                    >
                      <div>
                        <ItemText as="h3" instance={inst} collection="packages" index={i} field="name" value={pkg?.name} className="text-lg font-semibold text-foreground" isPreview={isPreview} />
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="size-3.5" aria-hidden />{s(pkg?.capacity)}</span>
                          <span className="flex items-center gap-1"><Calendar className="size-3.5" aria-hidden />Subject to availability</span>
                        </div>
                      </div>
                      <p className="text-2xl font-semibold text-primary">{s(pkg?.price)}</p>
                      <ItemText as="p" instance={inst} collection="packages" index={i} field="description" value={pkg?.description} className="text-sm text-muted-foreground" isPreview={isPreview} />
                      <p className="border-t border-border pt-3 text-xs text-foreground">{s(pkg?.includes)}</p>
                      <a
                        href="#"
                        className={cn("mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold", featured ? PRIMARY_BUTTON : OUTLINE_BUTTON)}
                      >
                        <InlineEditableText
                          as="span"
                          data-element-id={`${inst.id}::ctaLabel`}
                          data-element-type="text"
                          value={ctaLabel}
                          isPreview={isPreview}
                          onChange={writeCta}
                          onCommit={writeCta}
                        />
                       
                      </a>
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const bookingWeddingSection = defineSection({
  id: "booking-wedding",
  displayName: "Venue",
  description: "Venue photo under a dark scrim with the headline, then package cards with capacity, price and inclusions.",
  category: "booking",
  layoutArchetype: "spec-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["event", "hotel", "catering", "wedding_planner"],
  styles: ["editorial", "minimal", "modern"],
  goals: ["bookings", "leads", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["booking", "wedding", "venue", "event", "celebration"],
  funnelStage: "decision",
  conversionWeight: 78,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "background", label: "Venue photo", accepts: ["media"], max: 1, acceptsElements: false, eject: { overlay: true } },
      { id: "copy", label: "Copy", isDefault: true },
      { id: "packages", label: "Packages" },
    ],
    blocks: [
      {
        kind: "media",
        slot: "background",
        ratio: "wide",
        placeholder: "wide",
        fields: { src: { key: "imageUrl", label: "Venue hero photo", type: "image", group: "media" } },
      },
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Venue headline (3–6 words)", maxLength: 60 }),
      descriptionBlock({ aiHint: "Short venue/availability note (1–2 sentences)", maxLength: 140 }),
      collectionBlock({
        key: "packages",
        label: "Venue packages",
        slot: "packages",
        minItems: 1,
        maxItems: 3,
        newItem: () => ({ name: "Package name", capacity: "Up to 100 guests", price: "From $10,000", description: "Description.", includes: "What's included" }),
        itemFields: [
          { key: "name", label: "Package name", type: "text", canonical: "headline", maxLength: 40, group: "content" },
          { key: "capacity", label: "Capacity", type: "text", aiHint: "e.g. Up to 200 guests", maxLength: 24, group: "content" },
          { key: "price", label: "Price from", type: "text", aiHint: "e.g. From $22,000", maxLength: 20, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "What spaces are included (1 sentence)", maxLength: 120, group: "content" },
          { key: "includes", label: "Includes", type: "text", aiHint: "Key inclusions separated by ·", maxLength: 100, group: "content" },
        ],
      }),
    ],
    settings: [
      { key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Request availability", maxLength: 30, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "Weddings",
    headline: "Celebrate where it all feels right",
    description: "Garden ceremonies, a candlelit hall and a team that handles every detail of the day.",
    ctaLabel: "Request availability",
    packages: [
      { name: "Garden Ceremony", capacity: "Up to 120 guests", price: "From $14,000", description: "Ceremony on the lawn with a reception in the orangery.", includes: "Venue hire · Catering · Coordinator · Bridal suite" },
      { name: "Grand Hall", capacity: "Up to 220 guests", price: "From $22,000", description: "Exclusive use of the hall, terrace and gardens.", includes: "Full venue · Three-course dinner · Bar · Overnight stay" },
    ],
  },
  Component: BookingWedding,
})
