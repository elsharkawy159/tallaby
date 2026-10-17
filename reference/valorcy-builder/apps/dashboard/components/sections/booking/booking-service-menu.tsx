"use client"

import { Clock } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  collectionBlock,
  eyebrowBlock,
  headingBlock,
  kickerEyebrow,
  listOf,
  s,
  stretchItems,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Service = { name?: string; description?: string; duration?: string; price?: string; category?: string }

/**
 * Salon — directory archetype.
 *
 * A centred header over the full treatment list, grouped under a rule per
 * category, each entry with its duration, price and a book action. Grouping is
 * derived from each service's `category`; editing writes back to the flat
 * `services` collection by its original index.
 */
function BookingServiceMenu ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          overrides={{ eyebrow: kickerEyebrow("mb-1", isPreview) }}
          renderItems={({ instance: inst }) => {
            const services = listOf<Service>(inst, "services")
            const ctaWord = textOr(inst, "ctaLabel", "").split(" ")[0]
            const grouped = services.reduce<Record<string, { s: Service; gi: number }[]>>((acc, svc, gi) => {
              const cat = s(svc?.category)
              ;(acc[cat] ??= []).push({ s: svc, gi })
              return acc
            }, {})
            return (
              <div className="mt-10 space-y-8">
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="mb-3 border-b border-border pb-2 text-xs font-semibold text-primary">{cat}</h3>
                    <div className="space-y-3">
                      {items.map(({ s: svc, gi }) => (
                        <div key={gi} className="flex items-start gap-5 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <ItemText as="h4" instance={inst} collection="services" index={gi} field="name" value={svc?.name} className="font-semibold text-foreground" isPreview={isPreview} />
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <Clock className="size-3" aria-hidden />
                                {s(svc?.duration)}
                              </span>
                            </div>
                            <ItemText as="p" instance={inst} collection="services" index={gi} field="description" value={svc?.description} className="mt-0.5 text-sm text-muted-foreground" isPreview={isPreview} />
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="text-lg font-semibold text-primary">{s(svc?.price)}</span>
                            <button type="button" className="flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10">
                              {ctaWord}
                            </button>
                          </div>
                        </div>
                      ))}
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

export const bookingServiceMenuSection = defineSection({
  id: "booking-service-menu",
  displayName: "Salon",
  description: "Treatment catalogue grouped by category — duration, price and a book action per service.",
  category: "booking",
  layoutArchetype: "directory",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["fitness", "medical", "physiotherapy", "nutritionist", "other"],
  styles: ["minimal", "modern", "editorial"],
  goals: ["bookings", "sales", "conversion"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["booking", "services", "spa", "salon", "wellness"],
  funnelStage: "consideration",
  conversionWeight: 75,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Service menu headline (3–6 words)", maxLength: 60 }),
      collectionBlock({
        key: "services",
        label: "Services",
        minItems: 1,
        maxItems: 20,
        newItem: () => ({ name: "Service name", description: "Description.", duration: "60 min", price: "$0", category: "Category" }),
        itemFields: [
          { key: "name", label: "Service name", type: "text", canonical: "headline", aiHint: "Treatment name", maxLength: 50, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "What this service involves (1 sentence)", maxLength: 120, group: "content" },
          { key: "duration", label: "Duration", type: "text", aiHint: "e.g. 60 min", maxLength: 12, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $95", maxLength: 12, group: "content" },
          { key: "category", label: "Category", type: "text", aiHint: "e.g. Massage, Facial", maxLength: 30, group: "content" },
        ],
      }),
    ],
    settings: [
      { key: "ctaLabel", label: "Book button label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Book this service", maxLength: 24, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "Treatments",
    headline: "Choose your treatment",
    ctaLabel: "Book now",
    services: [
      { name: "Swedish massage", description: "Long, flowing strokes to release tension and restore calm.", duration: "60 min", price: "$95", category: "Massage" },
      { name: "Deep tissue massage", description: "Focused pressure for stubborn knots and tight muscles.", duration: "60 min", price: "$110", category: "Massage" },
      { name: "Signature facial", description: "Cleanse, exfoliate and hydrate, tailored to your skin.", duration: "45 min", price: "$85", category: "Facials" },
      { name: "Hydrating facial", description: "An intensive moisture boost for dull or dry skin.", duration: "60 min", price: "$105", category: "Facials" },
      { name: "Express manicure", description: "Shape, buff and polish in a lunch break.", duration: "45 min", price: "$40", category: "Hands & feet" },
    ],
  },
  Component: BookingServiceMenu,
})
