"use client"

import { Bed, Bath, Maximize, MapPin, Heart } from "lucide-react"
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

type Listing = { title?: string; price?: string; address?: string; beds?: string; baths?: string; sqft?: string; image?: string; href?: string; badge?: string; type?: string }

/**
 * Roster — list archetype.
 *
 * Full-width property rows — thumbnail on the start side, details and price on
 * the end side — the classic portal list view. The header carries a live result
 * count beside the copy, so the rows sit in a slot of their own below it.
 */
function ListingsHorizontal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const count = itemsOf<Listing>(instance, "listings").length

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
          <span className="shrink-0 text-sm text-muted-foreground">{count} listings</span>
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="results"
          className="flex flex-col"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const listings = itemsOf<Listing>(inst, "listings")
            if (listings.length === 0) return null
            return (
              <div className="space-y-4">
                {listings.map((l, i) => (
                  <a
                    key={i}
                    href={l.href || "#"}
                    className="group flex gap-5 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                  >
                    <div className="relative w-52 shrink-0 overflow-hidden bg-muted">
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
                    <div className="flex flex-1 flex-col justify-center gap-2 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">{txt(l.type)}</p>
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="listings"
                            index={i}
                            field="title"
                            value={l.title}
                            isPreview={isPreview}
                            className="font-semibold text-foreground"
                          />
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {txt(l.address)}
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="listings"
                            index={i}
                            field="price"
                            value={l.price}
                            isPreview={isPreview}
                            className="text-lg font-semibold text-primary"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Bed className="size-3.5" />{txt(l.beds)} bd</span>
                        <span className="flex items-center gap-1"><Bath className="size-3.5" />{txt(l.baths)} ba</span>
                        <span className="flex items-center gap-1"><Maximize className="size-3.5" />{txt(l.sqft)} sqft</span>
                      </div>
                    </div>
                    <div className="flex items-center pe-5">
                      <Heart className="size-5 text-muted-foreground/40 transition group-hover:text-primary/60" />
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

export const listingsHorizontalSection = defineSection({
  id: "listings-horizontal",
  displayName: "Roster",
  description: "Full-width property rows — thumbnail on one side, details and price on the other — with a result count.",
  category: "listings",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "architecture", "generic"],
  styles: ["minimal", "modern", "corporate"],
  goals: ["leads", "sales", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 86,
  editable: true,
  tags: ["listings", "real-estate", "properties", "horizontal"],
  funnelStage: "consideration",
  conversionWeight: 65,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "results", label: "Results", accepts: ["items"] },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Listings section headline (3–6 words)", maxLength: 60 }),
      collectionBlock({
        key: "listings",
        label: "Properties",
        slot: "results",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ title: "Property name", price: "$0", address: "Address", beds: "3", baths: "2", sqft: "1,500", image: "", href: "#", badge: "", type: "House" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "badge", label: "Badge", type: "text", aiHint: "e.g. New, Price reduced", maxLength: 20, group: "content" },
          { key: "type", label: "Property type", type: "text", aiHint: "e.g. Condo, Townhouse", maxLength: 30, group: "content" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name/description", maxLength: 70, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", aiHint: "Full street address", maxLength: 100, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $1,200,000", maxLength: 20, group: "content" },
          { key: "beds", label: "Bedrooms", type: "text", aiHint: "e.g. 3", maxLength: 5, group: "content" },
          { key: "baths", label: "Bathrooms", type: "text", aiHint: "e.g. 2", maxLength: 5, group: "content" },
          { key: "sqft", label: "Sq ft", type: "text", aiHint: "e.g. 1,800", maxLength: 10, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Now available",
    headline: "Latest properties for sale",
    listings: [
      { title: "Corner condo with wraparound balcony", price: "$689,000", address: "310 Marina Boulevard, Unit 9A", beds: "3", baths: "2", sqft: "2,100", image: PHOTO, href: "#", badge: "New", type: "Condo" },
      { title: "Brick townhouse with roof terrace", price: "$1,240,000", address: "27 Chapel Street, Old Quarter", beds: "5", baths: "4", sqft: "3,800", image: PHOTO, href: "#", badge: "", type: "Townhouse" },
      { title: "Renovated co-op near the park", price: "$498,000", address: "1 Parkside Drive, Apt 4C", beds: "2", baths: "2", sqft: "1,450", image: PHOTO, href: "#", badge: "Reduced", type: "Co-op" },
    ],
  },
  Component: ListingsHorizontal,
})
