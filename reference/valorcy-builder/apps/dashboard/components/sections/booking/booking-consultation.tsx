"use client"

import { Calendar, CheckCircle2, Clock } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FlatAction,
  ItemText,
  badgeEyebrow,
  carried,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  iconNote,
  listOf,
  noteBlock,
  propNote,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** Prompt pre-migration pages rendered as hardcoded text above the button. */
const ACTION_NOTE_FALLBACK = "Pick a date and time that works for you"

/** Perks were stored as plain strings; the inspector edits them as `{ value }`. */
type Perk = string | { value?: string }

/**
 * Diptych — contained archetype.
 *
 * One card, two panels split by a hairline: the consultation's details and
 * perks on the start side, a calendar prompt and the booking action on the end
 * side. The card is chrome; each panel is a slot.
 */
function BookingConsultation ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
              <SectionSlot
                instance={instance}
                definition={definition}
                isPreview={isPreview}
                slotId="copy"
                className="flex flex-col p-8 md:p-10"
                align="left"
                headingClassName={`${TYPE_H2_SM} text-foreground`}
                bodyClassName={`${TYPE_BODY} mt-3`}
                overrides={{
                  eyebrow: badgeEyebrow(isPreview, "mb-5"),
                  duration: iconNote("duration", Clock, "mt-6 flex items-center gap-3 text-sm text-muted-foreground", "size-4 shrink-0 text-primary", isPreview),
                  availability: iconNote("availability", Calendar, "mt-3 flex items-center gap-3 text-sm text-muted-foreground", "size-4 shrink-0 text-primary", isPreview),
                }}
                renderItems={({ instance: inst }) => {
                  const perks = listOf<Perk>(inst, "perks")
                  if (perks.length === 0) return null
                  return (
                    <ul className="mt-6 flex flex-col gap-2">
                      {perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                          {typeof perk === "string" ? (
                            <span>{perk}</span>
                          ) : (
                            <ItemText instance={inst} collection="perks" index={i} field="value" value={perk?.value} isPreview={isPreview} />
                          )}
                        </li>
                      ))}
                    </ul>
                  )
                }}
              />

              <div aria-hidden className="hidden bg-border/40 md:block" />

              <div className="flex flex-col items-center justify-center bg-muted/30 p-8 md:p-10">
                <div className="mx-auto mb-4 flex text-foreground">
                  <Calendar className="size-8" aria-hidden />
                </div>
                <SectionSlot
                  instance={instance}
                  definition={definition}
                  isPreview={isPreview}
                  slotId="action"
                  className="flex w-full flex-col items-center text-center"
                  overrides={{
                    actionNote: propNote("actionNote", "mb-6 text-sm text-muted-foreground", isPreview, { fallback: ACTION_NOTE_FALLBACK }),
                    ctaLabel: ({ instance: inst }) => (
                      <FlatAction
                        instance={inst}
                        isPreview={isPreview}
                        hrefProp="ctaHref"
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      />
                    ),
                    ctaHref: carried,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingConsultationSection = defineSection({
  id: "booking-consultation",
  displayName: "Diptych",
  description: "Two-panel card — consultation details and perks beside a calendar prompt and booking action.",
  category: "booking",
  layoutArchetype: "contained",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "finance", "medical", "law", "real_estate", "education", "other"],
  trustWeight: 35,
  conversionWeight: 82,
  funnelStage: "decision",
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "leads", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Details", isDefault: true },
      { id: "action", label: "Action", eject: { direction: "column" } },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label above headline (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Booking section headline (4–8 words)", maxLength: 70 }),
      descriptionBlock({ aiHint: "Brief description of the consultation (1–3 sentences)", maxLength: 250 }),
      noteBlock({ key: "duration", label: "Duration", type: "text", aiHint: "Call duration (e.g. 30 min)", maxLength: 20 }),
      noteBlock({ key: "availability", label: "Availability", type: "text", aiHint: "Available days/hours (e.g. Mon–Fri, 9am–5pm)", maxLength: 50 }),
      collectionBlock({
        key: "perks",
        label: "Perks",
        minItems: 0,
        maxItems: 5,
        newItem: () => ({ value: "No commitment required" }),
        itemFields: [{ key: "value", label: "Perk text", type: "text", aiHint: "Short benefit of booking (5–10 words)", maxLength: 60 }],
      }),
      noteBlock({ key: "actionNote", label: "Action prompt", type: "text", maxLength: 80 }, { slot: "action" }),
      noteBlock({ key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Book button label (1–4 words)", maxLength: 30, group: "cta" }, { slot: "action" }),
      noteBlock({ key: "ctaHref", label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" }, { slot: "action" }),
    ],
  },
  defaultProps: {
    eyebrow: "Free consultation",
    headline: "Talk it through with a specialist",
    description: "A focused session to understand your goals, answer your questions and map out sensible next steps — no obligation.",
    duration: "30 min · video or phone",
    availability: "Monday – Friday: 9am – 5pm",
    actionNote: ACTION_NOTE_FALLBACK,
    ctaLabel: "Schedule a call",
    ctaHref: "#",
    perks: [
      "A clear plan tailored to your situation",
      "Straight answers from an experienced advisor",
      "No commitment and no hard sell",
    ],
  },
  Component: BookingConsultation,
})
