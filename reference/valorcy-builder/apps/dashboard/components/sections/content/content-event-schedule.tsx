"use client"

import { useState } from "react"
import { Clock, MapPin } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CENTERED_HEADER, ItemText, stretchItems } from "@/components/sections/content/content-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type Session = { time?: string; title?: string; speaker?: string; room?: string; track?: string; day?: string }

/**
 * Day tabs and session rows. Its own component because the active day is local
 * state, and `renderItems` is a render callback, not a component.
 */
function ScheduleBoard ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const sessions = (instance.props.sessions as Session[] | undefined) ?? []
  const days = [...new Set(sessions.map((s) => s.day).filter((d): d is string => Boolean(d)))]
  const [picked, setPicked] = useState<string | undefined>(undefined)
  const activeDay = picked && days.includes(picked) ? picked : (days[0] ?? "")

  if (sessions.length === 0) return null

  // Keep each row's index into the full collection, so edits land on the right item.
  const rows = sessions
    .map((session, index) => ({ session, index }))
    .filter(({ session }) => !activeDay || session.day === activeDay)

  return (
    <div className="w-full text-start">
      {days.length > 1 && (
        <div className="mt-3 flex justify-center gap-2" role="tablist">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={activeDay === day}
              onClick={() => setPicked(day)}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold transition-all",
                activeDay === day
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 space-y-3">
        {rows.map(({ session, index }) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-6"
          >
            {session.time ? (
              <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:w-28">
                <Clock className="size-3.5 shrink-0 text-primary" aria-hidden />
                <ItemText instance={instance} collection="sessions" index={index} field="time" value={session.time} isPreview={isPreview} />
              </div>
            ) : null}
            {session.track ? (
              <ItemText
                instance={instance}
                collection="sessions"
                index={index}
                field="track"
                value={session.track}
                isPreview={isPreview}
                className="hidden shrink-0 rounded-full bg-primary/[0.12] px-2.5 py-1 text-xs font-semibold text-primary sm:inline-block"
              />
            ) : null}
            <div className="flex-1">
              <ItemText
                as="p"
                instance={instance}
                collection="sessions"
                index={index}
                field="title"
                value={session.title}
                elementId={`title${index}`}
                isPreview={isPreview}
                className="font-semibold text-foreground"
              />
              {session.speaker ? (
                <ItemText
                  as="p"
                  instance={instance}
                  collection="sessions"
                  index={index}
                  field="speaker"
                  value={session.speaker}
                  isPreview={isPreview}
                  className="mt-0.5 text-sm text-muted-foreground"
                />
              ) : null}
            </div>
            {session.room ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <ItemText instance={instance} collection="sessions" index={index} field="room" value={session.room} isPreview={isPreview} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Agenda — tabs archetype.
 *
 * A centered header over a day-tabbed agenda: one row per session with time,
 * track chip, title, speaker and room. Tabs appear only when sessions span
 * more than one day.
 */
function ContentEventSchedule ({ instance, isPreview, definition }: SectionComponentProps) {
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
          renderItems={({ instance: inst }) => <ScheduleBoard instance={inst} isPreview={isPreview} />}
        />
      </SectionContainer>
    </section>
  )
}

export const contentEventScheduleSection = defineSection({
  id: "content-event-schedule",
  displayName: "Agenda",
  description: "Day-tabbed agenda — time, track, session title, speaker and room per row.",
  category: "content",
  layoutArchetype: "tabs",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["event", "education", "nonprofit", "saas"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["engagement", "conversion", "education"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 65,
  trustWeight: 70,
  tags: ["schedule", "agenda", "event", "conference", "sessions"],
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
        key: "sessions",
        canonical: "events",
        label: "Sessions",
        pick: [],
        itemFields: [
          { key: "day", label: "Day (for tab)", type: "text", aiHint: "e.g. Day 1, Day 2", maxLength: 20 },
          { key: "time", label: "Time", type: "text", aiHint: "e.g. 9:00 AM", maxLength: 20 },
          { key: "title", label: "Session title", type: "text", canonical: "headline", maxLength: 80 },
          { key: "speaker", label: "Speaker (optional)", type: "text", aiHint: "Name and affiliation", maxLength: 80 },
          { key: "room", label: "Room (optional)", type: "text", aiHint: "e.g. Main Stage, Room A", maxLength: 30 },
          { key: "track", label: "Track badge (optional)", type: "text", aiHint: "e.g. Keynote, Product, Marketing", maxLength: 30 },
        ],
        minItems: 1,
        maxItems: 30,
        newItem: () => ({ day: "Day 1", time: "9:00 AM", title: "Session title", speaker: "", room: "", track: "" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Agenda",
    headline: "Two days, one track at a time",
    description: "Every session is recorded, so you can focus on the ones you came for.",
    sessions: [
      { day: "Day 1", time: "9:00 AM", title: "Opening keynote: the next decade of work", speaker: "Priya Nair, Lumen", room: "Main Stage", track: "Keynote" },
      { day: "Day 1", time: "10:30 AM", title: "Roadmaps that survive contact with customers", speaker: "Tom Becker, Northwind", room: "Hall A", track: "Product" },
      { day: "Day 1", time: "11:30 AM", title: "Design systems at scale", speaker: "Aisha Kamara, Fieldstone", room: "Hall B", track: "Design" },
      { day: "Day 1", time: "2:00 PM", title: "Positioning for crowded markets", speaker: "Lucas Moreau, Harbor", room: "Hall A", track: "Marketing" },
      { day: "Day 2", time: "9:00 AM", title: "Building teams that ship weekly", speaker: "Sofia Lindqvist, Arcadia", room: "Main Stage", track: "Keynote" },
      { day: "Day 2", time: "10:30 AM", title: "Activation is the new acquisition", speaker: "Marcus Hale, Brightline", room: "Hall B", track: "Growth" },
    ],
  },
  Component: ContentEventSchedule,
})
