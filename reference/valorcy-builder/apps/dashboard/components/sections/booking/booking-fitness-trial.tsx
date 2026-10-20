"use client"

import { Clock, Flame, Users } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
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
  listOf,
  s,
  stretchItems,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type ClassSlot = { name?: string; instructor?: string; day?: string; time?: string; duration?: string; intensity?: string; spotsLeft?: string }

/** Intensity pills on semantic status tokens, so both themes read correctly. */
const INTENSITY_COLOR: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning-soft text-warning-ink",
  Low: "bg-success-soft text-success-ink",
}

/**
 * Trial Pass — list archetype.
 *
 * A solid flame pill and centred pitch over a list of trial classes, each row
 * carrying coach, day and time, duration, an intensity pill, spots left and a
 * claim action. One slot; the rows are the `slots` collection.
 */
function BookingFitnessTrial ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2_SM} mt-3 text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-2`}
          overrides={{
            eyebrow: ({ instance: inst }) =>
              !textOr(inst, "eyebrow", undefined) ? null : (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  <Flame className="size-3.5" aria-hidden />
                  <PropText instance={inst} propKey="eyebrow" isPreview={isPreview} />
                </span>
              ),
          }}
          renderItems={({ instance: inst }) => {
            const rows = listOf<ClassSlot>(inst, "slots")
            if (rows.length === 0) return null
            return (
              <div className="mt-10 space-y-3">
                {rows.map((slot, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-primary/30">
                    <div className="grid flex-1 grid-cols-1 gap-y-0.5 sm:grid-cols-[1fr_auto]">
                      <div>
                        <ItemText as="p" instance={inst} collection="slots" index={i} field="name" value={slot?.name} className="font-semibold text-foreground" isPreview={isPreview} />
                        <p className="text-sm text-muted-foreground">{s(slot?.instructor)} · {s(slot?.day)} · {s(slot?.time)}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3.5" aria-hidden />{s(slot?.duration)}</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${INTENSITY_COLOR[s(slot?.intensity)] ?? "bg-muted text-muted-foreground"}`}>{s(slot?.intensity)}</span>
                        <span className="flex items-center gap-1 text-muted-foreground"><Users className="size-3.5" aria-hidden />{s(slot?.spotsLeft)} spots left</span>
                      </div>
                    </div>
                    <button type="button" className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                      <PropText instance={inst} propKey="ctaLabel" isPreview={isPreview} />
                     
                    </button>
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

export const bookingFitnessTrialSection = defineSection({
  id: "booking-fitness-trial",
  displayName: "Trial Pass",
  description: "Free-trial class list — coach, day and time, duration, intensity and spots left, with a claim action per class.",
  category: "booking",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["fitness", "physiotherapy", "other"],
  styles: ["modern", "bold", "minimal"],
  goals: ["leads", "bookings", "conversion"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["booking", "fitness", "class", "trial", "schedule"],
  funnelStage: "decision",
  conversionWeight: 80,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ label: "Eyebrow badge", aiHint: "Short label (1–3 words)", maxLength: 24 }),
      headingBlock({ aiHint: "Trial class headline (4–8 words)", maxLength: 70 }),
      descriptionBlock({ aiHint: "Short reassurance note (1 sentence)", maxLength: 120 }),
      collectionBlock({
        key: "slots",
        label: "Class slots",
        minItems: 1,
        maxItems: 10,
        newItem: () => ({ name: "Class name", instructor: "Instructor", day: "Monday", time: "8:00 AM", duration: "60 min", intensity: "Medium", spotsLeft: "5" }),
        itemFields: [
          { key: "name", label: "Class name", type: "text", canonical: "headline", aiHint: "Class name", maxLength: 40, group: "content" },
          { key: "instructor", label: "Instructor", type: "text", aiHint: "Coach name", maxLength: 30, group: "content" },
          { key: "day", label: "Day", type: "text", aiHint: "e.g. Monday", maxLength: 12, group: "content" },
          { key: "time", label: "Time", type: "text", aiHint: "e.g. 7:00 AM", maxLength: 10, group: "content" },
          { key: "duration", label: "Duration", type: "text", aiHint: "e.g. 60 min", maxLength: 10, group: "content" },
          { key: "intensity", label: "Intensity", type: "select", options: [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }], group: "content" },
          { key: "spotsLeft", label: "Spots left", type: "text", aiHint: "e.g. 6", maxLength: 4, group: "content" },
        ],
      }),
    ],
    settings: [
      { key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Button text (2–4 words)", maxLength: 24, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "First class free",
    headline: "Try any class on us this week",
    description: "No membership, no card required — just pick a class and turn up ten minutes early.",
    ctaLabel: "Claim spot",
    slots: [
      { name: "Metcon Express", instructor: "Coach Dana", day: "Monday", time: "7:00 AM", duration: "60 min", intensity: "High", spotsLeft: "4" },
      { name: "Strength Basics", instructor: "Coach Leo", day: "Monday", time: "9:30 AM", duration: "60 min", intensity: "Medium", spotsLeft: "8" },
      { name: "Sprint Intervals", instructor: "Coach Ana", day: "Wednesday", time: "6:30 AM", duration: "45 min", intensity: "High", spotsLeft: "3" },
      { name: "Lunchtime Mobility", instructor: "Coach Sam", day: "Thursday", time: "12:00 PM", duration: "50 min", intensity: "Low", spotsLeft: "6" },
    ],
  },
  Component: BookingFitnessTrial,
})
