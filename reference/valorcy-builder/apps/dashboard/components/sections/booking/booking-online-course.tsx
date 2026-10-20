"use client"

import { BookOpen, Clock, Play, Users } from "lucide-react"
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
  HIGHLIGHT_SURFACE,
  ItemText,
  PropText,
  carried,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  kickerEyebrow,
  listOf,
  noteBlock,
  s,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Session = { title?: string; date?: string; time?: string; spots?: string }

/** Card title pre-migration pages rendered as hardcoded text. */
const INTAKE_TITLE_FALLBACK = "Choose your intake"

/**
 * Cohort — media-sidebar archetype.
 *
 * Course overview, headline stats and a preview video on the start side; a
 * narrow card of upcoming intakes with the enrol action on the end side. Two
 * slots, one per column.
 */
function BookingOnlineCourse ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
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
              // Lessons, duration and students read as one stats line.
              lessons: ({ instance: inst }) => (
                <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
                  {([["lessons", Play], ["duration", Clock], ["students", Users]] as const).map(([key, Icon]) => (
                    <span key={key} className="flex items-center gap-1.5">
                      <Icon className="size-4 text-primary" aria-hidden />
                      <PropText instance={inst} propKey={key} isPreview={isPreview} />
                    </span>
                  ))}
                </div>
              ),
              duration: carried,
              students: carried,
              // A cleared image hid the preview box entirely, as it always did.
              imageUrl: ({ instance: inst }) => inst.props.imageUrl === "" ? null : (
                <div className="relative mt-6">
                  <SectionMedia
                    instanceId={inst.id}
                    elementKey="course-img"
                    src={textOr(inst, "imageUrl", undefined)}
                    alt={textOr(inst, "imageAlt", textOr(inst, "headline", ""))}
                    ratio="video"
                    placeholder="landscape"
                    rounded="lg"
                    className="bg-muted"
                    isPreview={isPreview}
                  />
                  {/* Play affordance over the photo: a dark scrim in both themes. */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-black/60">
                      <Play className="size-6 fill-white text-white" />
                    </div>
                  </div>
                </div>
              ),
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
                intakeTitle: ({ instance: inst }) =>
                  textOr(inst, "intakeTitle", INTAKE_TITLE_FALLBACK) === "" ? null : (
                    <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BookOpen className="size-4 text-primary" aria-hidden />
                      <PropText instance={inst} propKey="intakeTitle" isPreview={isPreview} fallback={INTAKE_TITLE_FALLBACK} />
                    </p>
                  ),
                ctaLabel: ({ instance: inst }) => (
                  <FlatAction
                    instance={inst}
                    isPreview={isPreview}
                    elementId="ctaLabel"
                    arrow
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                  />
                ),
              }}
              renderItems={({ instance: inst }) => {
                const sessions = listOf<Session>(inst, "sessions")
                if (sessions.length === 0) return null
                return (
                  <div className="space-y-3">
                    {sessions.map((ses, i) => (
                      <div key={i} className={cn("rounded-xl border p-4", i === 0 ? cn("border-primary/50", HIGHLIGHT_SURFACE) : "border-border/60")}>
                        <ItemText as="p" instance={inst} collection="sessions" index={i} field="title" value={ses?.title} className="text-sm font-semibold text-foreground" isPreview={isPreview} />
                        <p className="mt-0.5 text-xs text-muted-foreground">{s(ses?.date)} · {s(ses?.time)}</p>
                        <p className="mt-1 text-xs font-medium text-primary">{s(ses?.spots)}</p>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingOnlineCourseSection = defineSection({
  id: "booking-online-course",
  displayName: "Cohort",
  description: "Course overview with stats and a preview video beside an intake picker and enrol action.",
  category: "booking",
  layoutArchetype: "media-sidebar",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["education", "online_course", "saas", "agency", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "sales", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["booking", "course", "education", "cohort", "enrol"],
  funnelStage: "decision",
  conversionWeight: 80,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "card", label: "Intake card" },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 24 }),
      headingBlock({ aiHint: "Course headline (3–6 words)", maxLength: 60 }),
      descriptionBlock({ aiHint: "Course overview (1–2 sentences)", maxLength: 180 }),
      noteBlock({ key: "lessons", label: "Lessons count", type: "text", aiHint: "e.g. 42 lessons", maxLength: 20, group: "content" }, { blockLabel: "Course stats" }),
      noteBlock({ key: "duration", label: "Duration", type: "text", aiHint: "e.g. 8 weeks", maxLength: 16, group: "content" }),
      noteBlock({ key: "students", label: "Student count", type: "text", aiHint: "e.g. 4,200 students", maxLength: 24, group: "content" }),
      {
        kind: "media",
        ratio: "video",
        placeholder: "landscape",
        fields: { src: { key: "imageUrl", label: "Course preview image", type: "image", group: "media" } },
      },
      noteBlock({ key: "intakeTitle", label: "Intake title", type: "text", canonical: "subheadline", maxLength: 40 }, { slot: "card" }),
      collectionBlock({
        key: "sessions",
        label: "Intake options",
        slot: "card",
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ title: "Cohort X", date: "Jan 1, 2026", time: "7:00 PM GMT", spots: "Open enrollment" }),
        itemFields: [
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "e.g. Cohort 12 — Live", maxLength: 40, group: "content" },
          { key: "date", label: "Start date", type: "text", aiHint: "e.g. Sep 15, 2025", maxLength: 24, group: "content" },
          { key: "time", label: "Time", type: "text", aiHint: "e.g. 7:00 PM GMT", maxLength: 24, group: "content" },
          { key: "spots", label: "Availability", type: "text", aiHint: "e.g. 18 spots left", maxLength: 30, group: "content" },
        ],
      }),
      noteBlock({ key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Enrol now", maxLength: 24, group: "cta" }, { slot: "card" }),
    ],
  },
  defaultProps: {
    eyebrow: "Live cohort",
    headline: "Master product design in eight weeks",
    description: "Weekly live sessions, hands-on projects and feedback from working designers — finish with a portfolio piece you are proud of.",
    lessons: "42 lessons",
    duration: "8 weeks",
    students: "4,200 students",
    intakeTitle: INTAKE_TITLE_FALLBACK,
    ctaLabel: "Enrol now",
    sessions: [
      { title: "Cohort 12 — Live", date: "Sep 15, 2026", time: "7:00 PM GMT", spots: "18 spots left" },
      { title: "Cohort 13 — Live", date: "Nov 3, 2026", time: "7:00 PM GMT", spots: "Open enrolment" },
      { title: "Self-paced", date: "Start any time", time: "Lifetime access", spots: "Always open" },
    ],
  },
  Component: BookingOnlineCourse,
})
