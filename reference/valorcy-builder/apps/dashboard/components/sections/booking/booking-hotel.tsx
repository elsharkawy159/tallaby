"use client"

import { BedDouble, Calendar, Star, Users } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  PropText,
  collectionBlock,
  headingBlock,
  listOf,
  noteBlock,
  s,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type RoomType = { name?: string; description?: string; pricePerNight?: string; maxGuests?: string; image?: string }

/**
 * Suite — media-cards archetype.
 *
 * The property name and star rating beside a decorative date/guest bar, then
 * one card per room type: photo, amenities, nightly rate, capacity and a book
 * action. Two slots: header copy and the room cards.
 */
function BookingHotel ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            overrides={{
              // Name and star rating share one line.
              hotelName: ({ instance: inst }) => {
                const stars = Math.max(0, Math.min(5, Math.round(Number(inst.props.stars ?? 5)) || 0))
                return (
                  <div className="mt-1.5 flex items-center gap-2">
                    <PropText instance={inst} propKey="hotelName" className="text-sm font-medium text-foreground" isPreview={isPreview} />
                    <span className="flex text-accent">
                      {Array.from({ length: stars }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-current" aria-hidden />
                      ))}
                    </span>
                  </div>
                )
              },
            }}
          />
          <div aria-hidden className="flex gap-3 text-sm">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-muted-foreground">
              <Calendar className="size-4" />Check-in
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-muted-foreground">
              <Calendar className="size-4" />Check-out
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-muted-foreground">
              <Users className="size-4" />Guests
            </div>
          </div>
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="rooms"
          className="flex flex-col"
          renderItems={({ instance: inst }) => {
            const rooms = listOf<RoomType>(inst, "rooms")
            const ctaLabel = textOr(inst, "ctaLabel", "Book this room")
            if (rooms.length === 0) return null
            return (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {rooms.map((room, i) => (
                  <div key={i} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30">
                    <SectionMedia
                      instanceId={inst.id}
                      elementKey={`room-${i}`}
                      src={s(room?.image)}
                      alt={s(room?.name)}
                      collectionKey="rooms"
                      collectionIndex={i}
                      itemSrcProp="image"
                      ratio="video"
                      placeholder="landscape"
                      rounded="none"
                      className="aspect-[4/3] bg-muted"
                      imgClassName="transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      isPreview={isPreview}
                    />
                    <div className="p-5">
                      <ItemText as="h3" instance={inst} collection="rooms" index={i} field="name" value={room?.name} className="font-semibold text-foreground" isPreview={isPreview} />
                      <ItemText as="p" instance={inst} collection="rooms" index={i} field="description" value={room?.description} className="mt-1 text-sm text-muted-foreground" isPreview={isPreview} />
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-xl font-semibold text-primary">{s(room?.pricePerNight)}</span>
                          <span className="text-xs text-muted-foreground"> / night</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BedDouble className="size-3.5" aria-hidden />Up to {s(room?.maxGuests)} guests
                        </span>
                      </div>
                      <button type="button" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                        {ctaLabel}
                      </button>
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

export const bookingHotelSection = defineSection({
  id: "booking-hotel",
  displayName: "Suite",
  description: "Room-type cards with photo, amenities, nightly rate, capacity and a book action per room.",
  category: "booking",
  layoutArchetype: "media-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["hotel", "travel", "travel_agency", "real_estate"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "sales", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["booking", "hotel", "room", "accommodation"],
  funnelStage: "decision",
  conversionWeight: 82,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "rooms", label: "Rooms" },
    ],
    blocks: [
      headingBlock({ aiHint: "Booking headline (3–5 words)", maxLength: 50 }),
      noteBlock({ key: "hotelName", label: "Hotel name", type: "text", canonical: "subheadline", aiHint: "Hotel name", maxLength: 60, group: "content" }, { blockLabel: "Hotel name & rating" }),
      collectionBlock({
        key: "rooms",
        label: "Room types",
        slot: "rooms",
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ name: "Room type", description: "Description.", pricePerNight: "$0", maxGuests: "2", image: "" }),
        itemFields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "name", label: "Room name", type: "text", canonical: "headline", aiHint: "Room type name", maxLength: 40, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "Room amenities (1 sentence)", maxLength: 120, group: "content" },
          { key: "pricePerNight", label: "Price / night", type: "text", aiHint: "e.g. $320", maxLength: 12, group: "content" },
          { key: "maxGuests", label: "Max guests", type: "text", aiHint: "e.g. 2", maxLength: 4, group: "content" },
        ],
      }),
    ],
    settings: [
      { key: "stars", label: "Star rating", type: "number", min: 1, max: 5, group: "content" },
      { key: "ctaLabel", label: "Book button label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Book this room", maxLength: 24, group: "cta" },
    ],
  },
  defaultProps: {
    headline: "Choose your room",
    hotelName: "The Harbour House",
    stars: 5,
    ctaLabel: "Book this room",
    rooms: [
      { name: "Classic King", description: "A calm retreat with a king bed, rain shower and city views.", pricePerNight: "$240", maxGuests: "2", image: "" },
      { name: "Harbour Suite", description: "Separate lounge, soaking tub and a private balcony over the water.", pricePerNight: "$420", maxGuests: "2", image: "" },
      { name: "Family Room", description: "Two queen beds, a reading nook and space for the whole crew.", pricePerNight: "$310", maxGuests: "4", image: "" },
    ],
  },
  Component: BookingHotel,
})
