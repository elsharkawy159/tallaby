"use client"

import { Calendar, MapPin, Ticket } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  collectionBlock,
  eyebrowBlock,
  headingBlock,
  iconNote,
  kickerEyebrow,
  listOf,
  noteBlock,
  s,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type TicketTier = { name?: string; price?: string; description?: string; availability?: string }

/**
 * Box Office — priced-rows archetype.
 *
 * The headline beside the event's name, date and venue; below, one row per
 * ticket tier with what is included, its availability, price and a buy
 * action. Three slots: header copy, event meta, tiers.
 */
function BookingEventTickets ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="mb-10 grid gap-6 sm:grid-cols-[1fr_auto]">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            overrides={{ eyebrow: kickerEyebrow("mb-1", isPreview) }}
          />
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="meta"
            className="flex flex-col gap-1.5 text-sm text-muted-foreground"
            overrides={{
              eventName: iconNote("eventName", Ticket, "flex items-center gap-2 font-semibold text-foreground", "size-4 text-primary", isPreview),
              eventDate: iconNote("eventDate", Calendar, "flex items-center gap-2", "size-4", isPreview),
              eventLocation: iconNote("eventLocation", MapPin, "flex items-center gap-2", "size-4", isPreview),
            }}
          />
        </div>

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="tiers"
          className="flex flex-col"
          renderItems={({ instance: inst }) => {
            const tiers = listOf<TicketTier>(inst, "tiers")
            const ctaLabel = textOr(inst, "ctaLabel", "")
            if (tiers.length === 0) return null
            return (
              <div className="space-y-4">
                {tiers.map((tier, i) => {
                  const availability = s(tier?.availability)
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-6 rounded-2xl border p-5 transition hover:border-primary/40",
                        i === 1 ? "border-primary/50 bg-[color-mix(in_oklch,var(--primary)_4%,var(--card))]" : "border-border/60 bg-card"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <ItemText as="h3" instance={inst} collection="tiers" index={i} field="name" value={tier?.name} className="font-semibold text-foreground" isPreview={isPreview} />
                          <span className={cn("text-xs font-semibold", availability.includes("Limited") ? "text-warning-ink" : "text-success-ink")}>{availability}</span>
                        </div>
                        <ItemText as="p" instance={inst} collection="tiers" index={i} field="description" value={tier?.description} className="mt-0.5 text-sm text-muted-foreground" isPreview={isPreview} />
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-2xl font-semibold text-primary">{s(tier?.price)}</span>
                        <button type="button" className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                          {ctaLabel}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const bookingEventTicketsSection = defineSection({
  id: "booking-event-tickets",
  displayName: "Box Office",
  description: "Event ticket tiers — name, date and venue up top, then priced rows with inclusions and a buy action.",
  category: "booking",
  layoutArchetype: "priced-rows",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["event", "education", "saas", "agency", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "sales", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["booking", "tickets", "event", "conference"],
  funnelStage: "decision",
  conversionWeight: 82,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "meta", label: "Event details", eject: { direction: "column" } },
      { id: "tiers", label: "Ticket tiers" },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Ticket section headline (2–5 words)", maxLength: 50 }),
      noteBlock({ key: "eventName", label: "Event name", type: "text", canonical: "subheadline", aiHint: "Event name", maxLength: 50, group: "content" }, { slot: "meta" }),
      noteBlock({ key: "eventDate", label: "Date", type: "text", aiHint: "Event date(s)", maxLength: 40, group: "content" }, { slot: "meta" }),
      noteBlock({ key: "eventLocation", label: "Location", type: "text", canonical: "body", aiHint: "Venue and city", maxLength: 60, group: "content" }, { slot: "meta" }),
      collectionBlock({
        key: "tiers",
        label: "Ticket tiers",
        slot: "tiers",
        minItems: 1,
        maxItems: 5,
        newItem: () => ({ name: "Tier name", price: "$0", description: "What's included.", availability: "Available" }),
        itemFields: [
          { key: "name", label: "Tier name", type: "text", canonical: "headline", aiHint: "e.g. General Admission, VIP", maxLength: 30, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $49", maxLength: 12, group: "content" },
          { key: "description", label: "What's included", type: "textarea", canonical: "body", aiHint: "What this tier includes (1–2 sentences)", maxLength: 120, group: "content" },
          { key: "availability", label: "Availability", type: "text", aiHint: "e.g. Available or Limited — 24 left", maxLength: 30, group: "content" },
        ],
      }),
    ],
    settings: [
      { key: "ctaLabel", label: "Buy button label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Buy tickets", maxLength: 20, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "Tickets",
    headline: "Secure your seat",
    eventName: "Build Summit 2026",
    eventDate: "October 14–15, 2026",
    eventLocation: "Pier 27, San Francisco",
    ctaLabel: "Buy tickets",
    tiers: [
      { name: "General Admission", price: "$199", description: "Both days of talks, the expo floor and the evening social.", availability: "Available" },
      { name: "VIP", price: "$449", description: "Front-row seating, speaker lounge access and a recorded session library.", availability: "Limited — 24 left" },
      { name: "Workshop Pass", price: "$299", description: "General admission plus one hands-on workshop of your choice.", availability: "Available" },
    ],
  },
  Component: BookingEventTickets,
})
