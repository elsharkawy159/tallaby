"use client"

import { Check, Minus } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
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

type FeatureRow = { category?: string; label?: string; values?: (boolean | string)[] }

/** Copy that pages saved before the slot migration rendered as hardcoded text. */
const FALLBACK = { featuresColumn: "Features", popular: "Most popular" } as const

/**
 * Matrix — matrix archetype.
 *
 * The full feature matrix: plans across the top with their price and action,
 * features down the side grouped by category, a check, a dash or a value in
 * every cell. Signature move: a real table under a start-aligned header, ruled
 * like a spec sheet. Scrolls sideways on narrow screens rather than collapsing.
 *
 * The table is one entry — the `plans` block draws it, because its header row
 * and its body share columns and cannot be split into separately movable
 * pieces. The feature rows (`features`, with a per-plan `values` array) are
 * read alongside it exactly as before.
 */
function PricingTable ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })
  const primary = ds?.colors?.primary ?? "var(--primary)"
  const props = instance.props
  const popularLabel = textProp(props, "popularLabel", FALLBACK.popular)
  const featuresColumn = textProp(props, "featuresColumnLabel", FALLBACK.featuresColumn)

  return (
    <section className="bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-start gap-4"
          align="left"
          entryClassName={stretchItems}
          overrides={{
            headline: headlineWithFallback({
              headline: "Full feature",
              accentWord: "comparison",
              className: `${TYPE_H2} text-foreground`,
            }),
            description: textWithFallback({
              propKey: "description",
              fallback: "Everything you need, clearly laid out. Start free, upgrade anytime.",
              className: `${TYPE_LEAD} max-w-xl`,
            }),
          }}
          renderItems={({ instance: inst }) => {
            const plans = readItems<Plan>(inst.props, "plans")
            const features = readItems<FeatureRow>(inst.props, "features")
            return (
              <div className="mt-10 overflow-x-auto rounded-[var(--radius-xl)] border border-border bg-card">
                <table className="min-w-[640px] w-full text-start border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-[240px] px-6 py-5 text-sm font-medium text-muted-foreground">{featuresColumn}</th>
                      {plans.map((plan, i) => (
                        <th
                          key={i}
                          className="px-6 py-5 text-center"
                          style={plan.isPopular ? { background: "color-mix(in oklch, var(--muted) 60%, transparent)" } : {}}
                        >
                          {plan.isPopular && (
                            <div className="mb-1 text-[13px] font-medium" style={{ color: primary }}>
                              {popularLabel}
                            </div>
                          )}
                          <PlanText
                            as="div"
                            instance={inst}
                            isPreview={isPreview}
                            index={i}
                            field="name"
                            value={plan.name}
                            className="font-heading text-base font-semibold text-foreground"
                          />
                          <div className="flex items-baseline justify-center gap-0.5 mt-1">
                            <span className="font-heading text-[26px] font-semibold text-foreground tracking-[-0.03em]">
                              <PlanText instance={inst} isPreview={isPreview} index={i} field="price" value={plan.price} />
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                              <PlanText instance={inst} isPreview={isPreview} index={i} field="priceSuffix" value={plan.priceSuffix} />
                            </span>
                          </div>
                          <PlanCta
                            instance={inst}
                            isPreview={isPreview}
                            index={i}
                            plan={plan}
                            className="mt-3 inline-flex items-center justify-center w-full h-9 rounded-lg text-[13px] font-semibold transition-colors"
                            style={
                              plan.isPopular
                                ? { background: primary, color: "var(--primary-foreground)" }
                                : { border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)" }
                            }
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((row, ri) => (
                      <tr key={ri} className="border-b border-border last:border-0">
                        <td className="px-6 py-3.5">
                          {row.category && (
                            <div className="text-xs text-muted-foreground mb-0.5">{row.category}</div>
                          )}
                          <div className="text-sm text-foreground">{row.label}</div>
                        </td>
                        {(row.values ?? []).map((val, vi) => (
                          <td
                            key={vi}
                            className="px-6 py-3.5 text-center"
                            style={plans[vi]?.isPopular ? { background: "color-mix(in oklch, var(--muted) 60%, transparent)" } : {}}
                          >
                            {typeof val === "boolean"
                              ? val
                                ? <Check className="size-4 mx-auto text-foreground" aria-label="Included" />
                                : <Minus className="size-4 mx-auto text-muted-foreground/60" aria-label="Not included" />
                              : <span className="text-[13px] text-foreground">{val}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const pricingTableSection = defineSection({
  id: "pricing-table",
  displayName: "Matrix",
  description: "Full feature matrix — plans across the top, grouped features down the side. Scrolls on mobile.",
  category: "pricing",
  layoutArchetype: "matrix",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "enterprise", "finance", "startup", "agency"],
  trustWeight: 30,
  conversionWeight: 95,
  funnelStage: "decision",
  styles: ["corporate", "minimal", "modern"],
  goals: ["sales", "conversion"],
  complexity: "high",
  density: "high",
  imageRequired: false,
  mobileScore: 60,
  editable: true,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return pricingTableSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...pricingHeaderBlocks({ eyebrow: false }),
      plansBlock({
        label: "Plans",
        fields: ["name", "price", "priceSuffix", "isPopular", "ctaLabel", "ctaHref"],
        minItems: 2,
        maxItems: 4,
        newItem: () => ({ name: "Plan", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "", ctaLabel: "Get started", ctaHref: "#", isPopular: false }),
      }),
    ],
    settings: [
      labelSetting("featuresColumnLabel", "Features column heading", FALLBACK.featuresColumn),
      labelSetting("popularLabel", "Popular badge", FALLBACK.popular),
    ],
  },
  defaultProps: {
    headline: "Full feature",
    accentWord: "comparison",
    description: "Everything in every plan, laid out line by line. Start free and upgrade whenever you are ready.",
    plans: [
      { name: "Starter", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "For individuals.", ctaLabel: "Start free", ctaHref: "#", isPopular: false },
      { name: "Pro", price: "$29", priceSuffix: "/mo", annualPrice: "$19", description: "For growing teams.", ctaLabel: "Start free trial", ctaHref: "#", isPopular: true },
      { name: "Business", price: "$99", priceSuffix: "/mo", annualPrice: "$79", description: "For organisations.", ctaLabel: "Talk to sales", ctaHref: "#", isPopular: false },
    ],
    features: [
      { category: "Usage", label: "Websites", values: ["1", "10", "Unlimited"] },
      { category: "", label: "Team members", values: ["1", "5", "Unlimited"] },
      { category: "", label: "Custom domains", values: [false, true, true] },
      { category: "Growth", label: "Analytics dashboard", values: [true, true, true] },
      { category: "", label: "Form submissions", values: [false, true, true] },
      { category: "", label: "A/B testing", values: [false, false, true] },
      { category: "Support", label: "Priority support", values: [false, true, true] },
      { category: "", label: "Single sign-on", values: [false, false, true] },
      { category: "", label: "Uptime SLA", values: [false, false, true] },
    ],
  },
  Component: PricingTable,
})
