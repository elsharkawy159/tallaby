"use client"

import { ArrowRight, Clock, Phone } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
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
  stretchItems,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CallOption = { duration?: string; label?: string; description?: string }

/** Prompt pre-migration pages rendered as hardcoded text before the number. */
const PHONE_PROMPT_FALLBACK = "Prefer phone? Call directly at"

/**
 * Dial — centered archetype.
 *
 * A narrow centred column: header, then the call lengths as selectable rows
 * with the second one marked as the popular choice, closed by a direct phone
 * line. One slot; the options are the `options` collection.
 */
function BookingCall ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-2xl">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-3`}
          overrides={{
            eyebrow: kickerEyebrow("mb-2", isPreview),
            // The prompt and the number read as one line.
            ctaLabel: ({ instance: inst }) => (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 text-primary" aria-hidden />
                <PropText instance={inst} propKey="phonePrompt" isPreview={isPreview} fallback={PHONE_PROMPT_FALLBACK} />
                <PropText instance={inst} propKey="ctaLabel" className="font-semibold text-foreground" isPreview={isPreview} />
              </div>
            ),
            phonePrompt: carried,
          }}
          renderItems={({ instance: inst }) => {
            const options = listOf<CallOption>(inst, "options")
            if (options.length === 0) return null
            return (
              <div className="mt-10 space-y-3">
                {options.map((opt, i) => {
                  const popular = i === 1
                  return (
                    <button
                      key={i}
                      type="button"
                      className={cn(
                        "group flex w-full items-center gap-5 rounded-2xl border px-6 py-5 text-start transition hover:border-primary/50",
                        popular ? cn("border-primary/60", HIGHLIGHT_SURFACE) : "border-border/60 bg-card"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-full border-2",
                          popular ? "border-primary text-primary" : "border-border text-muted-foreground"
                        )}
                      >
                        <Clock className="size-5" aria-hidden />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <ItemText instance={inst} collection="options" index={i} field="label" value={opt?.label} className="font-semibold text-foreground" isPreview={isPreview} />
                          <span className="text-xs font-medium text-muted-foreground">{s(opt?.duration)}</span>
                          {popular && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Popular</span>
                          )}
                        </div>
                        <ItemText as="p" instance={inst} collection="options" index={i} field="description" value={opt?.description} className="mt-0.5 text-sm text-muted-foreground" isPreview={isPreview} />
                      </div>
                      <ArrowRight className="size-5 shrink-0 text-muted-foreground/40 transition group-hover:text-primary rtl:rotate-180" aria-hidden />
                    </button>
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

export const bookingCallSection = defineSection({
  id: "booking-call",
  displayName: "Dial",
  description: "Call-length picker — selectable 15/30/60-minute options with a recommended pick and a direct line.",
  category: "booking",
  layoutArchetype: "centered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "law", "finance"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "bookings", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 93,
  editable: true,
  tags: ["booking", "call", "consultation", "schedule", "calendar"],
  funnelStage: "decision",
  conversionWeight: 80,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Call booking headline (4–8 words)", maxLength: 70 }),
      descriptionBlock({ aiHint: "Short booking note (1–2 sentences)", maxLength: 160 }),
      collectionBlock({
        key: "options",
        label: "Call options",
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ duration: "30 min", label: "Consultation", description: "Describe this call type." }),
        itemFields: [
          { key: "duration", label: "Duration", type: "text", aiHint: "e.g. 30 min", maxLength: 12, group: "content" },
          { key: "label", label: "Label", type: "text", canonical: "headline", aiHint: "Call type name (2–4 words)", maxLength: 40, group: "content" },
          { key: "description", label: "Description", type: "text", canonical: "body", aiHint: "What happens on this call (1 sentence)", maxLength: 100, group: "content" },
        ],
      }),
      noteBlock({ key: "phonePrompt", label: "Phone prompt", type: "text", maxLength: 60 }),
      noteBlock({ key: "ctaLabel", label: "Phone number", type: "text", aiHint: "Direct phone number", maxLength: 30, group: "cta" }, { blockLabel: "Direct line" }),
    ],
  },
  defaultProps: {
    eyebrow: "Schedule a call",
    headline: "Choose the call that fits",
    description: "Pick a length and we will send a calendar invite with everything you need to prepare.",
    phonePrompt: PHONE_PROMPT_FALLBACK,
    ctaLabel: "(555) 018-2040",
    options: [
      { duration: "15 min", label: "Quick intro", description: "A short chat to see whether we are the right fit." },
      { duration: "30 min", label: "Discovery call", description: "Walk us through your goals and we outline an approach." },
      { duration: "60 min", label: "Strategy session", description: "A deep dive with a senior lead and a written follow-up." },
    ],
  },
  Component: BookingCall,
})
