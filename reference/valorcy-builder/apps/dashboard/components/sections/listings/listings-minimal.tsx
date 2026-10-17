"use client"

import { Bed, Bath, ArrowUpRight } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  TONE,
  collectionBlock,
  headingBlock,
  itemsOf,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Listing = { title?: string; address?: string; price?: string; beds?: string; baths?: string; status?: string; href?: string }

/**
 * Index — minimal archetype.
 *
 * Text-only property rows in one narrow column: name with a status pill,
 * address, beds / baths and the price. No photography, maximum density.
 */
function ListingsMinimal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-3xl">
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
            return (
              <div className="mt-8 divide-y divide-border">
                {listings.map((l, i) => (
                  <a
                    key={i}
                    href={l.href || "#"}
                    className="group -mx-3 flex items-center gap-4 rounded-xl px-3 py-4 transition hover:bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <ItemText
                          instance={inst}
                          collection="listings"
                          index={i}
                          field="title"
                          value={l.title}
                          isPreview={isPreview}
                          className="font-semibold text-foreground"
                        />
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.status === "Available" ? TONE.positive : TONE.caution}`}>
                          {txt(l.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{txt(l.address)}</p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-4 text-sm text-muted-foreground sm:flex">
                      <span className="flex items-center gap-1"><Bed className="size-3.5" />{txt(l.beds)}</span>
                      <span className="flex items-center gap-1"><Bath className="size-3.5" />{txt(l.baths)}</span>
                    </div>
                    <ItemText
                      instance={inst}
                      collection="listings"
                      index={i}
                      field="price"
                      value={l.price}
                      isPreview={isPreview}
                      className="shrink-0 font-semibold text-primary"
                    />
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40 transition group-hover:text-primary" />
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

export const listingsMinimalSection = defineSection({
  id: "listings-minimal",
  displayName: "Index",
  description: "Text-only property rows with status pill, address, beds / baths and price — no images, maximum density.",
  category: "listings",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "law", "finance"],
  styles: ["minimal", "editorial", "corporate"],
  goals: ["leads", "sales"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 93,
  editable: true,
  tags: ["listings", "minimal", "text", "real-estate"],
  funnelStage: "consideration",
  conversionWeight: 50,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Section headline (2–4 words)", maxLength: 40 }),
      collectionBlock({
        key: "listings",
        label: "Listings",
        minItems: 1,
        maxItems: 20,
        newItem: () => ({ title: "Property name", address: "Address", price: "$0", beds: "3", baths: "2", status: "Available", href: "#" }),
        fields: [
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", aiHint: "Street address", maxLength: 80, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $1,200,000", maxLength: 20, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "status", label: "Status", type: "text", aiHint: "e.g. Available, In contract, Sold", maxLength: 20, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Current availability",
    listings: [
      { title: "The Harbour Residence", address: "12 Wharf Road, Unit 3", price: "$725,000", beds: "3", baths: "2", status: "Available", href: "#" },
      { title: "Linden House", address: "48 Linden Avenue", price: "$1,150,000", beds: "5", baths: "4", status: "Available", href: "#" },
      { title: "Mill Lofts, No. 7", address: "7 Mill Street", price: "$489,000", beds: "2", baths: "2", status: "In contract", href: "#" },
      { title: "Garden Flat on Rose Lane", address: "22 Rose Lane", price: "$2,400/mo", beds: "2", baths: "2", status: "Available", href: "#" },
      { title: "Birchwood Family Home", address: "9 Birchwood Close", price: "$865,000", beds: "4", baths: "3", status: "Available", href: "#" },
    ],
  },
  Component: ListingsMinimal,
})
