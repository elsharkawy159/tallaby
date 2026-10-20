"use client"

import { Bed, Bath, Maximize, MapPin } from "lucide-react"
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
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Listing = { title?: string; price?: string; address?: string; beds?: string; baths?: string; sqft?: string; image?: string; href?: string; badge?: string }

/**
 * Estate — grid archetype.
 *
 * Centred header over a three-up grid of property cards: photo with a status
 * badge and a price tag, then title, address and the beds / baths / sqft line.
 * The collection is CMS-bindable (`listings`), so each card stays a plain link
 * to the item's detail route; only the header copy is made of blocks.
 */
function ListingsGrid ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const listings = itemsOf<Listing>(inst, "listings")
            if (listings.length === 0) return null
            return (
              <div className="mt-7 grid grid-cols-1 gap-6 text-start sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing, i) => (
                  <a
                    key={i}
                    href={listing.href || "#"}
                    className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <ItemPhoto
                        instance={inst}
                        collection="listings"
                        index={i}
                        src={listing.image}
                        alt={listing.title}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-300"
                        empty={
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Property photo</div>
                        }
                      />
                      {listing.badge && (
                        <span className="absolute start-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          {listing.badge}
                        </span>
                      )}
                      <div className="absolute bottom-3 end-3 rounded-xl bg-primary/85 px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                        {txt(listing.price)}
                      </div>
                    </div>
                    <div className="p-5">
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="listings"
                        index={i}
                        field="title"
                        value={listing.title}
                        elementId={`title${i}`}
                        isPreview={isPreview}
                        className="font-semibold text-foreground transition-colors group-hover:text-primary"
                      />
                      {listing.address && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          {listing.address}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        {listing.beds && (
                          <span className="flex items-center gap-1">
                            <Bed className="size-3.5" /> {listing.beds} beds
                          </span>
                        )}
                        {listing.baths && (
                          <span className="flex items-center gap-1">
                            <Bath className="size-3.5" /> {listing.baths} baths
                          </span>
                        )}
                        {listing.sqft && (
                          <span className="flex items-center gap-1">
                            <Maximize className="size-3.5" /> {listing.sqft} sqft
                          </span>
                        )}
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

export const listingsGridSection = defineSection({
  id: "listings-grid",
  displayName: "Estate",
  description: "Centred header over a three-up grid of property cards with price tag, status badge and specs.",
  category: "listings",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "interior_design", "architecture"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "sales", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 80,
  trustWeight: 60,
  tags: ["listings", "real-estate", "properties", "homes", "grid"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ maxLength: 70 }),
      descriptionBlock({ maxLength: 200 }),
      collectionBlock({
        key: "listings",
        label: "Listings",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ title: "Property name", price: "$0", address: "", beds: "", baths: "", sqft: "", image: "", href: "#", badge: "" }),
        fields: [
          { key: "title", label: "Property title", type: "text", canonical: "headline", maxLength: 70 },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $1,250,000 or $3,500/mo", maxLength: 20 },
          { key: "address", label: "Address", type: "text", aiHint: "Street address", maxLength: 100 },
          { key: "beds", label: "Bedrooms", type: "text", aiHint: "e.g. 3", maxLength: 5 },
          { key: "baths", label: "Bathrooms", type: "text", aiHint: "e.g. 2.5", maxLength: 5 },
          { key: "sqft", label: "Square footage", type: "text", aiHint: "e.g. 2,100", maxLength: 10 },
          { key: "image", label: "Property photo", type: "image", canonical: "image" },
          { key: "href", label: "Listing link", type: "url", canonical: "ctaLink" },
          { key: "badge", label: "Status badge (optional)", type: "text", aiHint: "e.g. New, Sold, Open House", maxLength: 20 },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Featured homes",
    headline: "Find the home that fits your life",
    description: "Hand-picked properties across the city's most sought-after neighbourhoods, each viewed and vetted by our team.",
    listings: [
      { title: "Sunlit family home with garden", price: "$845,000", address: "14 Elm Grove, Riverside", beds: "3", baths: "2.5", sqft: "2,100", image: PHOTO, href: "#", badge: "New" },
      { title: "Modern two-bed with city views", price: "$3,200/mo", address: "220 Harbour Street, Unit 12B", beds: "2", baths: "2", sqft: "1,400", image: PHOTO, href: "#", badge: "" },
      { title: "Restored townhouse near the park", price: "$1,190,000", address: "8 Linden Row, Old Town", beds: "4", baths: "3", sqft: "3,200", image: PHOTO, href: "#", badge: "Open house" },
    ],
  },
  Component: ListingsGrid,
})
