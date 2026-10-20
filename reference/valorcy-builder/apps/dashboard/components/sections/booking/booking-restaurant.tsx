"use client"

import { Calendar, Clock, Users } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatAction,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  kickerEyebrow,
  noteBlock,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ROW = "flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"

/**
 * Reserve — editorial archetype.
 *
 * Food photography on the start side; the pitch and a reservation card (date,
 * time, party size, requests) on the end side. The reservation fields are
 * presentational chrome drawn with the `ctaLabel` button, so they stay one unit.
 */
function BookingRestaurant ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            overrides={{
              imageUrl: ({ instance: inst }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey="rest-img"
                  src={textOr(inst, "imageUrl", undefined)}
                  alt={textOr(inst, "imageAlt", textOr(inst, "headline", ""))}
                  ratio="video"
                  placeholder="landscape"
                  rounded="xl"
                  className="aspect-[4/3] bg-muted"
                  isPreview={isPreview}
                />
              ),
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-3`}
            overrides={{
              eyebrow: kickerEyebrow("mb-2", isPreview),
              ctaLabel: ({ instance: inst }) => (
                <div className="mt-7 space-y-3">
                  <div className={ROW}>
                    <Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="text-sm text-muted-foreground">Select date</span>
                    <span className="ms-auto text-sm font-medium text-foreground">Tuesday, Jun 10</span>
                  </div>
                  <div className={ROW}>
                    <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="text-sm text-muted-foreground">Select time</span>
                    <span className="ms-auto text-sm font-medium text-foreground">7:30 PM</span>
                  </div>
                  <div className={ROW}>
                    <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="text-sm text-muted-foreground">Party size</span>
                    <span className="ms-auto text-sm font-medium text-foreground">2 guests</span>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="mb-1 text-xs text-muted-foreground">Special requests (optional)</p>
                    <p className="text-sm text-muted-foreground/60">Anniversary, allergies, dietary needs…</p>
                  </div>
                  <FlatAction
                    instance={inst}
                    isPreview={isPreview}
                    elementId="ctaLabel"
                    arrow
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                  />
                </div>
              ),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingRestaurantSection = defineSection({
  id: "booking-restaurant",
  displayName: "Reserve",
  description: "Food photography beside a reservation card for date, time, party size and special requests.",
  category: "booking",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "cafe", "catering", "hotel"],
  styles: ["modern", "editorial", "minimal"],
  goals: ["bookings", "conversion", "sales"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["booking", "restaurant", "reservation", "table"],
  funnelStage: "decision",
  conversionWeight: 80,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "media", label: "Photo", accepts: ["media"], max: 1, acceptsElements: false },
      { id: "copy", label: "Reservation", isDefault: true },
    ],
    blocks: [
      {
        kind: "media",
        slot: "media",
        ratio: "video",
        placeholder: "landscape",
        fields: { src: { key: "imageUrl", label: "Photo", type: "image", group: "media" } },
      },
      eyebrowBlock({ aiHint: "Short label (1–2 words)", maxLength: 20 }),
      headingBlock({ aiHint: "Reservation headline (3–6 words)", maxLength: 60 }),
      descriptionBlock({ aiHint: "Booking policy or note (1–2 sentences)", maxLength: 180 }),
      noteBlock(
        { key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Button text (2–3 words)", maxLength: 24, group: "cta" },
        { blockLabel: "Reservation card" }
      ),
    ],
  },
  defaultProps: {
    eyebrow: "Reservations",
    headline: "Save your table for tonight",
    description: "We hold tables for 15 minutes past the booking time. For parties of eight or more, call us and we will plan the evening with you.",
    ctaLabel: "Reserve a table",
  },
  Component: BookingRestaurant,
})
