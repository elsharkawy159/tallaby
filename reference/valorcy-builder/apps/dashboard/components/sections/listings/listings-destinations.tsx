"use client"

import { Clock, ArrowRight } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemPhoto,
  ItemText,
  PHOTO,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  itemsOf,
  stretchItems,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Destination = { name?: string; country?: string; duration?: string; price?: string; image?: string; href?: string; badge?: string }

/**
 * Voyage — media-cards archetype.
 *
 * Tour and destination cards that lead with a photo carrying the name over a
 * dark scrim, then duration and a "from" price. The scrim stays dark in both
 * themes because it sits on a photograph.
 */
function ListingsDestinations ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-center gap-5 text-center"
          entryClassName={stretchItems}
          align="center"
          renderItems={({ instance: inst }) => {
            const items = itemsOf<Destination>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="mt-7 grid grid-cols-1 gap-6 text-start sm:grid-cols-2 lg:grid-cols-3">
                {items.map((dest, i) => (
                  <a
                    key={i}
                    href={dest.href || "#"}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <ItemPhoto
                        instance={inst}
                        collection="items"
                        index={i}
                        src={dest.image}
                        alt={dest.name}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500"
                        empty={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Destination photo</div>}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      {dest.badge && (
                        <span className="absolute start-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          {dest.badge}
                        </span>
                      )}
                      <div className="absolute bottom-4 end-4 start-4">
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="name"
                          value={dest.name}
                          elementId={`name${i}`}
                          isPreview={isPreview}
                          className="text-lg font-semibold text-white"
                        />
                        {dest.country && <p className="mt-0.5 text-sm text-white/80">{dest.country}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {dest.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5 shrink-0" /> {dest.duration}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{dest.price ? `from ${dest.price}` : ""}</span>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const listingsDestinationsSection = defineSection({
  id: "listings-destinations",
  displayName: "Voyage",
  description: "Destination and tour cards — photo with the name over a scrim, then duration and a starting price.",
  category: "listings",
  layoutArchetype: "media-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["travel", "travel_agency", "tour_package", "hotel", "car_rental"],
  styles: ["modern", "editorial", "bold"],
  goals: ["sales", "leads", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 80,
  trustWeight: 50,
  tags: ["travel", "destinations", "tours", "packages", "cards"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ maxLength: 70 }),
      descriptionBlock({ maxLength: 160 }),
      collectionBlock({
        key: "items",
        label: "Destinations",
        canonical: "packages",
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ name: "Destination name", country: "", duration: "", price: "", image: "", href: "#", badge: "" }),
        fields: [
          { key: "name", label: "Destination name", type: "text", canonical: "headline", maxLength: 50 },
          { key: "country", label: "Country / region", type: "text", aiHint: "e.g. France, Southeast Asia", maxLength: 60 },
          { key: "duration", label: "Duration", type: "text", aiHint: "e.g. 7 days, 2 weeks", maxLength: 30 },
          { key: "price", label: "Starting price", type: "text", aiHint: "e.g. $1,299", maxLength: 20 },
          { key: "image", label: "Destination photo", type: "image", canonical: "image" },
          { key: "href", label: "Tour page link", type: "url", canonical: "ctaLink" },
          { key: "badge", label: "Badge (optional)", type: "text", aiHint: "e.g. Bestseller, New, Adventure", maxLength: 20 },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Popular escapes",
    headline: "Where will you go next?",
    description: "Small-group journeys planned end to end, from flights and stays to local guides.",
    items: [
      { name: "Amalfi Coast", country: "Italy", duration: "7 days", price: "$2,450", image: PHOTO, href: "#", badge: "Bestseller" },
      { name: "Kyoto & Nara", country: "Japan", duration: "10 days", price: "$3,180", image: PHOTO, href: "#", badge: "" },
      { name: "Marrakech & the Atlas", country: "Morocco", duration: "8 days", price: "$1,890", image: PHOTO, href: "#", badge: "New" },
      { name: "Patagonia Trek", country: "Chile & Argentina", duration: "12 days", price: "$4,200", image: PHOTO, href: "#", badge: "" },
      { name: "Iceland Ring Road", country: "Iceland", duration: "14 days", price: "$3,650", image: PHOTO, href: "#", badge: "Adventure" },
      { name: "Bali Retreat", country: "Indonesia", duration: "9 days", price: "$1,720", image: PHOTO, href: "#", badge: "" },
    ],
  },
  Component: ListingsDestinations,
})
