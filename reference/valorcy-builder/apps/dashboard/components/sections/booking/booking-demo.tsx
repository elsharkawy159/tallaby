"use client"

import { CheckCircle, Clock, Video } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatAction,
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
  propNote,
  s,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Slot = { day?: string; times?: string[] }
type Benefit = { text?: string }

/**
 * The picker's days. Stored under `slots` but never inspector-editable; pages
 * that lack the prop rendered these, so they still do.
 */
const DEFAULT_SLOTS: Slot[] = [
  { day: "Mon Jun 9", times: ["9:00 AM", "11:00 AM", "2:00 PM"] },
  { day: "Tue Jun 10", times: ["10:00 AM", "1:00 PM", "3:00 PM"] },
  { day: "Wed Jun 11", times: ["9:00 AM", "11:00 AM", "4:00 PM"] },
]

/** Card title pre-migration pages rendered as hardcoded text. */
const PICKER_TITLE_FALLBACK = "Pick a time that works for you"

/**
 * Walkthrough — slot-picker archetype.
 *
 * The demo's value — duration, format and benefits — on the start side; a
 * scheduler card with day-grouped time slots, name and email on the end side.
 * The scheduler is presentational chrome drawn with the `ctaLabel` button.
 */
function BookingDemo ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-3`}
            overrides={{
              eyebrow: kickerEyebrow("mb-2", isPreview),
              // Duration and format share one meta row.
              duration: ({ instance: inst }) => (
                <div className="mt-5 flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" aria-hidden />
                    <PropText instance={inst} propKey="duration" isPreview={isPreview} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video className="size-4 text-primary" aria-hidden />
                    <PropText instance={inst} propKey="format" isPreview={isPreview} />
                  </span>
                </div>
              ),
              format: carried,
            }}
            renderItems={({ instance: inst }) => {
              const benefits = listOf<Benefit>(inst, "benefits")
              if (benefits.length === 0) return null
              return (
                <ul className="mt-7 space-y-3">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle className="size-5 shrink-0 text-primary" aria-hidden />
                      <ItemText instance={inst} collection="benefits" index={i} field="text" value={b?.text} isPreview={isPreview} />
                    </li>
                  ))}
                </ul>
              )
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
                pickerTitle: propNote("pickerTitle", "mb-4 text-sm font-semibold text-foreground", isPreview, { fallback: PICKER_TITLE_FALLBACK }),
                ctaLabel: ({ instance: inst }) => {
                  const slots = listOf<Slot>(inst, "slots", DEFAULT_SLOTS)
                  return (
                    <div>
                      <div className="space-y-4">
                        {slots.map((slot, si) => (
                          <div key={si}>
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">{s(slot?.day)}</p>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(slot?.times) ? slot.times : []).map((t, ti) => {
                                const active = ti === 0 && si === 0
                                return (
                                  <button
                                    key={ti}
                                    type="button"
                                    className={cn(
                                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:border-primary/60 hover:text-primary",
                                      active ? "border-primary/60 bg-primary/8 font-semibold text-primary" : "border-border text-muted-foreground"
                                    )}
                                  >
                                    {t}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 space-y-3">
                        <input readOnly placeholder="Your name" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground" />
                        <input readOnly placeholder="Work email" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground" />
                        <FlatAction
                          instance={inst}
                          isPreview={isPreview}
                          elementId="ctaLabel"
                          arrow
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                        />
                      </div>
                    </div>
                  )
                },
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingDemoSection = defineSection({
  id: "booking-demo",
  displayName: "Walkthrough",
  description: "Demo scheduler — value props and duration beside a time-slot picker with name and email.",
  category: "booking",
  layoutArchetype: "slot-picker",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "software", "tech", "enterprise", "agency"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "conversion", "bookings"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["booking", "demo", "saas", "calendar", "schedule"],
  funnelStage: "decision",
  conversionWeight: 85,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "card", label: "Scheduler" },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Demo section headline (3–6 words)", maxLength: 60 }),
      descriptionBlock({ aiHint: "Demo description (1–2 sentences)", maxLength: 180 }),
      noteBlock({ key: "duration", label: "Duration", type: "text", aiHint: "e.g. 30 min", maxLength: 12, group: "content" }, { blockLabel: "Duration & format" }),
      noteBlock({ key: "format", label: "Format", type: "text", aiHint: "e.g. Video call, Phone, In-person", maxLength: 20, group: "content" }),
      collectionBlock({
        key: "benefits",
        label: "Benefits",
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ text: "Benefit statement" }),
        itemFields: [{ key: "text", label: "Benefit", type: "text", canonical: "body", aiHint: "Short benefit (5–10 words)", maxLength: 80, group: "content" }],
      }),
      noteBlock({ key: "pickerTitle", label: "Scheduler title", type: "text", canonical: "subheadline", maxLength: 50 }, { slot: "card" }),
      noteBlock({ key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Button text (2–3 words)", maxLength: 24, group: "cta" }, { slot: "card", blockLabel: "Time slots & button" }),
    ],
  },
  defaultProps: {
    eyebrow: "Live demo",
    headline: "See the platform in action",
    description: "A product specialist walks you through the features that matter to your team and answers every question along the way.",
    duration: "30 min",
    format: "Video call",
    pickerTitle: PICKER_TITLE_FALLBACK,
    ctaLabel: "Book my demo",
    slots: DEFAULT_SLOTS,
    benefits: [
      { text: "A tour tailored to your use case" },
      { text: "Pricing and rollout questions answered" },
      { text: "Migration plan for your existing tools" },
      { text: "No commitment, no pressure" },
    ],
  },
  Component: BookingDemo,
})
