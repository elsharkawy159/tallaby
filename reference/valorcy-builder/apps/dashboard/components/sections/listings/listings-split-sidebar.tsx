"use client"

import { Bed, Bath, Maximize, MapPin, SlidersHorizontal } from "lucide-react"
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
  PropText,
  collectionBlock,
  headingBlock,
  itemsOf,
  noteBlock,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Listing = { title?: string; address?: string; price?: string; beds?: string; baths?: string; sqft?: string; image?: string; href?: string; type?: string }
type Filter = { label?: string }

/** The filter rail is desktop-only, as it always was; the results fill the rest. */
function resultsEntry (entry: SlotEntry): string | undefined {
  if (entry.kind !== "block") return undefined
  return entry.block.id === "filters" ? "hidden lg:block" : "min-w-0"
}

/**
 * Portal — filter-rail archetype.
 *
 * A search-portal layout: headline and result count on one row, then a filter
 * rail beside a two-up property grid. The rail is presentational — its options
 * are an editable collection, not a live filter.
 */
function ListingsSplitSidebar ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="header"
          className="mb-8 flex items-center justify-between gap-4"
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          overrides={{
            resultCount: ({ instance: inst }) => (
              <PropText instance={inst} propKey="resultCount" isPreview={isPreview} className="shrink-0 text-sm text-muted-foreground" />
            ),
          }}
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="results"
          className="grid gap-8 lg:grid-cols-[220px_1fr]"
          entryClassName={resultsEntry}
          renderItems={({ instance: inst, block }) => {
            if (block.collectionKey === "filters") {
              const filters = itemsOf<Filter>(inst, "filters")
              return (
                <aside>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><SlidersHorizontal className="size-4" />Filters</p>
                    <div className="space-y-1">
                      {filters.map((f, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-lg px-3 py-2 text-start text-sm transition ${i === 0 ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                        >
                          <ItemText instance={inst} collection="filters" index={i} field="label" value={f.label} isPreview={isPreview} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="mb-3 text-xs font-semibold text-muted-foreground">Price range</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">$500k</div>
                        <span className="text-muted-foreground">–</span>
                        <div className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">$5M+</div>
                      </div>
                    </div>
                  </div>
                </aside>
              )
            }

            const listings = itemsOf<Listing>(inst, "listings")
            if (listings.length === 0) return null
            return (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {listings.map((l, i) => (
                  <a
                    key={i}
                    href={l.href || "#"}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <ItemPhoto
                        instance={inst}
                        collection="listings"
                        index={i}
                        src={l.image}
                        alt={l.title}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500"
                      />
                      <span className="absolute start-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground">
                        {txt(l.type)}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-lg font-semibold text-primary">{txt(l.price)}</p>
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="listings"
                        index={i}
                        field="title"
                        value={l.title}
                        isPreview={isPreview}
                        className="mt-0.5 font-semibold leading-snug text-foreground"
                      />
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{txt(l.address)}</p>
                      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
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

export const listingsSplitSidebarSection = defineSection({
  id: "listings-split-sidebar",
  displayName: "Portal",
  description: "Search-portal layout — a filter rail beside a two-up property grid, with a result count in the header.",
  category: "listings",
  layoutArchetype: "filter-rail",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "sales", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 84,
  editable: true,
  tags: ["listings", "filter", "sidebar", "real-estate", "search"],
  funnelStage: "consideration",
  conversionWeight: 62,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "header", label: "Header", isDefault: true, eject: { direction: "row" } },
      { id: "results", label: "Results", accepts: ["items"], eject: { direction: "row" } },
    ],
    blocks: [
      headingBlock({ aiHint: "Section headline (2–4 words)", maxLength: 50 }),
      noteBlock({ key: "resultCount", label: "Result count", type: "text", aiHint: "e.g. 48 properties found", maxLength: 30, group: "content" }),
      collectionBlock({
        key: "filters",
        label: "Filter options",
        canonical: "items",
        slot: "results",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ label: "Filter" }),
        fields: [{ key: "label", label: "Filter label", type: "text", aiHint: "e.g. Condo, Rental", maxLength: 24, group: "content" }],
      }),
      collectionBlock({
        key: "listings",
        label: "Properties",
        slot: "results",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ title: "Property", address: "Address", price: "$0", beds: "3", baths: "2", sqft: "1,500", image: "", href: "#", type: "Condo" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "type", label: "Type", type: "text", aiHint: "e.g. Condo, Townhouse", maxLength: 20, group: "content" },
          { key: "title", label: "Title", type: "text", canonical: "headline", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", maxLength: 60, group: "content" },
          { key: "price", label: "Price", type: "text", maxLength: 16, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "sqft", label: "Sq ft", type: "text", maxLength: 10, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "Homes for sale",
    resultCount: "48 properties found",
    filters: [{ label: "All types" }, { label: "Condo" }, { label: "Townhouse" }, { label: "Co-op" }, { label: "Rental" }],
    listings: [
      { title: "Corner condo with balcony", address: "310 Marina Boulevard, Unit 9A", price: "$689,000", beds: "3", baths: "2", sqft: "2,100", image: PHOTO, href: "#", type: "Condo" },
      { title: "Brick townhouse, roof terrace", address: "27 Chapel Street", price: "$1,240,000", beds: "5", baths: "4", sqft: "3,800", image: PHOTO, href: "#", type: "Townhouse" },
      { title: "Renovated co-op by the park", address: "1 Parkside Drive, Apt 4C", price: "$498,000", beds: "2", baths: "2", sqft: "1,450", image: PHOTO, href: "#", type: "Co-op" },
      { title: "Loft-style condo downtown", address: "88 Foundry Street, Unit 12", price: "$575,000", beds: "2", baths: "2", sqft: "1,700", image: PHOTO, href: "#", type: "Condo" },
    ],
  },
  Component: ListingsSplitSidebar,
})
