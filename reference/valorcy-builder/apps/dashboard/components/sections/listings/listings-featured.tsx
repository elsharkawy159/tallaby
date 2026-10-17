"use client"

import { ArrowRight, MapPin } from "lucide-react"
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
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  itemsOf,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type FeaturedListing = { title?: string; price?: string; address?: string; description?: string; image?: string; href?: string; badge?: string; tag?: string }

/**
 * Keystone — bento archetype.
 *
 * One large lead property spanning two columns beside two compact side cards.
 * The first item is always the lead, so reordering the collection changes which
 * home is featured. Cards link to each item's detail route.
 */
function ListingsFeatured ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-start gap-5 text-start"
          entryClassName={stretchItems}
          align="left"
          renderItems={({ instance: inst }) => {
            const items = itemsOf<FeaturedListing>(inst, "items")
            const [featured, ...rest] = items
            if (!featured) return null
            return (
              <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <a
                  href={featured.href || "#"}
                  className="group relative col-span-1 overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <ItemPhoto
                      instance={inst}
                      collection="items"
                      index={0}
                      src={featured.image}
                      alt={featured.title}
                      elementKey="img-0"
                      className="absolute inset-0 size-full object-cover transition-transform duration-300"
                      empty={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Property photo</div>}
                    />
                    {featured.badge && (
                      <span className="absolute start-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {featured.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="items"
                          index={0}
                          field="title"
                          value={featured.title}
                          elementId="title0"
                          isPreview={isPreview}
                          className="text-xl font-semibold text-foreground"
                        />
                        {featured.address && (
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" /> {featured.address}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xl font-semibold text-primary">{txt(featured.price)}</span>
                    </div>
                    {featured.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{featured.description}</p>
                    )}
                  </div>
                </a>

                <div className="flex flex-col gap-6">
                  {rest.slice(0, 2).map((item, i) => {
                    const idx = i + 1
                    return (
                      <a
                        key={idx}
                        href={item.href || "#"}
                        className="group flex overflow-hidden rounded-2xl border border-border bg-card transition-all"
                      >
                        <div className="relative w-32 shrink-0 overflow-hidden bg-muted sm:w-36">
                          <ItemPhoto
                            instance={inst}
                            collection="items"
                            index={idx}
                            src={item.image}
                            alt={item.title}
                            elementKey={`img-${idx}`}
                            className="absolute inset-0 size-full object-cover transition-transform duration-300"
                            empty={<div className="flex h-full items-center justify-center text-xs text-muted-foreground">Photo</div>}
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <ItemText
                              as="h3"
                              instance={inst}
                              collection="items"
                              index={idx}
                              field="title"
                              value={item.title}
                              elementId={`title${idx}`}
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
                            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const listingsFeaturedSection = defineSection({
  id: "listings-featured",
  displayName: "Keystone",
  description: "One large lead property beside two compact side cards — a real estate homepage showcase.",
  category: "listings",
  layoutArchetype: "bento",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "interior_design", "architecture"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "sales", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 85,
  trustWeight: 65,
  tags: ["listings", "real-estate", "featured", "properties", "showcase"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ maxLength: 70 }),
      descriptionBlock({ label: "Subheading", maxLength: 160 }),
      collectionBlock({
        key: "items",
        label: "Listings",
        minItems: 1,
        maxItems: 3,
        newItem: () => ({ title: "Property name", price: "$0", address: "", description: "", image: "", href: "#", badge: "", tag: "" }),
        fields: [
          { key: "title", label: "Property title", type: "text", canonical: "headline", maxLength: 70 },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $1,250,000", maxLength: 20 },
          { key: "address", label: "Address", type: "text", aiHint: "Street address", maxLength: 100 },
          { key: "description", label: "Short description", type: "textarea", canonical: "body", maxLength: 160 },
          { key: "image", label: "Property photo", type: "image", canonical: "image" },
          { key: "href", label: "Listing link", type: "url", canonical: "ctaLink" },
          { key: "badge", label: "Status badge (optional)", type: "text", aiHint: "e.g. Exclusive, Open House", maxLength: 20 },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "This week's highlights",
    headline: "Homes worth a closer look",
    description: "Our agents' picks of the newest and most distinctive properties on the market right now.",
    items: [
      { title: "Light-filled villa with private pool", price: "$1,450,000", address: "3 Cypress Lane, Westhill", description: "Four bedrooms, open-plan living and a landscaped garden that opens onto a heated pool.", image: PHOTO, href: "#", badge: "Exclusive", tag: "" },
      { title: "Corner loft in the arts district", price: "$720,000", address: "61 Foundry Street, Unit 4", description: "", image: PHOTO, href: "#", badge: "", tag: "" },
      { title: "Quiet cottage near the river", price: "$545,000", address: "19 Mill Road, Brookside", description: "", image: PHOTO, href: "#", badge: "Open house", tag: "" },
    ],
  },
  Component: ListingsFeatured,
})
