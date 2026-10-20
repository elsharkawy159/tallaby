"use client"

import { Clock, Mail, MapPin, Phone, Scale } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
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
  iconNote,
  listOf,
  noteBlock,
  propNote,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type PracticeArea = { name?: string; description?: string }

/** Headings pre-migration pages rendered as hardcoded text. */
const AREAS_TITLE_FALLBACK = "Practice Areas"
const CONTACT_TITLE_FALLBACK = "Contact our office"

const CONTACT_ROW = "flex items-start gap-3 text-sm text-foreground"
const CONTACT_ICON = "mt-0.5 size-4 shrink-0 text-primary"

/**
 * Chambers — list-card archetype.
 *
 * A centred header over two columns: the firm's practice areas as a stacked
 * list, and a contact card with the office details, the booking action and a
 * disclaimer. Three slots — header, list column, card.
 */
function BookingConsultationLegal ({ instance, isPreview, definition }: SectionComponentProps) {
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
          align="center"
        />

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="areas"
            className="flex flex-col"
            overrides={{
              // The list column, title included, was omitted when it had no areas.
              practiceAreasTitle: ({ instance: inst }) =>
                listOf(inst, "practiceAreas").length === 0 ? null : (
                  <PropText
                    instance={inst}
                    propKey="practiceAreasTitle"
                    as="h3"
                    className="mb-4 text-sm font-semibold text-muted-foreground"
                    isPreview={isPreview}
                    fallback={AREAS_TITLE_FALLBACK}
                  />
                ),
            }}
            renderItems={({ instance: inst }) => {
              const areas = listOf<PracticeArea>(inst, "practiceAreas")
              if (areas.length === 0) return null
              return (
                <div className="flex flex-col gap-3">
                  {areas.map((area, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                      <ItemText as="div" instance={inst} collection="practiceAreas" index={i} field="name" value={area?.name} className="text-sm font-semibold text-foreground" isPreview={isPreview} />
                      <ItemText as="div" instance={inst} collection="practiceAreas" index={i} field="description" value={area?.description} className="mt-1 text-xs text-muted-foreground" isPreview={isPreview} />
                    </div>
                  ))}
                </div>
              )
            }}
          />

          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-6 flex text-foreground">
              <Scale className="size-6" aria-hidden />
            </div>
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="card"
              className="flex flex-col gap-4"
              overrides={{
                contactTitle: propNote("contactTitle", "mb-1 text-lg font-semibold text-foreground", isPreview, { as: "h3", fallback: CONTACT_TITLE_FALLBACK }),
                phone: iconNote("phone", Phone, CONTACT_ROW, CONTACT_ICON, isPreview),
                email: iconNote("email", Mail, CONTACT_ROW, CONTACT_ICON, isPreview),
                address: iconNote("address", MapPin, CONTACT_ROW, CONTACT_ICON, isPreview),
                hours: iconNote("hours", Clock, CONTACT_ROW, CONTACT_ICON, isPreview),
                ctaLabel: ({ instance: inst }) => (
                  <FlatAction
                    instance={inst}
                    isPreview={isPreview}
                    hrefProp="ctaHref"
                    className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  />
                ),
                ctaHref: carried,
                disclaimer: propNote("disclaimer", "-mt-1 text-center text-xs text-muted-foreground", isPreview),
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingConsultationLegalSection = defineSection({
  id: "booking-consultation-legal",
  displayName: "Chambers",
  description: "Practice areas beside a contact card with office details, a consultation action and a disclaimer.",
  category: "booking",
  layoutArchetype: "list-card",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["law", "finance", "real_estate", "other"],
  trustWeight: 55,
  conversionWeight: 78,
  funnelStage: "decision",
  styles: ["corporate", "modern", "minimal"],
  goals: ["bookings", "leads", "trust"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Header", isDefault: true },
      { id: "areas", label: "Practice areas" },
      { id: "card", label: "Contact card", eject: { direction: "column" } },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Consultation section headline (5–10 words)", maxLength: 80 }),
      descriptionBlock({ aiHint: "Brief description of the consultation process (1–3 sentences)", maxLength: 280 }),
      noteBlock({ key: "practiceAreasTitle", label: "Practice areas title", type: "text", canonical: "subheadline", maxLength: 40 }, { slot: "areas" }),
      collectionBlock({
        key: "practiceAreas",
        label: "Practice areas",
        slot: "areas",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ name: "Practice Area", description: "Brief description of this area." }),
        itemFields: [
          { key: "name", label: "Area name", type: "text", canonical: "headline", aiHint: "Practice area name (2–4 words)", maxLength: 40, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "Brief description (1 sentence)", maxLength: 120, group: "content" },
        ],
      }),
      noteBlock({ key: "contactTitle", label: "Card title", type: "text", canonical: "subheadline", maxLength: 50 }, { slot: "card" }),
      noteBlock({ key: "phone", label: "Phone", type: "text", aiHint: "Office phone number", maxLength: 30 }, { slot: "card" }),
      noteBlock({ key: "email", label: "Email", type: "text", aiHint: "Office email address", maxLength: 80 }, { slot: "card" }),
      noteBlock({ key: "address", label: "Address", type: "textarea", aiHint: "Office address", maxLength: 150 }, { slot: "card" }),
      noteBlock({ key: "hours", label: "Office hours", type: "text", aiHint: "Office hours (e.g. Mon–Fri: 8am–6pm)", maxLength: 60 }, { slot: "card" }),
      noteBlock({ key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Book button text (3–6 words)", maxLength: 40, group: "cta" }, { slot: "card" }),
      noteBlock({ key: "ctaHref", label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" }, { slot: "card" }),
      noteBlock({ key: "disclaimer", label: "Disclaimer text", type: "text", aiHint: "Legal disclaimer below the CTA", maxLength: 120 }, { slot: "card" }),
    ],
  },
  defaultProps: {
    eyebrow: "Consultations",
    headline: "Get clear legal advice from day one",
    description: "Tell us about your matter and an attorney will review it before your first meeting, so every minute is spent on your case.",
    practiceAreasTitle: AREAS_TITLE_FALLBACK,
    contactTitle: CONTACT_TITLE_FALLBACK,
    phone: "(555) 310-4400",
    email: "intake@harlowpartners.com",
    address: "200 Market Street, Suite 1400",
    hours: "Monday – Friday: 8am – 6pm",
    ctaLabel: "Request a consultation",
    ctaHref: "#",
    disclaimer: "Contacting us does not create an attorney–client relationship.",
    practiceAreas: [
      { name: "Business & Contracts", description: "Formation, agreements and commercial disputes." },
      { name: "Employment Law", description: "Advice for employers and employees alike." },
      { name: "Real Estate", description: "Purchases, leases and property disputes." },
      { name: "Estate Planning", description: "Wills, trusts and probate guidance." },
    ],
  },
  Component: BookingConsultationLegal,
})
