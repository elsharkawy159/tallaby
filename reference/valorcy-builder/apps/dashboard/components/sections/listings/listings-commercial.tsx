"use client"

import { Building2, Ruler } from "lucide-react"
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
  TONE,
  collectionBlock,
  eyebrowBlock,
  headingBlock,
  itemsOf,
  kickerEyebrow,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CommercialListing = { title?: string; address?: string; type?: string; sqft?: string; floor?: string; pricePerSqft?: string; totalPrice?: string; availability?: string; image?: string; href?: string }

/**
 * Tenancy — spec-cards archetype.
 *
 * Commercial space rows: a typed photo on the start side, then title, address
 * and a spec line of area, floor, rate, total and availability.
 */
function ListingsCommercial ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const listings = itemsOf<CommercialListing>(inst, "listings")
            if (listings.length === 0) return null
            return (
              <div className="mt-10 space-y-5">
                {listings.map((l, i) => (
                  <a
                    key={i}
                    href={l.href || "#"}
                    className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30 sm:grid-cols-[240px_1fr]"
                  >
                    <div className="relative h-40 overflow-hidden bg-muted sm:h-auto">
                      <ItemPhoto
                        instance={inst}
                        collection="listings"
                        index={i}
                        src={l.image}
                        alt={l.title}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500"
                      />
                      <span className="absolute start-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                        {txt(l.type)}
                      </span>
                    </div>
                    <div className="flex flex-col justify-between gap-4 p-6">
                      <div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="listings"
                          index={i}
                          field="title"
                          value={l.title}
                          isPreview={isPreview}
                          className="text-lg font-semibold text-foreground"
                        />
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><Building2 className="size-3.5" />{txt(l.address)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Ruler className="size-3.5" />{txt(l.sqft)} sqft</span>
                        <span className="text-muted-foreground">Floor {txt(l.floor)}</span>
                        <span className="text-muted-foreground">{txt(l.pricePerSqft)}</span>
                        <span className="font-semibold text-primary">{txt(l.totalPrice)}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${l.availability === "Immediate" ? TONE.positive : TONE.caution}`}>
                          {txt(l.availability)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-primary transition">
                        Request details
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

export const listingsCommercialSection = defineSection({
  id: "listings-commercial",
  displayName: "Tenancy",
  description: "Commercial space rows with type, area, floor, rate per sq ft, total price and availability.",
  category: "listings",
  layoutArchetype: "spec-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "architecture", "finance", "enterprise"],
  styles: ["corporate", "minimal", "modern"],
  goals: ["leads", "sales", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 86,
  editable: true,
  tags: ["listings", "commercial", "office", "retail", "real-estate"],
  funnelStage: "consideration",
  conversionWeight: 60,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Commercial headline (3–6 words)", maxLength: 60 }),
      collectionBlock({
        key: "listings",
        label: "Spaces",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ title: "Space name", address: "Address", type: "Office", sqft: "5,000", floor: "10F", pricePerSqft: "$50/sqft", totalPrice: "$20,833/mo", availability: "Immediate", image: "", href: "#" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "type", label: "Space type", type: "text", aiHint: "e.g. Office, Retail, Industrial", maxLength: 20, group: "content" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Space name", maxLength: 70, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", aiHint: "Full address", maxLength: 100, group: "content" },
          { key: "sqft", label: "Sq ft", type: "text", maxLength: 12, group: "content" },
          { key: "floor", label: "Floor", type: "text", aiHint: "e.g. 10F, Ground", maxLength: 15, group: "content" },
          { key: "pricePerSqft", label: "Price/sqft", type: "text", aiHint: "e.g. $50/sqft", maxLength: 15, group: "content" },
          { key: "totalPrice", label: "Total price", type: "text", aiHint: "e.g. $20,833/mo", maxLength: 20, group: "content" },
          { key: "availability", label: "Availability", type: "text", aiHint: "e.g. Immediate or Q2 2025", maxLength: 20, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Commercial",
    headline: "Space for every kind of business",
    listings: [
      { title: "Full-floor office with skyline views", address: "1 Exchange Plaza, Financial District", type: "Office", sqft: "12,500", floor: "42F", pricePerSqft: "$58/sqft", totalPrice: "$60,400/mo", availability: "Immediate", image: PHOTO, href: "#" },
      { title: "Corner retail unit on the high street", address: "84 Market Street", type: "Retail", sqft: "4,200", floor: "Ground", pricePerSqft: "$72/sqft", totalPrice: "$25,200/mo", availability: "Q2 2026", image: PHOTO, href: "#" },
      { title: "Logistics warehouse with dock access", address: "Unit 9, Riverside Industrial Park", type: "Industrial", sqft: "48,000", floor: "Single-story", pricePerSqft: "$14/sqft", totalPrice: "$56,000/mo", availability: "Immediate", image: PHOTO, href: "#" },
    ],
  },
  Component: ListingsCommercial,
})
