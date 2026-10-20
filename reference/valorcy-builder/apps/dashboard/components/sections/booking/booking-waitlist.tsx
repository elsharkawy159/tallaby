"use client"

import { Clock, Users } from "lucide-react"
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
  listOf,
  noteBlock,
  stretchItems,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Perk = { text?: string }

/**
 * Vanguard — floating archetype.
 *
 * A narrow centred column over a soft brand wash: a sparkle pill, the pitch, an
 * email capture row, a live count with the launch estimate, and founding-member
 * perks. The capture row and the meta row each draw two blocks as one line.
 */
function BookingWaitlist ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section
      style={{
        ...rootStyle,
        ...(!rootStyle.background && !rootStyle.backgroundColor
          ? { background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 6%, var(--background)), var(--background))" }
          : {}),
      }}
    >
      <SectionContainer className="max-w-xl text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} mt-4 text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-4`}
          overrides={{
            eyebrow: ({ instance: inst }) =>
              !textOr(inst, "eyebrow", undefined) ? null : (
                <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <PropText instance={inst} propKey="eyebrow" isPreview={isPreview} />
                </div>
              ),
            // Field and button form one capture row.
            ctaLabel: ({ instance: inst }) => (
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                <input
                  readOnly
                  placeholder={textOr(inst, "emailPlaceholder", "")}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground"
                />
                <FlatAction
                  instance={inst}
                  isPreview={isPreview}
                  elementId="ctaLabel"
                  arrow
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                />
              </div>
            ),
            emailPlaceholder: carried,
            // Count and launch estimate share one meta line.
            waitlistCount: ({ instance: inst }) => (
              <div className="mt-4 flex items-center justify-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden />
                  <PropText instance={inst} propKey="waitlistCount" isPreview={isPreview} />
                </span>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  <PropText instance={inst} propKey="estimatedLaunch" isPreview={isPreview} />
                </span>
              </div>
            ),
            estimatedLaunch: carried,
          }}
          renderItems={({ instance: inst }) => {
            const perks = listOf<Perk>(inst, "perks")
            if (perks.length === 0) return null
            return (
              <ul className="mt-8 grid grid-cols-1 gap-2 text-start sm:grid-cols-2">
                {perks.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm text-foreground">
                    <div aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
                    <ItemText instance={inst} collection="perks" index={i} field="text" value={p?.text} isPreview={isPreview} />
                  </li>
                ))}
              </ul>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const bookingWaitlistSection = defineSection({
  id: "booking-waitlist",
  displayName: "Vanguard",
  description: "Pre-launch capture — email signup, live count, launch estimate and founding-member perks.",
  category: "booking",
  layoutArchetype: "floating",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "app_landing", "ai_startup", "tech", "generic"],
  styles: ["modern", "minimal"],
  goals: ["leads", "conversion", "engagement"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 94,
  editable: true,
  tags: ["booking", "waitlist", "early-access", "launch", "signup"],
  funnelStage: "decision",
  conversionWeight: 88,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ label: "Eyebrow badge", aiHint: "Short label (1–3 words)", maxLength: 24 }),
      headingBlock({ aiHint: "Waitlist headline (3–6 words)", maxLength: 60 }),
      descriptionBlock({ aiHint: "Short urgency statement (1–2 sentences)", maxLength: 160 }),
      noteBlock({ key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Button text (2–4 words)", maxLength: 30, group: "cta" }, { blockLabel: "Signup row" }),
      noteBlock({ key: "emailPlaceholder", label: "Email placeholder", type: "text", group: "cta" }),
      noteBlock({ key: "waitlistCount", label: "Waitlist count", type: "text", aiHint: "e.g. 2,400+ people waiting", maxLength: 30, group: "content" }, { blockLabel: "Count & launch" }),
      noteBlock({ key: "estimatedLaunch", label: "Launch estimate", type: "text", aiHint: "e.g. Launching Q3 2025", maxLength: 30, group: "content" }),
      collectionBlock({
        key: "perks",
        label: "Perks",
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ text: "Early access benefit" }),
        itemFields: [{ key: "text", label: "Perk", type: "text", canonical: "body", aiHint: "Early access benefit (4–10 words)", maxLength: 70, group: "content" }],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Early access",
    headline: "Be first in line at launch",
    description: "Founding members get in before everyone else — and keep their launch pricing for life.",
    waitlistCount: "2,400+ on the list",
    estimatedLaunch: "Launching this spring",
    emailPlaceholder: "you@company.com",
    ctaLabel: "Join the waitlist",
    perks: [
      { text: "Priority access before public launch" },
      { text: "Founding-member pricing locked in" },
      { text: "A direct line to the product team" },
      { text: "Exclusive onboarding session" },
    ],
  },
  Component: BookingWaitlist,
})
