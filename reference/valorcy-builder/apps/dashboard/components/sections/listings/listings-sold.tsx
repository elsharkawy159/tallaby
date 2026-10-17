"use client"

import { TrendingUp, Bed, Bath } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemPhoto,
  ItemText,
  PHOTO,
  TONE,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  itemsOf,
  kickerEyebrow,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type SoldListing = { title?: string; address?: string; soldPrice?: string; askingPrice?: string; daysOnMarket?: string; beds?: string; baths?: string; image?: string; soldDate?: string }

/**
 * Closings — track-record archetype.
 *
 * Recently sold cards: a SOLD flag and date on the photo, then the sold price
 * against the struck-through asking price and the days on market — an agent's
 * results as proof.
 */
function ListingsSold ({ instance, isPreview, definition }: SectionComponentProps) {
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
          bodyClassName={`${TYPE_BODY} mt-2`}
          overrides={{ eyebrow: kickerEyebrow(isPreview) }}
          renderItems={({ instance: inst }) => {
            const listings = itemsOf<SoldListing>(inst, "listings")
            if (listings.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((l, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <ItemPhoto
                        instance={inst}
                        collection="listings"
                        index={i}
                        src={l.image}
                        alt={l.title}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover grayscale-[30%]"
                      />
                      <span className="absolute start-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background">SOLD</span>
                      <span className="absolute end-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-muted-foreground">{txt(l.soldDate)}</span>
                    </div>
                    <div className="p-5">
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
                      <p className="mt-0.5 text-xs text-muted-foreground">{txt(l.address)}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Sold for</p>
                          <p className="text-lg font-semibold text-primary">{txt(l.soldPrice)}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-xs text-muted-foreground">Asking</p>
                          <p className="text-sm text-muted-foreground line-through">{txt(l.askingPrice)}</p>
                        </div>
                        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE.positive}`}>
                          <TrendingUp className="size-3" />{txt(l.daysOnMarket)}d
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Bed className="size-3.5" />{txt(l.beds)} bd</span>
                        <span className="flex items-center gap-1"><Bath className="size-3.5" />{txt(l.baths)} ba</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const listingsSoldSection = defineSection({
  id: "listings-sold",
  displayName: "Closings",
  description: "Recently sold cards — sold price against asking price and days on market — to build agent credibility.",
  category: "listings",
  layoutArchetype: "track-record",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker"],
  styles: ["minimal", "modern", "corporate"],
  goals: ["trust", "leads", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["listings", "sold", "comps", "track-record", "real-estate"],
  trustWeight: 75,
  funnelStage: "consideration",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Results headline (4–7 words)", maxLength: 70 }),
      descriptionBlock({ aiHint: "Short credibility statement (1 sentence)", maxLength: 140 }),
      collectionBlock({
        key: "listings",
        label: "Sold listings",
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ title: "Property name", address: "Address", soldPrice: "$0", askingPrice: "$0", daysOnMarket: "14", beds: "3", baths: "2", image: "", soldDate: "Jan 2025" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", aiHint: "Address", maxLength: 80, group: "content" },
          { key: "soldPrice", label: "Sold price", type: "text", aiHint: "e.g. $1,250,000", maxLength: 20, group: "content" },
          { key: "askingPrice", label: "Asking price", type: "text", aiHint: "e.g. $1,200,000", maxLength: 20, group: "content" },
          { key: "daysOnMarket", label: "Days on market", type: "text", aiHint: "e.g. 8", maxLength: 6, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "soldDate", label: "Sold date", type: "text", aiHint: "e.g. May 2025", maxLength: 20, group: "content" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Recently sold",
    headline: "Results our clients can count on",
    description: "Every home below sold above asking — most within two weeks of listing.",
    listings: [
      { title: "Three-bed semi with garden office", address: "31 Ash Grove, Riverside", soldPrice: "$812,000", askingPrice: "$789,000", daysOnMarket: "8", beds: "3", baths: "2", image: PHOTO, soldDate: "May 2026" },
      { title: "Period townhouse near the square", address: "4 Market Row, Old Town", soldPrice: "$1,325,000", askingPrice: "$1,275,000", daysOnMarket: "22", beds: "5", baths: "4", image: PHOTO, soldDate: "Apr 2026" },
      { title: "Top-floor apartment with terrace", address: "90 Canal Street, Unit 11", soldPrice: "$574,000", askingPrice: "$550,000", daysOnMarket: "5", beds: "2", baths: "2", image: PHOTO, soldDate: "Apr 2026" },
    ],
  },
  Component: ListingsSold,
})
