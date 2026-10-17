"use client"

import { MapPin, Clock } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CENTERED_HEADER, ItemText, stretchItems } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type ItineraryDay = {
  day?: string
  title?: string
  description?: string
  highlights?: string
  location?: string
  duration?: string
}

/**
 * Voyage — zigzag archetype.
 *
 * A centered header over a day-by-day itinerary whose cards alternate sides of
 * a centre spine, each with a numbered node, highlights, location and
 * duration. On mobile the spine moves to the start edge.
 */
function ContentItinerary ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className={CENTERED_HEADER}
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const days = (inst.props.days as ItineraryDay[] | undefined) ?? []
            if (days.length === 0) return null
            return (
              <div className="relative mt-7 text-start">
                <div aria-hidden className="absolute start-8 top-0 h-full w-px bg-border/60 sm:start-1/2 sm:-translate-x-px" />
                <div className="space-y-10">
                  {days.map((day, i) => (
                    <div key={i} className={cn("relative flex gap-6 sm:gap-0", i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse")}>
                      <div
                        aria-hidden
                        className="absolute start-8 top-4 z-10 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-semibold text-primary-foreground sm:start-1/2"
                      >
                        {i + 1}
                      </div>
                      <div className={cn("ms-16 w-full sm:ms-0 sm:w-[calc(50%-2rem)]", i % 2 === 0 ? "sm:pe-12" : "sm:ps-12")}>
                        <div className="rounded-2xl border border-border bg-card p-5">
                          {day.day ? (
                            <ItemText
                              instance={inst}
                              collection="days"
                              index={i}
                              field="day"
                              value={day.day}
                              isPreview={isPreview}
                              className="text-xs font-semibold text-primary"
                            />
                          ) : null}
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="days"
                            index={i}
                            field="title"
                            value={day.title}
                            isPreview={isPreview}
                            className="mt-1 text-lg font-semibold text-foreground"
                          />
                          {day.description ? (
                            <ItemText
                              as="p"
                              instance={inst}
                              collection="days"
                              index={i}
                              field="description"
                              value={day.description}
                              isPreview={isPreview}
                              className="mt-2 text-sm leading-relaxed text-muted-foreground"
                            />
                          ) : null}
                          {day.highlights ? (
                            <ul className="mt-3 space-y-1">
                              {day.highlights.split("\n").filter(Boolean).map((h, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                                  {h}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-3">
                            {day.location ? (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3" aria-hidden /> {day.location}
                              </span>
                            ) : null}
                            {day.duration ? (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" aria-hidden /> {day.duration}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
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

export const contentItinerarySection = defineSection({
  id: "content-itinerary",
  displayName: "Voyage",
  description: "Day-by-day itinerary alternating either side of a centre spine, with highlights, location and duration.",
  category: "content",
  layoutArchetype: "zigzag",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["travel", "travel_agency", "tour_package"],
  styles: ["modern", "editorial", "minimal"],
  goals: ["engagement", "conversion", "education"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 70,
  trustWeight: 65,
  tags: ["itinerary", "travel", "timeline", "days", "schedule"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "items",
        key: "days",
        canonical: "steps",
        label: "Itinerary Days",
        pick: [],
        itemFields: [
          { key: "day", label: "Day label", type: "text", aiHint: "e.g. Day 1, Day 2", maxLength: 20 },
          { key: "title", label: "Day title", type: "text", canonical: "headline", maxLength: 60 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 200 },
          { key: "highlights", label: "Highlights (one per line)", type: "textarea", aiHint: "Bullet items separated by newlines", maxLength: 300 },
          { key: "location", label: "Location", type: "text", aiHint: "City or region", maxLength: 50 },
          { key: "duration", label: "Duration", type: "text", aiHint: "e.g. Full day, Half day", maxLength: 20 },
        ],
        minItems: 2,
        maxItems: 14,
        newItem: () => ({ day: "Day X", title: "Day title", description: "What happens today.", highlights: "", location: "", duration: "Full day" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "The itinerary",
    headline: "Three days in Lisbon, at an easy pace",
    description: "Small groups, local guides and enough free time to wander on your own.",
    days: [
      { day: "Day 1", title: "Arrival & riverside welcome", description: "Settle in, then an evening walk along the Tagus with a welcome dinner.", highlights: "Hotel check-in\nSunset at Praça do Comércio\nWelcome dinner", location: "Lisbon", duration: "Half day" },
      { day: "Day 2", title: "City & Culture", description: "Full-day exploration of historic neighbourhoods, viewpoints, and hidden gems.", highlights: "Alfama district walking tour\nSão Jorge Castle\nFado music evening", location: "Lisbon", duration: "Full day" },
      { day: "Day 3", title: "Sintra palaces", description: "A day trip into the hills to the fairy-tale palaces and gardens of Sintra.", highlights: "Pena Palace\nQuinta da Regaleira\nCoastal stop at Cabo da Roca", location: "Sintra", duration: "Full day" },
    ],
  },
  Component: ContentItinerary,
})
