"use client"

import { Check } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
  collectionBlock,
  eyebrowBlock,
  headingBlock,
  kickerEyebrow,
  listOf,
  s,
  stretchItems,
} from "@/components/sections/booking/booking-parts"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Package = { name?: string; price?: string; duration?: string; description?: string; features?: string; ctaLabel?: string; ctaHref?: string; popular?: boolean }

/**
 * Bundle — linked-cards archetype.
 *
 * A centred header over equal package cards: price and unit, a summary, a
 * checklist split from one-per-line features, and each card's own book link.
 * A `popular` package is tinted and badged.
 */
function BookingPackage ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

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
            const packages = listOf<Package>(inst, "packages")
            if (packages.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {packages.map((pkg, i) => {
                  const popular = Boolean(pkg?.popular)
                  const write = (t: string) => store().updateItem(inst.id, "packages", i, { ctaLabel: t })
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative flex flex-col overflow-hidden rounded-2xl border p-6",
                        popular
                          ? "border-primary/50 bg-[color-mix(in_oklch,var(--primary)_4%,var(--card))] shadow-md"
                          : "border-border/60 bg-card"
                      )}
                    >
                      {popular && (
                        <span className="absolute end-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Popular</span>
                      )}
                      <ItemText as="h3" instance={inst} collection="packages" index={i} field="name" value={pkg?.name} className="text-lg font-semibold text-foreground" isPreview={isPreview} />
                      <div className="mt-2">
                        <span className="text-3xl font-semibold text-foreground">{s(pkg?.price)}</span>
                        <span className="ms-1 text-sm text-muted-foreground">{s(pkg?.duration)}</span>
                      </div>
                      <ItemText as="p" instance={inst} collection="packages" index={i} field="description" value={pkg?.description} className="mt-2 text-sm text-muted-foreground" isPreview={isPreview} />
                      <ul className="mt-5 flex-1 space-y-2">
                        {s(pkg?.features).split("\n").filter(Boolean).map((f, fi) => (
                          <li key={fi} className="flex items-center gap-2 text-sm text-foreground">
                            <Check className="size-4 shrink-0 text-primary" aria-hidden />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <SectionLink
                        link={linkValueFromProp(s(pkg?.ctaHref) || "#")}
                        isPreview={isPreview}
                        className={cn(
                          "mt-6 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold",
                          popular ? PRIMARY_BUTTON : OUTLINE_BUTTON
                        )}
                      >
                        <InlineEditableText
                          as="span"
                          data-element-collection="packages"
                          data-element-index={String(i)}
                          data-element-item-label-prop="ctaLabel"
                          value={s(pkg?.ctaLabel)}
                          isPreview={isPreview}
                          onChange={write}
                          onCommit={write}
                        />
                       
                      </SectionLink>
                    </div>
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

export const bookingPackageSection = defineSection({
  id: "booking-package",
  displayName: "Bundle",
  description: "Tiered service packages — price, unit, feature checklist and a book link per card, with a recommended pick.",
  category: "booking",
  layoutArchetype: "linked-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["fitness", "medical", "physiotherapy", "nutritionist", "education", "agency"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "sales", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["booking", "packages", "programmes", "tiers", "wellness"],
  funnelStage: "decision",
  conversionWeight: 80,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 30 }),
      headingBlock({ aiHint: "Packages headline (3–6 words)", maxLength: 60 }),
      collectionBlock({
        key: "packages",
        label: "Packages",
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ name: "Package", price: "$99", duration: "per session", description: "Description.", features: "Feature one\nFeature two\nFeature three", ctaLabel: "Book now", ctaHref: "#", popular: false }),
        itemFields: [
          { key: "name", label: "Package name", type: "text", canonical: "headline", aiHint: "Package tier name", maxLength: 30, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $299", maxLength: 16, group: "content" },
          { key: "duration", label: "Duration / unit", type: "text", aiHint: "e.g. per session, per month", maxLength: 24, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "Package summary (1 sentence)", maxLength: 120, group: "content" },
          { key: "features", label: "Features (one per line)", type: "textarea", aiHint: "List features, one per line", maxLength: 400, group: "content" },
          { key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Button label (2–4 words)", maxLength: 24, group: "cta" },
          { key: "ctaHref", label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Programmes",
    headline: "Pick the plan that fits your goals",
    packages: [
      { name: "Starter", price: "$89", duration: "per session", description: "A single session to assess and get you moving.", features: "Full assessment\nPersonal plan\nHome exercise guide\nEmail follow-up", ctaLabel: "Book a session", ctaHref: "#", popular: false },
      { name: "Progress", price: "$320", duration: "4 sessions", description: "Our most chosen block for steady, measurable results.", features: "Everything in Starter\nWeekly sessions\nProgress tracking\nPriority scheduling", ctaLabel: "Book the block", ctaHref: "#", popular: true },
      { name: "Transform", price: "$580", duration: "8 sessions", description: "A full programme with ongoing support between visits.", features: "Everything in Progress\nTwice-weekly sessions\nNutrition guidance\nMessaging support\nFinal review", ctaLabel: "Start the programme", ctaHref: "#", popular: false },
    ],
  },
  Component: BookingPackage,
})
