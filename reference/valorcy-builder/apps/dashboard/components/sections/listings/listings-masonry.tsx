"use client"

import { Bed, Bath, MapPin } from "lucide-react"
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
  PORTRAIT,
  collectionBlock,
  headingBlock,
  itemsOf,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionInstance, SectionComponentProps } from "@/components/sections/registry.types"

type Listing = { title?: string; address?: string; price?: string; beds?: string; baths?: string; image?: string; href?: string; tall?: boolean | string }

/** `tall` was stored as a boolean by the defaults and as "true"/"false" by the inspector select. */
const isTall = (v: Listing["tall"]) => v === true || v === "true"

function MasonryCard ({ instance, l, index, isPreview }: { instance: SectionInstance; l: Listing; index: number; isPreview?: boolean }) {
  return (
    <a href={l.href || "#"} className="group relative block overflow-hidden rounded-2xl bg-muted">
      <div className={`relative overflow-hidden ${isTall(l.tall) ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
        <ItemPhoto
          instance={instance}
          collection="listings"
          index={index}
          src={l.image}
          alt={l.title}
          elementKey={`img-${index}`}
          className="absolute inset-0 size-full object-cover transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 end-0 start-0 p-4">
          <p className="text-lg font-semibold leading-tight text-white">{txt(l.price)}</p>
          <ItemText
            as="h3"
            instance={instance}
            collection="listings"
            index={index}
            field="title"
            value={l.title}
            isPreview={isPreview}
            className="text-sm font-medium text-white/90"
          />
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60"><MapPin className="size-3" />{txt(l.address)}</p>
          <div className="mt-1 flex gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1"><Bed className="size-3" />{txt(l.beds)}</span>
            <span className="flex items-center gap-1"><Bath className="size-3" />{txt(l.baths)}</span>
          </div>
        </div>
      </div>
    </a>
  )
}

/**
 * Cascade — masonry archetype.
 *
 * Two offset columns of photo cards in mixed heights, with price, title,
 * address and beds / baths over a dark scrim. Items alternate columns; the
 * `tall` flag picks a portrait card. The scrim stays dark in both themes.
 */
function ListingsMasonry ({ instance, isPreview, definition }: SectionComponentProps) {
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
          renderItems={({ instance: inst }) => {
            const listings = itemsOf<Listing>(inst, "listings")
            if (listings.length === 0) return null
            const columns = [0, 1].map((col) =>
              listings.map((l, i) => ({ l, i })).filter(({ i }) => i % 2 === col)
            )
            return (
              <div className="mt-8 grid grid-cols-2 gap-4">
                {columns.map((cards, col) => (
                  <div key={col} className={`flex flex-col gap-4 ${col === 1 ? "pt-8" : ""}`}>
                    {cards.map(({ l, i }) => (
                      <MasonryCard key={i} instance={inst} l={l} index={i} isPreview={isPreview} />
                    ))}
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

export const listingsMasonrySection = defineSection({
  id: "listings-masonry",
  displayName: "Cascade",
  description: "Two offset columns of mixed-height photo cards with price, address and beds / baths over a scrim.",
  category: "listings",
  layoutArchetype: "masonry",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "interior_design", "architecture"],
  styles: ["editorial", "bold", "modern"],
  goals: ["leads", "brand", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 87,
  editable: true,
  tags: ["listings", "masonry", "properties", "real-estate", "grid"],
  funnelStage: "consideration",
  conversionWeight: 58,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Section headline (2–5 words)", maxLength: 50 }),
      collectionBlock({
        key: "listings",
        label: "Properties",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ title: "Property", address: "Address", price: "$0", beds: "3", baths: "2", image: "", href: "#", tall: false }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", maxLength: 60, group: "content" },
          { key: "price", label: "Price", type: "text", maxLength: 16, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "tall", label: "Tall card", type: "select", options: [{ value: "false", label: "Standard" }, { value: "true", label: "Tall (portrait)" }], group: "layout" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "A closer look at our portfolio",
    listings: [
      { title: "Glass-walled hillside retreat", address: "2 Ridge Road, Highlands", price: "$1,980,000", beds: "3", baths: "2", image: PORTRAIT, href: "#", tall: true },
      { title: "Courtyard home in the old quarter", address: "17 Cloister Lane", price: "$1,240,000", beds: "5", baths: "4", image: PHOTO, href: "#", tall: false },
      { title: "Converted warehouse loft", address: "60 Foundry Street, Unit 3", price: "$765,000", beds: "2", baths: "2", image: PHOTO, href: "#", tall: false },
      { title: "Lakeside cabin with boathouse", address: "Shore Road, Pine Lake", price: "$890,000", beds: "2", baths: "2", image: PORTRAIT, href: "#", tall: true },
      { title: "Modern family home with pool", address: "44 Meadow Drive, Southfield", price: "$1,120,000", beds: "4", baths: "3", image: PHOTO, href: "#", tall: false },
    ],
  },
  Component: ListingsMasonry,
})
