"use client"

import { Calendar, Car, Fuel, MapPin, Users } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  PropText,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  kickerEyebrow,
  listOf,
  s,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CarOption = { name?: string; category?: string; seats?: string; fuel?: string; pricePerDay?: string; image?: string }

/** The quick-search bar's sample values — presentational, as they always were. */
const SEARCH_FIELDS = [
  { Icon: MapPin, label: "Pickup location", value: "Heathrow Airport, T5" },
  { Icon: Calendar, label: "Pickup", value: "Jun 10 · 10:00" },
  { Icon: Calendar, label: "Return", value: "Jun 15 · 10:00" },
]

/**
 * Fleet — search-results archetype.
 *
 * Header, then a quick-search bar (pickup place and dates), then vehicle
 * cards as the results: photo with a category tag, seats, fuel, daily rate and
 * a book action. Two slots — header copy and the results.
 */
function BookingRentalCar ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="mb-8 flex flex-col"
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-1.5`}
          overrides={{ eyebrow: kickerEyebrow("mb-1", isPreview) }}
        />

        <div aria-hidden className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4">
          {SEARCH_FIELDS.map(({ Icon, label, value }, i) => (
            <div key={i} className="flex min-w-36 flex-1 items-center gap-2 text-sm">
              <Icon className="size-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
              </div>
            </div>
          ))}
          <span className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground">
            <Car className="size-4" />Search
          </span>
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="cars"
          className="flex flex-col"
          renderItems={({ instance: inst }) => {
            const cars = listOf<CarOption>(inst, "cars")
            if (cars.length === 0) return null
            return (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {cars.map((car, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30">
                    <div className="relative">
                      <SectionMedia
                        instanceId={inst.id}
                        elementKey={`car-${i}`}
                        src={s(car?.image)}
                        alt={s(car?.name)}
                        collectionKey="cars"
                        collectionIndex={i}
                        itemSrcProp="image"
                        ratio="video"
                        placeholder="landscape"
                        rounded="none"
                        className="bg-muted"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        isPreview={isPreview}
                      />
                      <span className="absolute start-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground">{s(car?.category)}</span>
                    </div>
                    <div className="p-5">
                      <ItemText as="h3" instance={inst} collection="cars" index={i} field="name" value={car?.name} className="font-semibold text-foreground" isPreview={isPreview} />
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="size-3.5" aria-hidden />{s(car?.seats)} seats</span>
                        <span className="flex items-center gap-1"><Fuel className="size-3.5" aria-hidden />{s(car?.fuel)}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-xl font-semibold text-primary">{s(car?.pricePerDay)}</span>
                          <span className="text-xs text-muted-foreground"> / day</span>
                        </div>
                        <button type="button" className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                          <PropText instance={inst} propKey="ctaLabel" isPreview={isPreview} />
                         
                        </button>
                      </div>
                    </div>
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

export const bookingRentalCarSection = defineSection({
  id: "booking-rental-car",
  displayName: "Fleet",
  description: "Car rental — a quick pickup/return search bar over vehicle cards with seats, fuel and daily rate.",
  category: "booking",
  layoutArchetype: "search-results",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["car_rental", "travel", "travel_agency", "other"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "sales", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 86,
  editable: true,
  tags: ["booking", "car", "rental", "vehicle", "transport"],
  funnelStage: "decision",
  conversionWeight: 80,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "cars", label: "Vehicles" },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 24 }),
      headingBlock({ aiHint: "Rental headline (2–5 words)", maxLength: 50 }),
      descriptionBlock({ aiHint: "Trust/policy note (1 sentence)", maxLength: 140 }),
      collectionBlock({
        key: "cars",
        label: "Vehicles",
        slot: "cars",
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ name: "Car model", category: "Economy", seats: "5", fuel: "Petrol", pricePerDay: "$50", image: "" }),
        itemFields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "name", label: "Make & model", type: "text", canonical: "headline", maxLength: 30, group: "content" },
          { key: "category", label: "Category", type: "text", aiHint: "e.g. Economy, Business, SUV", maxLength: 20, group: "content" },
          { key: "seats", label: "Seats", type: "text", maxLength: 4, group: "content" },
          { key: "fuel", label: "Fuel type", type: "text", aiHint: "e.g. Petrol, Electric, Hybrid", maxLength: 12, group: "content" },
          { key: "pricePerDay", label: "Price/day", type: "text", aiHint: "e.g. $45", maxLength: 12, group: "content" },
        ],
      }),
    ],
    settings: [
      { key: "ctaLabel", label: "Book button label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Book this car", maxLength: 20, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "Car hire",
    headline: "Find your ride",
    description: "Free cancellation up to 48 hours before pickup, with unlimited mileage on every rental.",
    ctaLabel: "Book",
    cars: [
      { name: "Volkswagen Golf", category: "Compact", seats: "5", fuel: "Petrol", pricePerDay: "$42", image: "" },
      { name: "Tesla Model 3", category: "Premium", seats: "5", fuel: "Electric", pricePerDay: "$89", image: "" },
      { name: "Toyota RAV4", category: "SUV", seats: "5", fuel: "Hybrid", pricePerDay: "$68", image: "" },
    ],
  },
  Component: BookingRentalCar,
})
