"use client"

import { Clock, Phone, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PropText,
  carried,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  kickerEyebrow,
  noteBlock,
  propNote,
  textOr,
} from "@/components/sections/booking/booking-parts"
import {
  BookingFormFeedback,
  BookingFormHoneypot,
  useBookingSubmit,
} from "@/components/forms/use-booking-submit"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

/** Card title pre-migration pages rendered as hardcoded text. */
const FORM_TITLE_FALLBACK = "Book an appointment"

const FIELD = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
const LABEL = "mb-1 block text-sm font-medium text-foreground"

/**
 * The live appointment request form. Unchanged from the pre-slot markup: it
 * posts through `useBookingSubmit` (formKey `appointment`) on the published
 * site, and is inert in the builder. The submit label is the `ctaLabel` block.
 */
function AppointmentForm ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const services = (Array.isArray(instance.props.services) ? instance.props.services : []) as string[]
  const { onSubmit, status, error, successMessage, isLive } = useBookingSubmit({ formKey: "appointment" })

  return (
    <form className="space-y-4" onSubmit={isLive ? onSubmit : (e) => e.preventDefault()}>
      {isLive ? <BookingFormHoneypot /> : null}
      <BookingFormFeedback status={status} error={error} successMessage={successMessage} />
      {status !== "success" && (
        <>
          {services.length > 0 && (
            <div>
              <label className={LABEL}>Service</label>
              <select name="data_service" className={`${FIELD} text-foreground focus:outline-none`}>
                {services.map((s, i) => <option key={`${s}-${i}`}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={LABEL}>Full name</label>
            <input name="name" type="text" className={`${FIELD} placeholder:text-muted-foreground focus:outline-none`} placeholder="Jane Smith" />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input name="email" type="email" className={`${FIELD} placeholder:text-muted-foreground focus:outline-none`} placeholder="jane@example.com" />
          </div>
          <div>
            <label className={LABEL}>Phone</label>
            <input name="phone" type="tel" className={`${FIELD} placeholder:text-muted-foreground focus:outline-none`} placeholder="(555) 000-0000" />
          </div>
          <div>
            <label className={LABEL}>Preferred date &amp; time</label>
            <input name="requested_at" type="datetime-local" className={`${FIELD} text-foreground focus:outline-none`} />
          </div>
          <div>
            <label className={LABEL}>Message (optional)</label>
            <textarea name="notes" rows={3} className={`${FIELD} resize-none placeholder:text-muted-foreground focus:outline-none`} placeholder="Tell us anything we should know..." />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "submitting" ? "Submitting…" : (
              <PropText instance={instance} propKey="ctaLabel" isPreview={isPreview} fallback="" />
            )}
          </button>
        </>
      )}
    </form>
  )
}

/** One contact detail row — an icon tile, a label and its value. */
function infoRow (labelKey: string, valueKey: string, Icon: LucideIcon, className: string, isPreview?: boolean): BlockOverride {
  return function InfoRow ({ instance }) {
    if (!textOr(instance, labelKey, undefined) && !textOr(instance, valueKey, undefined)) return null
    return (
      <div className={`flex items-start gap-4 ${className}`}>
        <div className="flex shrink-0 text-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <PropText instance={instance} propKey={labelKey} as="p" className="font-semibold text-foreground" isPreview={isPreview} />
          <PropText instance={instance} propKey={valueKey} as="p" className="mt-1 whitespace-pre-line text-sm text-muted-foreground" isPreview={isPreview} />
        </div>
      </div>
    )
  }
}

/**
 * Concierge — info-form archetype.
 *
 * Opening hours and a direct line on the start side, the live appointment
 * request form in a card on the end side. Two slots, one per column; the form
 * itself is the `ctaLabel` block's override so it stays one functional unit.
 */
function BookingAppointment ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={`${TYPE_LEAD} mt-4`}
            overrides={{
              eyebrow: kickerEyebrow("mb-3", isPreview),
              hoursLabel: infoRow("hoursLabel", "hours", Clock, "mt-8", isPreview),
              hours: carried,
              phoneLabel: infoRow("phoneLabel", "phone", Phone, "mt-5", isPreview),
              phone: carried,
            }}
          />

          <div className="rounded-2xl border border-border bg-card p-8">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="form"
              className="flex flex-col"
              overrides={{
                formTitle: propNote("formTitle", "mb-5 font-semibold text-foreground", isPreview, { fallback: FORM_TITLE_FALLBACK }),
                ctaLabel: ({ instance: inst }) => <AppointmentForm instance={inst} isPreview={isPreview} />,
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingAppointmentSection = defineSection({
  id: "booking-appointment",
  displayName: "Concierge",
  description: "Hours and a direct line beside a live appointment request form with a service picker.",
  category: "booking",
  detachable: false,
  layoutArchetype: "info-form",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["dentist", "medical", "physiotherapy", "therapy", "nutritionist", "beauty", "fitness"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "leads", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 90,
  trustWeight: 65,
  tags: ["booking", "appointment", "form", "dentist", "medical", "schedule"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "form", label: "Request form" },
    ],
    blocks: [
      eyebrowBlock({ maxLength: 30 }),
      headingBlock({ maxLength: 70 }),
      descriptionBlock({ maxLength: 200 }),
      noteBlock({ key: "hoursLabel", label: "Hours label", type: "text", aiHint: "e.g. Office Hours", maxLength: 40, group: "content" }),
      noteBlock({ key: "hours", label: "Hours (one per line)", type: "textarea", aiHint: "Business hours, one day per line", maxLength: 300, group: "content" }),
      noteBlock({ key: "phoneLabel", label: "Phone label", type: "text", maxLength: 40, group: "content" }),
      noteBlock({ key: "phone", label: "Phone number", type: "text", maxLength: 30, group: "content" }),
      noteBlock({ key: "formTitle", label: "Form title", type: "text", canonical: "subheadline", maxLength: 50, group: "content" }, { slot: "form" }),
      noteBlock({ key: "ctaLabel", label: "Submit button label", type: "text", canonical: "ctaPrimary", maxLength: 40, group: "cta" }, { slot: "form", blockLabel: "Request form" }),
    ],
    settings: [
      { key: "services", label: "Services (JSON array)", type: "textarea", aiHint: "Array of service name strings for the dropdown", maxLength: 500, group: "content" },
    ],
  },
  defaultProps: {
    eyebrow: "Appointments",
    headline: "Book your visit in under a minute",
    description: "Choose a service and a time that suits you — our front desk confirms every request within one business day.",
    hoursLabel: "Opening hours",
    hours: "Monday – Friday: 8am – 6pm\nSaturday: 9am – 1pm",
    phoneLabel: "Prefer to call?",
    phone: "(555) 214-7788",
    formTitle: FORM_TITLE_FALLBACK,
    ctaLabel: "Request appointment",
    ctaHref: "#",
    services: ["Initial consultation", "Check-up & clean", "Follow-up visit", "Treatment session", "Other"],
  },
  Component: BookingAppointment,
})
