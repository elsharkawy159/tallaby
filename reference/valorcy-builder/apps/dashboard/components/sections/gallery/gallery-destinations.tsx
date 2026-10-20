"use client"

import { MapPin } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { SectionLink } from "@/components/website-builder/section-link"
import { linkValueFromProp } from "@/lib/builder/links"
import {
  ItemImage,
  ItemText,
  itemsOf,
  labelSetting,
  propOr,
} from "@/components/sections/gallery/gallery-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Destination = {
  name?: string
  country?: string
  tagline?: string
  price?: string
  imageUrl?: string
  href?: string
}

/** Card labels that were hardcoded before the slot migration. */
const PRICE_PREFIX_FALLBACK = "From"
const LINK_LABEL_FALLBACK = "Explore"

/**
 * Voyage — overlap archetype.
 *
 * Tall 4:5 destination photos with the copy laid over a scrim: country, name,
 * tagline, a "from" price pill and an explore cue on hover. Each card links to
 * its destination. The centred header is the slot's lead; the cards are one
 * items entry.
 */
function GalleryDestinations ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
          }
          renderItems={({ instance: inst }) => {
            const items = itemsOf<Destination>(inst)
            if (items.length === 0) return null
            const pricePrefix = propOr(inst, "pricePrefix", PRICE_PREFIX_FALLBACK)
            const linkLabel = propOr(inst, "linkLabel", LINK_LABEL_FALLBACK)
            return (
              <div className="mt-5 grid grid-cols-1 gap-5 text-start sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <SectionLink
                    key={i}
                    link={linkValueFromProp(item.href)}
                    isPreview={isPreview}
                    className="group relative block overflow-hidden rounded-2xl"
                  >
                    <ItemImage
                      instance={inst}
                      index={i}
                      src={item.imageUrl}
                      alt={item.name}
                      ratio="portrait"
                      rounded="none"
                      className="aspect-[4/5]"
                      imgClassName="transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      isPreview={isPreview}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 start-0 end-0 p-5">
                      {item.country && (
                        <div className="mb-1 flex items-center gap-1 text-xs font-medium text-white/70">
                          <MapPin className="size-3" aria-hidden />
                          <ItemText
                            as="span"
                            instance={inst}
                            index={i}
                            field="country"
                            value={item.country}
                            isPreview={isPreview}
                          />
                        </div>
                      )}
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="name"
                        value={item.name}
                        isPreview={isPreview}
                        className="text-lg font-semibold text-white"
                      />
                      {item.tagline && (
                        <ItemText
                          as="p"
                          instance={inst}
                          index={i}
                          field="tagline"
                          value={item.tagline}
                          isPreview={isPreview}
                          className="mt-0.5 text-sm text-white/75"
                        />
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        {item.price && (
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                            {pricePrefix ? `${pricePrefix} ` : null}
                            <ItemText
                              as="span"
                              instance={inst}
                              index={i}
                              field="price"
                              value={item.price}
                              isPreview={isPreview}
                            />
                          </span>
                        )}
                        {linkLabel && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {linkLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </SectionLink>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const galleryDestinationsSection = defineSection({
  id: "gallery-destinations",
  displayName: "Voyage",
  description: "Tall destination photos with country, name, tagline and a starting-price pill over a scrim.",
  category: "gallery",
  layoutArchetype: "overlap",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["travel", "travel_agency", "tour_package"],
  styles: ["editorial", "modern", "bold"],
  goals: ["engagement", "conversion", "leads"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 70,
  trustWeight: 55,
  tags: ["destinations", "travel", "gallery", "cards", "places"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30, group: "content" } },
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: { headline: { key: "headline", canonical: "headline", maxLength: 70, group: "content" } },
      },
      { kind: "body", field: { key: "description", type: "textarea", canonical: "body", maxLength: 200, group: "content" } },
      {
        kind: "items",
        key: "items",
        canonical: "cards",
        label: "Destinations",
        pick: [],
        itemFields: [
          { key: "imageUrl", label: "Photo", type: "image", canonical: "image" },
          { key: "name", label: "Destination name", type: "text", canonical: "headline", maxLength: 50 },
          { key: "country", label: "Country", type: "text", aiHint: "e.g. Italy, Japan", maxLength: 40 },
          { key: "tagline", label: "Short tagline", type: "text", canonical: "body", maxLength: 60 },
          { key: "price", label: "Starting price", type: "text", aiHint: "e.g. From $999", maxLength: 20 },
          { key: "href", label: "Link", type: "url", canonical: "ctaLink" },
        ],
        minItems: 2,
        maxItems: 9,
        newItem: () => ({ name: "Destination", country: "Country", tagline: "Short tagline.", price: "$999", imageUrl: "", href: "#" }),
      },
    ],
    settings: [
      labelSetting("pricePrefix", "Price prefix", PRICE_PREFIX_FALLBACK),
      labelSetting("linkLabel", "Card link label", LINK_LABEL_FALLBACK),
    ],
  },
  defaultProps: {
    eyebrow: "Where to next",
    headline: "Destinations our travellers love",
    description: "Hand-picked places with itineraries built by people who have been there — flights, stays and guides included.",
    items: [
      { name: "Amalfi Coast", country: "Italy", tagline: "Cliffside villages and lemon groves.", price: "$1,890", imageUrl: "", href: "#" },
      { name: "Kyoto", country: "Japan", tagline: "Temples, tea houses and autumn maples.", price: "$2,340", imageUrl: "", href: "#" },
      { name: "Marrakech", country: "Morocco", tagline: "Souks, riads and the Atlas beyond.", price: "$1,250", imageUrl: "", href: "#" },
      { name: "Lofoten", country: "Norway", tagline: "Fjords under the midnight sun.", price: "$2,690", imageUrl: "", href: "#" },
      { name: "Bali", country: "Indonesia", tagline: "Rice terraces and quiet beaches.", price: "$1,480", imageUrl: "", href: "#" },
      { name: "Patagonia", country: "Chile", tagline: "Glaciers, peaks and open sky.", price: "$3,120", imageUrl: "", href: "#" },
    ],
  },
  Component: GalleryDestinations,
})
