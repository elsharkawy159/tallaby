"use client"

import { useState } from "react"
import { Bed, Bath, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemPhoto,
  ItemText,
  PHOTO,
  collectionBlock,
  eyebrowBlock,
  headingBlock,
  itemsOf,
  kickerEyebrow,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Listing = { title?: string; address?: string; price?: string; beds?: string; baths?: string; image?: string; href?: string; badge?: string }

const VISIBLE = 3

/**
 * Promenade — carousel archetype.
 *
 * Three property cards at a time, paged by arrows beside the header and dots
 * below. The arrows sit on the header row, so the cards live in a slot of their
 * own; paging state is the section's, not stored.
 */
function ListingsCarousel ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const [start, setStart] = useState(0)
  const total = itemsOf<Listing>(instance, "listings").length
  const canPrev = start > 0
  const canNext = start + VISIBLE < total

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            overrides={{ eyebrow: kickerEyebrow(isPreview) }}
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => setStart(Math.max(0, start - 1))}
              disabled={!canPrev}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary/40 disabled:opacity-40"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setStart(Math.min(total - VISIBLE, start + 1))}
              disabled={!canNext}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary/40 disabled:opacity-40"
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="carousel"
          className="flex flex-col"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const listings = itemsOf<Listing>(inst, "listings")
            if (listings.length === 0) return null
            return (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.slice(start, start + VISIBLE).map((l, j) => {
                    const i = j + start
                    return (
                      <a
                        key={i}
                        href={l.href || "#"}
                        className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <ItemPhoto
                            instance={inst}
                            collection="listings"
                            index={i}
                            src={l.image}
                            alt={l.title}
                            elementKey={`img-${i}`}
                            className="absolute inset-0 size-full object-cover transition-transform duration-500"
                          />
                          {l.badge && (
                            <span className="absolute start-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                              {l.badge}
                            </span>
                          )}
                        </div>
                        <div className="p-5">
                          <p className="text-lg font-semibold text-primary">{txt(l.price)}</p>
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="listings"
                            index={i}
                            field="title"
                            value={l.title}
                            isPreview={isPreview}
                            className="mt-0.5 font-semibold leading-snug text-foreground"
                          />
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{txt(l.address)}</p>
                          <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Bed className="size-3.5" />{txt(l.beds)} bd</span>
                            <span className="flex items-center gap-1"><Bath className="size-3.5" />{txt(l.baths)} ba</span>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
                <div className="mt-6 flex justify-center gap-1.5">
                  {Array.from({ length: Math.ceil(listings.length / VISIBLE) }).map((_, p) => (
                    <button
                      key={p}
                      type="button"
                      aria-label={`Page ${p + 1}`}
                      onClick={() => setStart(p * VISIBLE)}
                      className={cn("size-2 rounded-full transition-all", start === p * VISIBLE ? "bg-primary" : "bg-border")}
                    />
                  ))}
                </div>
              </>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const listingsCarouselSection = defineSection({
  id: "listings-carousel",
  displayName: "Promenade",
  description: "Paged property carousel — three cards at a time with arrows beside the header and dots below.",
  category: "listings",
  layoutArchetype: "carousel",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "travel"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "sales", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["listings", "carousel", "slider", "real-estate"],
  funnelStage: "consideration",
  conversionWeight: 60,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "carousel", label: "Carousel", accepts: ["items"] },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Listings headline (3–6 words)", maxLength: 60 }),
      collectionBlock({
        key: "listings",
        label: "Properties",
        slot: "carousel",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ title: "Property", address: "Address", price: "$0", beds: "3", baths: "2", image: "", href: "#", badge: "" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "badge", label: "Badge", type: "text", aiHint: "e.g. New, Price reduced", maxLength: 20, group: "content" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", maxLength: 80, group: "content" },
          { key: "price", label: "Price", type: "text", maxLength: 16, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Just listed",
    headline: "New on the market this month",
    listings: [
      { title: "Bright corner condo", address: "310 Marina Boulevard, Unit 9A", price: "$689,000", beds: "3", baths: "2", image: PHOTO, href: "#", badge: "New" },
      { title: "Townhouse with roof terrace", address: "27 Chapel Street", price: "$1,240,000", beds: "5", baths: "4", image: PHOTO, href: "#", badge: "" },
      { title: "Renovated two-bed flat", address: "1 Parkside Drive, Apt 4C", price: "$498,000", beds: "2", baths: "2", image: PHOTO, href: "#", badge: "Reduced" },
      { title: "Garden apartment near the river", address: "52 Quayside, Unit 1", price: "$2,600/mo", beds: "2", baths: "2", image: PHOTO, href: "#", badge: "" },
      { title: "Family home on a quiet street", address: "9 Birchwood Close", price: "$865,000", beds: "4", baths: "3", image: PHOTO, href: "#", badge: "" },
    ],
  },
  Component: ListingsCarousel,
})
