"use client"

import { Check, Minus } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PlanCta,
  PlanText,
  headlineWithFallback,
  labelSetting,
  plansBlock,
  pricingHeaderBlocks,
  readItems,
  stretchItems,
  textProp,
  textWithFallback,
  type Plan,
} from "@/components/sections/pricing/pricing-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type FeatureRow = { label?: string; starter?: boolean; pro?: boolean; business?: boolean }

/** The three stored inclusion flags, in column order. Keys are persisted — never rename. */
const COLUMN_KEYS = ["starter", "pro", "business"] as const

const POPULAR_FALLBACK = "Most popular"

/**
 * Contrast — comparison archetype.
 *
 * Plan cards in a header row, then a ruled feature list with a check or a dash
 * per plan, so the difference between tiers is read rather than inferred.
 * Signature move: the feature list is a plain ledger (hairline rows, no zebra
 * stripes, no crosses). The plan cards and the feature rows are two collections in one
 * slot: either can move above the other, or be hidden.
 */
function PricingCompare ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })
  const primary = ds?.colors?.primary ?? "var(--primary)"
  const popularLabel = textProp(instance.props, "popularLabel", POPULAR_FALLBACK)

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center gap-3 text-center"
          align="center"
          entryClassName={stretchItems}
          overrides={{
            headline: headlineWithFallback({
              headline: "Compare plans",
              accentWord: "side by side",
              className: `${TYPE_H2} text-foreground`,
            }),
            description: textWithFallback({
              propKey: "description",
              fallback: "Every plan includes a 14-day free trial. No credit card required.",
              className: `${TYPE_LEAD} max-w-md mx-auto`,
            }),
          }}
          renderItems={({ instance: inst, block }) => {
            if (block.collectionKey === "features") {
              const features = readItems<FeatureRow>(inst.props, "features")
              if (features.length === 0) return null
              return (
                <div className="border-t border-foreground text-start">
                  {features.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-4 border-b border-border">
                      <div className="py-4 pe-4 text-sm text-foreground flex items-center">
                        <PlanText
                          instance={inst}
                          isPreview={isPreview}
                          collection="features"
                          index={ri}
                          field="label"
                          value={row.label}
                        />
                      </div>
                      {COLUMN_KEYS.map((col) => (
                        <div key={col} className="flex items-center justify-center py-4">
                          {row[col]
                            ? <Check className="size-4 text-foreground" aria-label="Included" />
                            : <Minus className="size-4 text-muted-foreground/60" aria-label="Not included" />}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            }

            return (
              <div className="mt-12 mb-8 grid grid-cols-1 gap-4 text-start md:grid-cols-3">
                {readItems<Plan>(inst.props, "plans").map((plan, i) => (
                  <div
                    key={i}
                    className="rounded-[var(--radius-xl)] p-6 bg-card flex flex-col"
                    style={{
                      border: plan.isPopular ? `2px solid ${primary}` : "1px solid var(--border)",
                    }}
                  >
                    {plan.isPopular && (
                      <span className="mb-2 text-sm font-medium" style={{ color: primary }}>
                        {popularLabel}
                      </span>
                    )}
                    <PlanText
                      as="div"
                      instance={inst}
                      isPreview={isPreview}
                      index={i}
                      field="name"
                      value={plan.name}
                      className="font-heading text-lg font-semibold text-foreground mb-1"
                    />
                    <PlanText
                      as="p"
                      instance={inst}
                      isPreview={isPreview}
                      index={i}
                      field="description"
                      value={plan.description}
                      className="text-sm text-muted-foreground leading-[1.5] mb-4"
                    />
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="font-heading text-[40px] font-semibold tracking-[-0.03em] leading-none text-foreground">
                        <PlanText instance={inst} isPreview={isPreview} index={i} field="price" value={plan.price} />
                      </span>
                      <span className="text-[14px] text-muted-foreground">
                        <PlanText instance={inst} isPreview={isPreview} index={i} field="priceSuffix" value={plan.priceSuffix} />
                      </span>
                    </div>
                    <PlanCta
                      instance={inst}
                      isPreview={isPreview}
                      index={i}
                      plan={plan}
                      className="mt-auto w-full h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors"
                      style={
                        plan.isPopular
                          ? { background: primary, color: "var(--primary-foreground)" }
                          : { border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)" }
                      }
                    />
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

export const pricingCompareSection = defineSection({
  id: "pricing-compare",
  displayName: "Contrast",
  description: "Plan cards over a striped feature list — a check or a cross per plan, per feature.",
  category: "pricing",
  layoutArchetype: "comparison",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "enterprise", "startup", "agency", "finance", "generic"],
  trustWeight: 30,
  conversionWeight: 90,
  funnelStage: "decision",
  styles: ["modern", "corporate", "minimal"],
  goals: ["sales", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 70,
  editable: true,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return pricingCompareSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...pricingHeaderBlocks({ eyebrow: false }),
      plansBlock({
        fields: ["name", "price", "priceSuffix", "description", "isPopular", "ctaLabel", "ctaHref"],
        minItems: 2,
        maxItems: 3,
        newItem: () => ({ name: "Plan", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "Plan description.", ctaLabel: "Get started", ctaHref: "#", isPopular: false }),
      }),
      {
        kind: "items",
        key: "features",
        canonical: "items",
        label: "Feature rows",
        pick: [],
        itemFields: [
          { key: "label", label: "Feature", type: "text", maxLength: 60 },
          { key: "starter", label: "Included in plan 1", type: "switch" },
          { key: "pro", label: "Included in plan 2", type: "switch" },
          { key: "business", label: "Included in plan 3", type: "switch" },
        ],
        minItems: 1,
        maxItems: 16,
        newItem: () => ({ label: "New feature", starter: false, pro: true, business: true }),
      },
    ],
    settings: [labelSetting("popularLabel", "Popular badge", POPULAR_FALLBACK)],
  },
  defaultProps: {
    headline: "Compare plans",
    accentWord: "side by side",
    description: "Every plan includes a 14-day free trial. No credit card required.",
    plans: [
      { name: "Starter", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "For individuals getting started.", ctaLabel: "Start free", ctaHref: "#", isPopular: false },
      { name: "Pro", price: "$29", priceSuffix: "/mo", annualPrice: "$19", description: "For growing teams that ship weekly.", ctaLabel: "Start free trial", ctaHref: "#", isPopular: true },
      { name: "Business", price: "$99", priceSuffix: "/mo", annualPrice: "$79", description: "For organisations that need control.", ctaLabel: "Talk to sales", ctaHref: "#", isPopular: false },
    ],
    features: [
      { label: "Unlimited pages", starter: true, pro: true, business: true },
      { label: "Custom domains", starter: false, pro: true, business: true },
      { label: "Advanced analytics", starter: false, pro: true, business: true },
      { label: "Remove branding", starter: false, pro: true, business: true },
      { label: "Team seats & roles", starter: false, pro: false, business: true },
      { label: "Single sign-on", starter: false, pro: false, business: true },
      { label: "Dedicated success manager", starter: false, pro: false, business: true },
    ],
  },
  Component: PricingCompare,
})
