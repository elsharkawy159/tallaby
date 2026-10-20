"use client"

import { Phone, Clock, MapPin, CalendarCheck, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ActionLink,
  PropText,
  actionBlocks,
  labelSetting,
  propText,
  textOf,
} from "@/components/sections/content/content-parts"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

/**
 * Card copy and labels this section used to hardcode. Pages saved before the
 * slot migration carry no prop for them, so these fallbacks keep them as they
 * were while new instances store (and can edit) the value.
 */
const FALLBACK = {
  formTitle: "Make a reservation",
  phoneLabel: "Phone",
  addressLabel: "Address",
  hoursLabel: "Hours",
  namePlaceholder: "Your name",
  emailPlaceholder: "Email address",
  guestsPlaceholder: "Guests",
  requestsPlaceholder: "Special requests (optional)",
} as const

/** One contact row — icon tile, small label (a setting) and the editable value. */
function contactRow (key: string, labelKey: keyof typeof FALLBACK, Icon: LucideIcon): BlockOverride {
  return function ContactRow ({ instance, isPreview }) {
    const value = textOf(instance.props, key)
    if (!value) return null
    return (
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 text-foreground">
          <Icon className="size-4 text-primary" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {textOf(instance.props, labelKey, FALLBACK[labelKey])}
          </p>
          {key === "phone" && isPreview ? (
            <a href={`tel:${value}`} className="font-semibold text-foreground hover:underline">
              {value}
            </a>
          ) : (
            <PropText instance={instance} propKey={key} isPreview={isPreview} className="font-semibold text-foreground" />
          )}
        </div>
      </div>
    )
  }
}

const INPUT = "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"

/**
 * The booking fields and their submit action, drawn as one entry so the
 * fields always travel with the button that sends them. Presentational, like
 * every section form in the catalog: the action is a link.
 */
function BookingForm ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const ph = (key: keyof typeof FALLBACK) => textOf(instance.props, key, FALLBACK[key])
  return (
    <div className="space-y-4">
      <input type="text" placeholder={ph("namePlaceholder")} className={INPUT} />
      <input type="email" placeholder={ph("emailPlaceholder")} className={INPUT} />
      <div className="grid grid-cols-2 gap-4">
        <input type="date" aria-label="Date" className={INPUT} />
        <input type="time" aria-label="Time" className={INPUT} />
      </div>
      <input type="number" placeholder={ph("guestsPlaceholder")} min={1} max={20} className={INPUT} />
      <textarea placeholder={ph("requestsPlaceholder")} rows={3} className={`${INPUT} resize-none`} />
      <ActionLink instance={instance} isPreview={isPreview} className="flex w-full py-3" />
    </div>
  )
}

/**
 * Reserve — info-form archetype.
 *
 * Contact details on the start side (phone, address, hours, each with an icon
 * tile), a reservation request card on the end side. Two slots: the details
 * column and the card's contents.
 */
function ContentReservations ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="details"
            className="flex flex-col gap-4"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={`${TYPE_BODY} mb-4`}
            overrides={{
              eyebrow: propText("eyebrow", {
                className: "-mb-1 text-xs font-semibold text-primary",
              }),
              phone: contactRow("phone", "phoneLabel", Phone),
              address: contactRow("address", "addressLabel", MapPin),
              hours: contactRow("hours", "hoursLabel", Clock),
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
                formTitle: ({ instance: inst, isPreview: preview }) => {
                  if (inst.props.formTitle === "") return null
                  return (
                    <div className="mb-6 flex items-center gap-3">
                      <CalendarCheck className="size-6 text-primary" aria-hidden />
                      <PropText
                        as="h3"
                        instance={inst}
                        propKey="formTitle"
                        fallback={FALLBACK.formTitle}
                        isPreview={preview}
                        className="text-lg font-semibold text-foreground"
                      />
                    </div>
                  )
                },
                ctaLabel: ({ instance: inst, isPreview: preview }) => <BookingForm instance={inst} isPreview={preview} />,
                ctaHref: () => null,
                note: propText("note", { className: "mt-4 text-center text-xs text-muted-foreground" }),
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentReservationsSection = defineSection({
  id: "content-reservations",
  displayName: "Reserve",
  description: "Phone, address and hours beside a reservation request card.",
  category: "content",
  layoutArchetype: "info-form",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "food_delivery", "catering", "hotel"],
  styles: ["modern", "minimal", "editorial"],
  goals: ["leads", "bookings", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 90,
  trustWeight: 70,
  tags: ["reservations", "booking", "restaurant", "contact", "form"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "details", label: "Details", isDefault: true },
      { id: "form", label: "Reservation card" },
    ],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 60 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "note",
        id: "phone",
        label: "Phone number",
        field: { key: "phone", label: "Phone number", type: "text", aiHint: "Restaurant phone number", maxLength: 30, group: "content" },
      },
      {
        kind: "note",
        id: "address",
        label: "Address",
        field: { key: "address", label: "Address", type: "text", aiHint: "Full restaurant address", maxLength: 120, group: "content" },
      },
      {
        kind: "note",
        id: "hours",
        label: "Hours",
        field: { key: "hours", label: "Hours", type: "text", aiHint: "Opening hours summary", maxLength: 150, group: "content" },
      },
      {
        kind: "note",
        id: "formTitle",
        label: "Card title",
        slot: "form",
        field: { key: "formTitle", label: "Card title", type: "text", canonical: "subheadline", maxLength: 50, group: "content" },
      },
      ...actionBlocks({ maxLength: 40, slot: "form" }),
      {
        kind: "note",
        id: "note",
        label: "Form note",
        slot: "form",
        field: { key: "note", label: "Form note", type: "text", aiHint: "Small note below the form", maxLength: 100, group: "content" },
      },
    ],
    settings: [
      labelSetting("phoneLabel", "Phone label"),
      labelSetting("addressLabel", "Address label"),
      labelSetting("hoursLabel", "Hours label"),
      labelSetting("namePlaceholder", "Name field placeholder", 40),
      labelSetting("emailPlaceholder", "Email field placeholder", 40),
      labelSetting("guestsPlaceholder", "Guests field placeholder", 40),
      labelSetting("requestsPlaceholder", "Requests field placeholder", 60),
    ],
  },
  defaultProps: {
    eyebrow: "Reservations",
    headline: "Book your table",
    description: "We hold tables for fifteen minutes past the booking time. For parties of eight or more, please call us directly.",
    phone: "(555) 014-2290",
    address: "48 Harbour Street, Portside",
    hours: "Tuesday – Sunday: 5pm – 11pm",
    ...FALLBACK,
    ctaLabel: "Request a table",
    ctaHref: "#",
    note: "We confirm every reservation by email within two hours.",
  },
  Component: ContentReservations,
})
