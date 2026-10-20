"use client"

import { Calendar, Clock, Home, MapPin } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatAction,
  PropText,
  carried,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  kickerEyebrow,
  noteBlock,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** The picker's sample viewing times — presentational, as they always were. */
const VIEWING_SLOTS = ["Mon Jun 9, 10 AM", "Mon Jun 9, 2 PM", "Tue Jun 10, 11 AM", "Tue Jun 10, 4 PM", "Wed Jun 11, 10 AM", "Wed Jun 11, 2 PM"]

/** Picker title pre-migration pages rendered as hardcoded text. */
const SLOTS_TITLE_FALLBACK = "Available slots"

/**
 * Viewing — product-first archetype.
 *
 * The property leads: its photo, then the pitch, on the start side; a request
 * card with the listing summary, viewing-time picker and contact fields on the
 * end side. Two slots, one per column.
 */
function BookingPropertyTour ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2_SM} mt-1 text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-2`}
            overrides={{
              imageUrl: ({ instance: inst }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey="prop-img"
                  src={textOr(inst, "imageUrl", undefined)}
                  alt={textOr(inst, "imageAlt", textOr(inst, "propertyTitle", ""))}
                  ratio="video"
                  placeholder="landscape"
                  rounded="lg"
                  className="mb-6 aspect-[4/3] bg-muted"
                  isPreview={isPreview}
                />
              ),
              eyebrow: kickerEyebrow("", isPreview),
            }}
          />

          <div className="rounded-2xl border border-border bg-card p-6">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="card"
              className="flex flex-col"
              overrides={{
                // Title, address and price form one listing summary.
                propertyTitle: ({ instance: inst }) => (
                  <div className="mb-5 rounded-xl border border-border bg-background p-4">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      <Home className="size-4 text-primary" aria-hidden />
                      <PropText instance={inst} propKey="propertyTitle" isPreview={isPreview} />
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3" aria-hidden />
                      <PropText instance={inst} propKey="propertyAddress" isPreview={isPreview} />
                    </p>
                    <PropText instance={inst} propKey="propertyPrice" as="p" className="mt-1 text-lg font-semibold text-primary" isPreview={isPreview} />
                  </div>
                ),
                propertyAddress: carried,
                propertyPrice: carried,
                slotsTitle: ({ instance: inst }) =>
                  textOr(inst, "slotsTitle", SLOTS_TITLE_FALLBACK) === "" ? null : (
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Calendar className="size-4 text-primary" aria-hidden />
                      <PropText instance={inst} propKey="slotsTitle" isPreview={isPreview} fallback={SLOTS_TITLE_FALLBACK} />
                    </p>
                  ),
                ctaLabel: ({ instance: inst }) => (
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      {VIEWING_SLOTS.map((slot, i) => (
                        <button
                          key={slot}
                          type="button"
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:border-primary/60 hover:text-primary",
                            i === 0 ? "border-primary/60 bg-primary/8 font-semibold text-primary" : "border-border text-muted-foreground"
                          )}
                        >
                          <Clock className="size-3 shrink-0" aria-hidden />
                          {slot}
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 space-y-2.5">
                      <input readOnly placeholder="Your full name" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground" />
                      <input readOnly placeholder="Phone number" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground" />
                      <textarea readOnly placeholder="Any questions? (optional)" rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground" />
                      <FlatAction
                        instance={inst}
                        isPreview={isPreview}
                        elementId="ctaLabel"
                        arrow
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                      />
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingPropertyTourSection = defineSection({
  id: "booking-property-tour",
  displayName: "Viewing",
  description: "Property photo and pitch beside a viewing request card — listing summary, time slots and contact fields.",
  category: "booking",
  layoutArchetype: "product-first",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "interior_design"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "bookings", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 87,
  editable: true,
  tags: ["booking", "property", "viewing", "tour", "real-estate"],
  funnelStage: "decision",
  conversionWeight: 83,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Property", isDefault: true },
      { id: "card", label: "Viewing request" },
    ],
    blocks: [
      {
        kind: "media",
        ratio: "video",
        placeholder: "landscape",
        fields: { src: { key: "imageUrl", label: "Property photo", type: "image", group: "media" } },
      },
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Viewing headline (2–5 words)", maxLength: 50 }),
      descriptionBlock({ aiHint: "Viewing logistics note (1 sentence)", maxLength: 120 }),
      noteBlock({ key: "propertyTitle", label: "Property title", type: "text", canonical: "subheadline", aiHint: "Property name", maxLength: 60, group: "content" }, { slot: "card", blockLabel: "Listing summary" }),
      noteBlock({ key: "propertyAddress", label: "Address", type: "text", canonical: "body", aiHint: "Full address", maxLength: 80, group: "content" }, { slot: "card" }),
      noteBlock({ key: "propertyPrice", label: "Price", type: "text", aiHint: "e.g. $3,200,000", maxLength: 20, group: "content" }, { slot: "card" }),
      noteBlock({ key: "slotsTitle", label: "Time slots title", type: "text", canonical: "subheadline", maxLength: 40 }, { slot: "card" }),
      noteBlock({ key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Request viewing", maxLength: 24, group: "cta" }, { slot: "card", blockLabel: "Time slots & form" }),
    ],
  },
  defaultProps: {
    eyebrow: "Book a viewing",
    headline: "See it in person",
    description: "Viewings last about 30 minutes and an agent will meet you at the door.",
    propertyTitle: "Light-filled two-bed loft",
    propertyAddress: "48 Canal Street, Riverside",
    propertyPrice: "$2,850/mo",
    slotsTitle: SLOTS_TITLE_FALLBACK,
    ctaLabel: "Request viewing",
  },
  Component: BookingPropertyTour,
})
