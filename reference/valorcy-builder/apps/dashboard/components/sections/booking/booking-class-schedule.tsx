"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  listOf,
  noteBlock,
  propNote,
  s,
  stretchItems,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type ClassItem = { name?: string; instructor?: string; day?: string; time?: string; duration?: string; level?: string; spots?: string }

/** Level pills on semantic status tokens, so both themes read correctly. */
const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-success-soft text-success-ink",
  Intermediate: "bg-warning-soft text-warning-ink",
  Advanced: "bg-destructive/10 text-destructive",
  "All Levels": "bg-info-soft text-info-ink",
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"]

/**
 * Timetable — matrix archetype.
 *
 * A centred header over a full weekly timetable: one row per class with its
 * instructor, day, time, duration, level and a book action. The table is the
 * `classes` collection; the header lines and the footer note are slot entries.
 */
function BookingClassSchedule ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-center gap-5 text-center"
          entryClassName={stretchItems}
          align="center"
          overrides={{
            note: propNote("note", "text-center text-sm text-muted-foreground", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const classes = listOf<ClassItem>(inst, "classes")
            const ctaLabel = textOr(inst, "ctaLabel", "")
            return (
              <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card">
                <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 bg-muted/50 px-6 py-3 text-xs font-semibold text-muted-foreground md:grid">
                  <span>Class</span><span>Day</span><span>Time</span><span>Duration</span><span>Level</span><span>Action</span>
                </div>
                {classes.map((cls, i) => {
                  const text = (field: keyof ClassItem, className: string) => (
                    <ItemText as="div" instance={inst} collection="classes" index={i} field={field} value={cls[field]} className={className} isPreview={isPreview} />
                  )
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-1 items-center gap-3 border-t border-border px-6 py-5 transition-colors hover:bg-muted/30 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:gap-4"
                    >
                      <div>
                        {text("name", "font-semibold text-foreground")}
                        {text("instructor", "mt-0.5 text-sm text-muted-foreground")}
                      </div>
                      {text("day", "text-sm text-foreground md:text-center")}
                      {text("time", "text-sm text-foreground md:text-center")}
                      {text("duration", "text-sm text-muted-foreground md:text-center")}
                      <div className="md:text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${LEVEL_COLORS[s(cls.level)] ?? "bg-muted text-muted-foreground"}`}>
                          {s(cls.level)}
                        </span>
                      </div>
                      <a
                        href={isPreview ? "#" : undefined}
                        className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
                      >
                        {ctaLabel}
                      </a>
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

export const bookingClassScheduleSection = defineSection({
  id: "booking-class-schedule",
  displayName: "Timetable",
  description: "Weekly class timetable — instructor, day, time, duration and level, with a book action per row.",
  category: "booking",
  layoutArchetype: "matrix",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["fitness", "education", "event", "other"],
  trustWeight: 30,
  conversionWeight: 75,
  funnelStage: "decision",
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "conversion", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 78,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label above the headline", maxLength: 30 }),
      headingBlock({ aiHint: "Section headline (3–6 words)", maxLength: 60 }),
      descriptionBlock({ aiHint: "Brief description of the schedule or class offering", maxLength: 200 }),
      collectionBlock({
        key: "classes",
        label: "Classes",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ name: "New Class", instructor: "Instructor Name", day: "Monday", time: "9:00 AM", duration: "60 min", level: "All Levels", spots: "10" }),
        itemFields: [
          { key: "name", label: "Class name", type: "text", canonical: "headline", aiHint: "Class or session name (2–5 words)", maxLength: 50, group: "content" },
          { key: "instructor", label: "Instructor", type: "text", canonical: "body", aiHint: "Instructor full name", maxLength: 50, group: "content" },
          { key: "day", label: "Day", type: "select", options: DAYS.map((d) => ({ value: d, label: d })) },
          { key: "time", label: "Time", type: "text", aiHint: "Start time (e.g. 7:00 AM)", maxLength: 20 },
          { key: "duration", label: "Duration", type: "text", aiHint: "Class duration (e.g. 60 min)", maxLength: 20 },
          { key: "level", label: "Level", type: "select", options: LEVELS.map((l) => ({ value: l, label: l })) },
          { key: "spots", label: "Spots available", type: "text", aiHint: "Number of spots (optional)", maxLength: 10 },
        ],
      }),
      noteBlock({ key: "note", label: "Footer note (optional)", type: "text", aiHint: "Small print below the schedule", maxLength: 120 }),
    ],
    settings: [
      { key: "ctaLabel", label: "Book button label", type: "text", canonical: "ctaPrimary", aiHint: "Label for the per-row book button (3–5 words)", maxLength: 30, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "Weekly schedule",
    headline: "Find a class that fits your week",
    description: "Small groups, expert coaches and sessions for every level — reserve your spot in a couple of taps.",
    ctaLabel: "Book",
    note: "Spots are released seven days in advance. Late cancellations within 12 hours count as a visit.",
    classes: [
      { name: "Sunrise Vinyasa", instructor: "Maya Torres", day: "Monday", time: "7:00 AM", duration: "60 min", level: "All Levels", spots: "8" },
      { name: "Strength Foundations", instructor: "Jordan Lee", day: "Tuesday", time: "6:30 PM", duration: "45 min", level: "Intermediate", spots: "12" },
      { name: "Mobility & Breath", instructor: "Priya Shah", day: "Wednesday", time: "10:00 AM", duration: "50 min", level: "Beginner", spots: "6" },
      { name: "HIIT Circuit", instructor: "Sam Okafor", day: "Thursday", time: "7:00 PM", duration: "45 min", level: "Advanced", spots: "15" },
      { name: "Power Flow", instructor: "Maya Torres", day: "Friday", time: "6:00 PM", duration: "75 min", level: "All Levels", spots: "10" },
    ],
  },
  Component: BookingClassSchedule,
})
