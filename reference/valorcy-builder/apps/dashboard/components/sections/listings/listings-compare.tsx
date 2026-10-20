"use client"

import { Check, X, Bed, Bath, Maximize, MapPin } from "lucide-react"
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
  headingBlock,
  itemsOf,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CompareItem = { title?: string; address?: string; price?: string; beds?: string; baths?: string; sqft?: string; yearBuilt?: string; parking?: boolean; outdoor?: boolean; storage?: boolean; image?: string; href?: string }

const ROWS = [
  { label: "Bedrooms", key: "beds", icon: <Bed className="size-3.5" /> },
  { label: "Bathrooms", key: "baths", icon: <Bath className="size-3.5" /> },
  { label: "Sq ft", key: "sqft", icon: <Maximize className="size-3.5" /> },
  { label: "Year built", key: "yearBuilt", icon: null },
] as const

const BOOL_ROWS = [
  { label: "Parking", key: "parking" },
  { label: "Outdoor space", key: "outdoor" },
  { label: "Storage", key: "storage" },
] as const

/**
 * Versus — matrix archetype.
 *
 * A comparison table: properties across the top (photo, title, address, price),
 * specs and yes / no amenities down the side.
 */
function ListingsCompare ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const items = itemsOf<CompareItem>(inst, "items")
            if (items.length === 0) return null
            const columns = { gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }
            return (
              <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
                <div className="grid border-b border-border" style={columns}>
                  <div className="p-4" />
                  {items.map((item, i) => (
                    <a key={i} href={item.href || "#"} className="group border-s border-border p-4 transition hover:bg-muted/30">
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                        <ItemPhoto
                          instance={inst}
                          collection="items"
                          index={i}
                          src={item.image}
                          alt={item.title}
                          elementKey={`img-${i}`}
                          className="absolute inset-0 size-full object-cover transition-transform duration-500"
                        />
                      </div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="title"
                        value={item.title}
                        isPreview={isPreview}
                        className="font-semibold leading-snug text-foreground"
                      />
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{txt(item.address)}</p>
                      <p className="mt-1.5 text-lg font-semibold text-primary">{txt(item.price)}</p>
                    </a>
                  ))}
                </div>
                {ROWS.map(({ label, key, icon }) => (
                  <div key={key} className="grid border-b border-border last:border-0" style={columns}>
                    <div className="flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold text-muted-foreground">
                      {icon}{label}
                    </div>
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center border-s border-border px-4 py-3.5 text-sm text-foreground">
                        {txt(item[key])}
                      </div>
                    ))}
                  </div>
                ))}
                {BOOL_ROWS.map(({ label, key }) => (
                  <div key={key} className="grid border-b border-border last:border-0" style={columns}>
                    <div className="flex items-center px-4 py-3.5 text-xs font-semibold text-muted-foreground">{label}</div>
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center border-s border-border px-4 py-3.5">
                        {item[key] ? <Check className="size-4 text-success" /> : <X className="size-4 text-muted-foreground/40" />}
                      </div>
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

export const listingsCompareSection = defineSection({
  id: "listings-compare",
  displayName: "Versus",
  description: "Side-by-side comparison table — properties across the top, specs and amenity checks down the side.",
  category: "listings",
  layoutArchetype: "matrix",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker"],
  styles: ["minimal", "corporate", "modern"],
  goals: ["leads", "sales", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 80,
  editable: true,
  tags: ["listings", "compare", "side-by-side", "real-estate"],
  funnelStage: "decision",
  conversionWeight: 70,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Section headline (2–4 words)", maxLength: 50 }),
      collectionBlock({
        key: "items",
        label: "Properties (2–3)",
        minItems: 2,
        maxItems: 3,
        newItem: () => ({ title: "Property", address: "Address", price: "$0", beds: "3", baths: "2", sqft: "1,500", yearBuilt: "2010", parking: true, outdoor: false, storage: false, image: "", href: "#" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", maxLength: 60, group: "content" },
          { key: "price", label: "Price", type: "text", maxLength: 16, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "sqft", label: "Sq ft", type: "text", maxLength: 10, group: "content" },
          { key: "yearBuilt", label: "Year built", type: "text", maxLength: 8, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Compare your shortlist",
    items: [
      { title: "Modern condo, Harbour District", address: "120 Quay Street, Unit 6", price: "$689,000", beds: "3", baths: "2", sqft: "2,100", yearBuilt: "2012", parking: true, outdoor: false, storage: true, image: PHOTO, href: "#" },
      { title: "Brownstone, Old Town", address: "15 Chapel Row", price: "$1,240,000", beds: "5", baths: "4", sqft: "3,800", yearBuilt: "1887", parking: false, outdoor: true, storage: true, image: PHOTO, href: "#" },
    ],
  },
  Component: ListingsCompare,
})
