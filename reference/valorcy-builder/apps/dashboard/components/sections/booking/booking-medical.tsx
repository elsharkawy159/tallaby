"use client"

import { Clock, Phone, Shield } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
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
  s,
  stretchItems,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type AppointmentType = { name?: string; duration?: string; description?: string; price?: string }

/**
 * Clinic — stacked archetype.
 *
 * One narrow column: the header, the appointment types each with a duration and
 * fee, then two ways in — book online or call the clinic. One slot; the two
 * actions draw as one row.
 */
function BookingMedical ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-2xl">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-2`}
          overrides={{
            eyebrow: kickerEyebrow("mb-1", isPreview),
            // Online booking and the phone line sit side by side.
            ctaLabel: ({ instance: inst }) => (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <FlatAction
                  instance={inst}
                  isPreview={isPreview}
                  elementId="ctaLabel"
                  arrow
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                />
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm text-foreground">
                  <Phone className="size-4 text-primary" aria-hidden />
                  <PropText instance={inst} propKey="phone" className="font-medium" isPreview={isPreview} />
                </div>
              </div>
            ),
            phone: carried,
          }}
          renderItems={({ instance: inst }) => {
            const types = listOf<AppointmentType>(inst, "types")
            if (types.length === 0) return null
            return (
              <div className="mt-10 space-y-3">
                {types.map((t, i) => (
                  <div key={i} className="flex items-start gap-5 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30">
                    <div className="flex shrink-0 text-foreground">
                      <Shield className="size-5" aria-hidden />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <ItemText as="h3" instance={inst} collection="types" index={i} field="name" value={t?.name} className="font-semibold text-foreground" isPreview={isPreview} />
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" aria-hidden />{s(t?.duration)}</span>
                      </div>
                      <ItemText as="p" instance={inst} collection="types" index={i} field="description" value={t?.description} className="mt-0.5 text-sm text-muted-foreground" isPreview={isPreview} />
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="font-semibold text-primary">{s(t?.price)}</p>
                    </div>
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

export const bookingMedicalSection = defineSection({
  id: "booking-medical",
  displayName: "Clinic",
  description: "Appointment types with duration and fee, closed by online booking beside the clinic's phone line.",
  category: "booking",
  layoutArchetype: "stacked",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["medical", "dentist", "physiotherapy", "nutritionist", "therapy"],
  styles: ["minimal", "modern", "corporate"],
  goals: ["bookings", "leads", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 93,
  editable: true,
  tags: ["booking", "medical", "healthcare", "appointment", "clinic"],
  funnelStage: "decision",
  conversionWeight: 82,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Medical booking headline (3–6 words)", maxLength: 60 }),
      descriptionBlock({ aiHint: "Insurance/privacy note (1–2 sentences)", maxLength: 160 }),
      collectionBlock({
        key: "types",
        label: "Appointment types",
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ name: "Appointment type", duration: "30 min", description: "Description.", price: "$0" }),
        itemFields: [
          { key: "name", label: "Name", type: "text", canonical: "headline", aiHint: "Appointment type name", maxLength: 50, group: "content" },
          { key: "duration", label: "Duration", type: "text", aiHint: "e.g. 30 min", maxLength: 12, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "What this appointment involves (1 sentence)", maxLength: 120, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. £65 or $80", maxLength: 12, group: "content" },
        ],
      }),
      noteBlock({ key: "phone", label: "Phone number", type: "text", aiHint: "Clinic phone number", maxLength: 30, group: "cta" }),
      noteBlock({ key: "ctaLabel", label: "Online booking label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Book online", maxLength: 24, group: "cta" }, { blockLabel: "Actions" }),
    ],
  },
  defaultProps: {
    eyebrow: "Appointments",
    headline: "Book the care you need",
    description: "Most insurance plans accepted. Your details are kept private and only shared with your care team.",
    phone: "(555) 402-1180",
    ctaLabel: "Book online",
    types: [
      { name: "New patient visit", duration: "60 min", description: "A full history, examination and personalised care plan.", price: "$150" },
      { name: "Follow-up", duration: "30 min", description: "Review progress and adjust treatment.", price: "$85" },
      { name: "Telehealth consult", duration: "30 min", description: "A secure video appointment from home.", price: "$75" },
    ],
  },
  Component: BookingMedical,
})
