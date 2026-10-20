"use client"

import { MapPin } from "lucide-react"
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
  eyebrowBlock,
  headingBlock,
  itemsOf,
  stretchItems,
  textOr,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type MapListing = { title?: string; price?: string; address?: string; type?: string; image?: string; href?: string; badge?: string }

/**
 * Cartograph — map-list archetype.
 *
 * A map embed beside a scrolling column of the properties on it. The map is a
 * functional embed configured by the `mapEmbed` setting, so it renders with the
 * collection rather than as a block of its own; the header copy is blocks.
 */
function ListingsMap ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const items = itemsOf<MapListing>(inst, "items")
            const mapEmbed = textOr(inst, "mapEmbed", "")
            return (
              <div className="mt-5 grid grid-cols-1 gap-6 text-start lg:grid-cols-5">
                <div className="relative col-span-1 min-h-[480px] overflow-hidden rounded-2xl border border-border bg-muted lg:col-span-3">
                  {mapEmbed ? (
                    <iframe src={mapEmbed} className="h-full w-full border-0" loading="lazy" title="Property map" />
                  ) : (
                    <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-3 text-muted-foreground">
                      <MapPin className="size-10 opacity-30" />
                      <p className="text-sm">Map embed URL goes here</p>
                      <p className="text-xs opacity-60">Set the map embed URL in the editor</p>
                    </div>
                  )}
                </div>

                <div className="col-span-1 flex flex-col gap-4 lg:col-span-2 lg:max-h-[480px] lg:overflow-y-auto">
                  {items.map((item, i) => (
                    <a
                      key={i}
                      href={item.href || "#"}
                      className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all"
                    >
                      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <ItemPhoto
                          instance={inst}
                          collection="items"
                          index={i}
                          src={item.image}
                          alt={item.title}
                          elementKey={`img-${i}`}
                          className="absolute inset-0 size-full object-cover transition-transform duration-300"
                          empty={<div className="flex h-full items-center justify-center text-xs text-muted-foreground">Photo</div>}
                        />
                        {item.badge && (
                          <span className="absolute start-1 top-1 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="items"
                            index={i}
                            field="title"
                            value={item.title}
                            elementId={`title${i}`}
                            isPreview={isPreview}
                            className="line-clamp-2 text-sm font-semibold text-foreground"
                          />
                          {item.address && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3 shrink-0" /> {item.address}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">{txt(item.price)}</span>
                          {item.type && (
                            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{item.type}</span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const listingsMapSection = defineSection({
  id: "listings-map",
  displayName: "Cartograph",
  description: "A map embed beside a scrolling column of the properties on it.",
  category: "listings",
  layoutArchetype: "map-list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "interior_design", "architecture", "home_services"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "sales", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 82,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 80,
  trustWeight: 55,
  tags: ["listings", "real-estate", "map", "properties", "search"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ maxLength: 70 }),
      collectionBlock({
        key: "items",
        label: "Listings",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ title: "Property name", price: "$0", address: "", type: "", image: "", href: "#", badge: "" }),
        fields: [
          { key: "title", label: "Property title", type: "text", canonical: "headline", maxLength: 70 },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $1,250,000", maxLength: 20 },
          { key: "address", label: "Address", type: "text", aiHint: "Street address", maxLength: 100 },
          { key: "type", label: "Property type", type: "text", aiHint: "e.g. Condo, House, Studio", maxLength: 30 },
          { key: "image", label: "Photo", type: "image", canonical: "image" },
          { key: "href", label: "Listing link", type: "url", canonical: "ctaLink" },
          { key: "badge", label: "Status badge", type: "text", aiHint: "e.g. New, Sold, Open House", maxLength: 20 },
        ],
      }),
    ],
    settings: [
      { key: "mapEmbed", label: "Map embed URL", type: "url", aiHint: "Google Maps or Mapbox embed URL", group: "content" },
    ],
  },
  defaultProps: {
    eyebrow: "Explore the area",
    headline: "Properties on the map",
    mapEmbed: "",
    items: [
      { title: "Two-bed condo by the waterfront", price: "$615,000", address: "88 Quay Street, Unit 7", type: "Condo", image: PHOTO, href: "#", badge: "New" },
      { title: "Detached house on a quiet cul-de-sac", price: "$930,000", address: "5 Orchard Close, Northfield", type: "House", image: PHOTO, href: "#", badge: "" },
      { title: "Bright studio steps from the station", price: "$1,850/mo", address: "41 Rail Yard Lane, Unit 2", type: "Studio", image: PHOTO, href: "#", badge: "Reduced" },
    ],
  },
  Component: ListingsMap,
})
