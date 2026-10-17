"use client"

import { Bed, Bath, Maximize, MapPin } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
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

type Listing = { title?: string; price?: string; address?: string; beds?: string; baths?: string; sqft?: string; image?: string; href?: string }

/**
 * Noir — inverted archetype.
 *
 * A near-black band of translucent property cards with muted photography and
 * accent-coloured prices. It stays dark whatever the site theme, so its surface
 * is chrome rather than a token.
 */
function ListingsLuxury ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false, defaultColor: "var(--background)" } })

  return (
    <section className="bg-foreground text-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} text-background`}
          overrides={{ eyebrow: kickerEyebrow(isPreview, "mb-3 text-accent") }}
          renderItems={({ instance: inst }) => {
            const listings = itemsOf<Listing>(inst, "listings")
            if (listings.length === 0) return null
            return (
              <div className="mt-12 grid grid-cols-1 gap-6 text-start sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((l, i) => (
                  <a
                    key={i}
                    href={l.href || "#"}
                    className="group overflow-hidden rounded-2xl border border-background/10 bg-background/5 transition hover:border-background/25 hover:bg-background/8"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-background/10">
                      <ItemPhoto
                        instance={inst}
                        collection="listings"
                        index={i}
                        src={l.image}
                        alt={l.title}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover opacity-85 transition-transform duration-700 group-hover:opacity-100"
                        empty={<div className="absolute inset-0 bg-background/10" />}
                      />
                    </div>
                    <div className="p-5">
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="listings"
                        index={i}
                        field="price"
                        value={l.price}
                        isPreview={isPreview}
                        className="text-xl font-semibold text-accent"
                      />
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="listings"
                        index={i}
                        field="title"
                        value={l.title}
                        isPreview={isPreview}
                        className="mt-1 font-medium text-background"
                      />
                      <p className="mt-1 flex items-center gap-1 text-xs text-background/50"><MapPin className="size-3" />{txt(l.address)}</p>
                      <div className="mt-3 flex items-center gap-4 border-t border-background/10 pt-3 text-xs text-background/50">
                        <span className="flex items-center gap-1"><Bed className="size-3.5" />{txt(l.beds)} bd</span>
                        <span className="flex items-center gap-1"><Bath className="size-3.5" />{txt(l.baths)} ba</span>
                        <span className="flex items-center gap-1"><Maximize className="size-3.5" />{txt(l.sqft)} sf</span>
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

export const listingsLuxurySection = defineSection({
  id: "listings-luxury",
  displayName: "Noir",
  description: "Near-black band of premium property cards with muted photography and accent-coloured prices.",
  category: "listings",
  layoutArchetype: "inverted",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "hotel", "interior_design"],
  styles: ["dark", "editorial", "bold"],
  goals: ["leads", "sales", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["listings", "luxury", "real-estate", "dark", "premium"],
  funnelStage: "consideration",
  conversionWeight: 60,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short prestige label (1–3 words)" }),
      headingBlock({ aiHint: "Luxury property headline (6–10 words)", maxLength: 80 }),
      collectionBlock({
        key: "listings",
        label: "Properties",
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ title: "Property name", price: "$0", address: "Address", beds: "4", baths: "4", sqft: "4,000", image: "", href: "#" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Luxury property name", maxLength: 70, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", aiHint: "Full address", maxLength: 100, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $15,900,000", maxLength: 20, group: "content" },
          { key: "beds", label: "Bedrooms", type: "text", maxLength: 5, group: "content" },
          { key: "baths", label: "Bathrooms", type: "text", maxLength: 5, group: "content" },
          { key: "sqft", label: "Sq ft", type: "text", maxLength: 10, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "The private collection",
    headline: "Residences of rare distinction, offered by invitation",
    listings: [
      { title: "Clifftop estate with ocean terraces", price: "$12,800,000", address: "1 Headland Way, Seacliff", beds: "4", baths: "4.5", sqft: "6,240", image: PHOTO, href: "#" },
      { title: "Penthouse above the old harbour", price: "$9,450,000", address: "200 Harbour Crescent, PH1", beds: "6", baths: "7", sqft: "8,100", image: PHOTO, href: "#" },
      { title: "Courtyard villa in the vineyards", price: "$6,900,000", address: "Vine Hill Road, Valley Estate", beds: "5", baths: "5", sqft: "5,400", image: PHOTO, href: "#" },
    ],
  },
  Component: ListingsLuxury,
})
