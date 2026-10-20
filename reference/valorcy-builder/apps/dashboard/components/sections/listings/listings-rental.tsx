"use client"

import { Star, MapPin, Users } from "lucide-react"
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

type Rental = { title?: string; location?: string; price?: string; priceUnit?: string; rating?: string; reviews?: string; guests?: string; image?: string; href?: string; badge?: string }

/**
 * Getaway — captioned-grid archetype.
 *
 * Borderless four-up stay cards: a rounded photo with a host badge, then a
 * caption of title, location, capacity, rating and the nightly price.
 */
function ListingsRental ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-start"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          overrides={{ eyebrow: kickerEyebrow(isPreview) }}
          renderItems={({ instance: inst }) => {
            const rentals = itemsOf<Rental>(inst, "rentals")
            if (rentals.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {rentals.map((r, i) => (
                  <a key={i} href={r.href || "#"} className="group block">
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                      <ItemPhoto
                        instance={inst}
                        collection="rentals"
                        index={i}
                        src={r.image}
                        alt={r.title}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500"
                      />
                      {r.badge && (
                        <span className="absolute start-3 top-3 rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
                          {r.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="rentals"
                          index={i}
                          field="title"
                          value={r.title}
                          isPreview={isPreview}
                          className="truncate font-semibold text-foreground"
                        />
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{txt(r.location)}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" />Up to {txt(r.guests)} guests</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-xs font-medium">
                        <Star className="size-3 fill-current text-accent" />
                        <span>{txt(r.rating)}</span>
                        <span className="text-muted-foreground">({txt(r.reviews)})</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm">
                      <span className="font-semibold text-foreground">{txt(r.price)}</span>
                      <span className="text-xs text-muted-foreground"> {txt(r.priceUnit)}</span>
                    </p>
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

export const listingsRentalSection = defineSection({
  id: "listings-rental",
  displayName: "Getaway",
  description: "Borderless stay cards with nightly price, star rating, review count, guest capacity and host badge.",
  category: "listings",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["travel", "travel_agency", "hotel", "real_estate"],
  styles: ["modern", "minimal", "playful"],
  goals: ["bookings", "sales", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["listings", "rental", "vacation", "airbnb", "travel"],
  funnelStage: "consideration",
  conversionWeight: 70,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Rentals headline (4–8 words)", maxLength: 70 }),
      collectionBlock({
        key: "rentals",
        label: "Rentals",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ title: "Property name", location: "City, Country", price: "$0", priceUnit: "/ night", rating: "4.9", reviews: "50", guests: "4", image: "", href: "#", badge: "" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "badge", label: "Badge", type: "text", aiHint: "e.g. Superhost, Guest favourite", maxLength: 20, group: "content" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 70, group: "content" },
          { key: "location", label: "Location", type: "text", canonical: "body", aiHint: "City, Country", maxLength: 50, group: "content" },
          { key: "price", label: "Nightly price", type: "text", aiHint: "e.g. $420", maxLength: 12, group: "content" },
          { key: "priceUnit", label: "Price unit", type: "text", aiHint: "e.g. / night", maxLength: 15, group: "content" },
          { key: "rating", label: "Rating", type: "text", aiHint: "e.g. 4.92", maxLength: 6, group: "content" },
          { key: "reviews", label: "Review count", type: "text", aiHint: "e.g. 89", maxLength: 8, group: "content" },
          { key: "guests", label: "Max guests", type: "text", aiHint: "e.g. 6", maxLength: 5, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Stays we love",
    headline: "Handpicked homes for your next trip",
    rentals: [
      { title: "Seaside cottage with sunset deck", location: "Cornwall, UK", price: "$320", priceUnit: "/ night", rating: "4.97", reviews: "214", guests: "8", image: PHOTO, href: "#", badge: "Guest favourite" },
      { title: "Cabin among the pines", location: "Lake Tahoe, USA", price: "$275", priceUnit: "/ night", rating: "4.92", reviews: "168", guests: "6", image: PHOTO, href: "#", badge: "" },
      { title: "Whitewashed loft above the harbour", location: "Paros, Greece", price: "$190", priceUnit: "/ night", rating: "4.88", reviews: "97", guests: "4", image: PHOTO, href: "#", badge: "Superhost" },
      { title: "Garden studio in the old town", location: "Lisbon, Portugal", price: "$140", priceUnit: "/ night", rating: "4.95", reviews: "321", guests: "2", image: PHOTO, href: "#", badge: "" },
    ],
  },
  Component: ListingsRental,
})
