"use client"

import { Gauge, Fuel, Calendar } from "lucide-react"
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
  eyebrowBlock,
  headingBlock,
  itemsOf,
  kickerEyebrow,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Car = { title?: string; price?: string; year?: string; mileage?: string; fuel?: string; transmission?: string; image?: string; href?: string; badge?: string }

/**
 * Showroom — dense-grid archetype.
 *
 * A four-up inventory of compact vehicle cards: wide photo with a badge, then
 * make and model, price and a three-cell year / mileage / fuel strip.
 */
function ListingsCars ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const cars = itemsOf<Car>(inst, "cars")
            if (cars.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cars.map((car, i) => (
                  <a
                    key={i}
                    href={car.href || "#"}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <ItemPhoto
                        instance={inst}
                        collection="cars"
                        index={i}
                        src={car.image}
                        alt={car.title}
                        elementKey={`car-${i}`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500"
                      />
                      {car.badge && (
                        <span className="absolute start-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          {car.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="cars"
                        index={i}
                        field="title"
                        value={car.title}
                        isPreview={isPreview}
                        className="font-semibold leading-snug text-foreground"
                      />
                      <p className="mt-1.5 text-lg font-semibold text-primary">{txt(car.price)}</p>
                      <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="size-3" />{txt(car.year)}</span>
                        <span className="flex items-center gap-1"><Gauge className="size-3" />{txt(car.mileage)}</span>
                        <span className="flex items-center gap-1"><Fuel className="size-3" />{txt(car.fuel)}</span>
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

export const listingsCarsSection = defineSection({
  id: "listings-cars",
  displayName: "Showroom",
  description: "Four-up vehicle inventory cards with photo, price and a year / mileage / fuel strip.",
  category: "listings",
  layoutArchetype: "dense-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["car_rental", "other", "generic"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["sales", "leads", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["listings", "cars", "vehicles", "dealership", "inventory"],
  funnelStage: "consideration",
  conversionWeight: 65,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Inventory headline (3–6 words)", maxLength: 60 }),
      collectionBlock({
        key: "cars",
        label: "Vehicles",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ title: "Make Model", price: "$0", year: "2023", mileage: "0 mi", fuel: "Petrol", transmission: "Auto", image: "", href: "#", badge: "" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "badge", label: "Badge", type: "text", aiHint: "e.g. Certified Pre-Owned, Price reduced", maxLength: 25, group: "content" },
          { key: "title", label: "Make & model", type: "text", canonical: "headline", aiHint: "e.g. Porsche 911 Carrera S", maxLength: 60, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $49,900", maxLength: 16, group: "content" },
          { key: "year", label: "Year", type: "text", maxLength: 6, group: "content" },
          { key: "mileage", label: "Mileage", type: "text", aiHint: "e.g. 22,400 mi", maxLength: 16, group: "content" },
          { key: "fuel", label: "Fuel type", type: "text", aiHint: "e.g. Petrol, Diesel, Electric, Hybrid", maxLength: 12, group: "content" },
          { key: "transmission", label: "Transmission", type: "text", aiHint: "e.g. Auto, Manual", maxLength: 12, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "In stock now",
    headline: "Browse our latest arrivals",
    cars: [
      { title: "Audi A4 Avant 40 TFSI", price: "$38,900", year: "2022", mileage: "8,200 mi", fuel: "Petrol", transmission: "Auto", image: PHOTO, href: "#", badge: "Certified" },
      { title: "Tesla Model 3 Long Range", price: "$41,500", year: "2023", mileage: "4,100 mi", fuel: "Electric", transmission: "Auto", image: PHOTO, href: "#", badge: "" },
      { title: "BMW 330i M Sport", price: "$34,750", year: "2021", mileage: "22,400 mi", fuel: "Petrol", transmission: "Auto", image: PHOTO, href: "#", badge: "" },
      { title: "Toyota RAV4 Hybrid XLE", price: "$33,200", year: "2022", mileage: "15,600 mi", fuel: "Hybrid", transmission: "Auto", image: PHOTO, href: "#", badge: "Price reduced" },
    ],
  },
  Component: ListingsCars,
})
