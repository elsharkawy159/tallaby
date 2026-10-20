"use client"

import { Calendar, Globe, MessageSquare, Users, type LucideIcon } from "lucide-react"
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
  badgeEyebrow,
  carried,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  listOf,
  noteBlock,
  propNote,
  s,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type TravelFeature = { icon?: string; title?: string; body?: string }

const ICON_MAP: Record<string, LucideIcon> = { Globe, Calendar, Users, MessageSquare }

/** Card copy pre-migration pages rendered as hardcoded text. */
const CARD_TITLE_FALLBACK = "Ready to start planning?"
const CARD_BODY_FALLBACK = "Share your travel dates, destination and preferences. We do the rest."

/**
 * Itinerary — split archetype.
 *
 * The pitch and a two-by-two grid of service highlights on the start side; a
 * compact inquiry card with the action and a response-time promise on the end
 * side. Two slots, one per column.
 */
function BookingTravelInquiry ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-4`}
            overrides={{ eyebrow: badgeEyebrow(isPreview, "mb-5") }}
            renderItems={({ instance: inst }) => {
              const features = listOf<TravelFeature>(inst, "features")
              if (features.length === 0) return null
              return (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {features.map((feat, i) => {
                    const Icon = ICON_MAP[s(feat?.icon)] ?? Globe
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="mt-0.5 flex shrink-0 text-foreground">
                          <Icon className="size-4" aria-hidden />
                        </div>
                        <div>
                          <ItemText as="div" instance={inst} collection="features" index={i} field="title" value={feat?.title} className="text-sm font-semibold text-foreground" isPreview={isPreview} />
                          <ItemText as="div" instance={inst} collection="features" index={i} field="body" value={feat?.body} className="mt-0.5 text-xs text-muted-foreground" isPreview={isPreview} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }}
          />

          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-5 flex text-foreground">
              <Globe className="size-6" aria-hidden />
            </div>
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="card"
              className="flex flex-col"
              overrides={{
                cardTitle: propNote("cardTitle", "mb-2 text-lg font-semibold text-foreground", isPreview, { as: "h3", fallback: CARD_TITLE_FALLBACK }),
                cardBody: propNote("cardBody", "mb-6 text-sm text-muted-foreground", isPreview, { fallback: CARD_BODY_FALLBACK }),
                ctaLabel: ({ instance: inst }) => (
                  <FlatAction
                    instance={inst}
                    isPreview={isPreview}
                    hrefProp="ctaHref"
                    className="mb-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  />
                ),
                ctaHref: carried,
                responseTime: ({ instance: inst }) =>
                  textOr(inst, "responseTime", undefined) === undefined ? null : (
                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                      <MessageSquare className="size-3.5" aria-hidden />
                      <PropText instance={inst} propKey="responseTime" isPreview={isPreview} />
                    </p>
                  ),
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingTravelInquirySection = defineSection({
  id: "booking-travel-inquiry",
  displayName: "Itinerary",
  description: "Travel pitch with a grid of service highlights beside a compact inquiry card.",
  category: "booking",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["travel", "travel_agency", "tour_package", "hotel", "car_rental"],
  trustWeight: 30,
  conversionWeight: 80,
  funnelStage: "decision",
  styles: ["modern", "minimal", "bold"],
  goals: ["bookings", "leads", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "card", label: "Inquiry card", eject: { direction: "column" } },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label above headline (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Inquiry section headline (5–9 words)", maxLength: 80 }),
      descriptionBlock({ aiHint: "Brief explanation of the inquiry process (1–3 sentences)", maxLength: 250 }),
      collectionBlock({
        key: "features",
        label: "Features",
        minItems: 2,
        maxItems: 6,
        newItem: () => ({ icon: "Globe", title: "Feature", body: "Short description." }),
        itemFields: [
          { key: "icon", label: "Icon", type: "select", options: ["Globe", "Calendar", "Users", "MessageSquare"].map((k) => ({ value: k, label: k })) },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Feature title (2–4 words)", maxLength: 40, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: "Feature description (1 sentence)", maxLength: 80, group: "content" },
        ],
      }),
      noteBlock({ key: "cardTitle", label: "Card title", type: "text", canonical: "subheadline", maxLength: 50 }, { slot: "card" }),
      noteBlock({ key: "cardBody", label: "Card text", type: "text", canonical: "body", maxLength: 140 }, { slot: "card" }),
      noteBlock({ key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Inquiry button label (2–4 words)", maxLength: 30, group: "cta" }, { slot: "card" }),
      noteBlock({ key: "ctaHref", label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" }, { slot: "card" }),
      noteBlock({ key: "responseTime", label: "Response time note", type: "text", aiHint: "Response time guarantee (e.g. 'Response within 24 hours')", maxLength: 50 }, { slot: "card" }),
    ],
  },
  defaultProps: {
    eyebrow: "Tailor-made travel",
    headline: "Tell us where you want to go next",
    description: "Our travel designers build every itinerary around you — flights, stays and experiences handled end to end.",
    cardTitle: CARD_TITLE_FALLBACK,
    cardBody: CARD_BODY_FALLBACK,
    ctaLabel: "Start your inquiry",
    ctaHref: "#",
    responseTime: "We reply within 24 hours",
    features: [
      { icon: "Globe", title: "120+ destinations", body: "Local experts on every continent." },
      { icon: "Calendar", title: "Flexible dates", body: "Free changes up to 30 days out." },
      { icon: "Users", title: "Groups welcome", body: "Solo trips to family reunions." },
      { icon: "MessageSquare", title: "24/7 support", body: "A real person whenever you travel." },
    ],
  },
  Component: BookingTravelInquiry,
})
