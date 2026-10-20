"use client"

import { Check } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PlanCta,
  PlanText,
  eyebrowPill,
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

/**
 * Each tier sits a step higher than the last on wide screens, so the progression
 * reads as a staircase. Keyed to the tier index; extra tiers stay on the top step.
 */
const TIER_STEPS = ["xl:mt-18", "xl:mt-12", "xl:mt-6", "xl:mt-0"]

const POPULAR_FALLBACK = "Popular"

/**
 * Ladder — ladder archetype.
 *
 * Four compact tiers in one row (two by two on tablets). Signature move: the row
 * is a staircase, each tier set a step higher than the last, so the progression
 * reads at a glance without colour coding. Cards show at most four features:
 * this layout is for scanning, not for detail.
 */
function PricingTierCards ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })
  const primary = ds?.colors?.primary ?? "var(--primary)"
  const popularLabel = textProp(instance.props, "popularLabel", POPULAR_FALLBACK)

  return (
    <section className="bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center gap-4 text-center"
          align="center"
          entryClassName={stretchItems}
          overrides={{
            eyebrow: eyebrowPill({ primary, fallback: "Plans" }),
            headline: headlineWithFallback({
              headline: "Start free, scale",
              accentWord: "without limits",
              className: `${TYPE_H2} text-foreground`,
            }),
            description: textWithFallback({
              propKey: "description",
              fallback: "From solo builders to enterprise teams — a tier for every stage.",
              className: `${TYPE_LEAD} max-w-lg mx-auto`,
            }),
          }}
          renderItems={({ instance: inst }) => (
            <div className="mt-12 grid grid-cols-1 items-start gap-4 text-start sm:grid-cols-2 xl:grid-cols-4">
              {readItems<Plan>(inst.props, "plans").map((plan, i) => {
                return (
                  <div
                    key={i}
                    className={`relative flex flex-col rounded-[var(--radius-xl)] bg-background ${TIER_STEPS[i] ?? "xl:mt-0"}`}
                    style={plan.isPopular ? { outline: `2px solid ${primary}`, outlineOffset: "-2px" } : undefined}
                  >
                    <div className="p-7 flex flex-col flex-1">
                      <div className="mb-3 flex items-baseline justify-between gap-2">
                        <PlanText instance={inst} isPreview={isPreview} index={i} field="name" value={plan.name} className="font-heading text-base font-semibold text-foreground" />
                        {plan.isPopular && (
                          <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: primary }}>
                            {popularLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-0.5 mb-1">
                        <span className="font-heading text-[38px] font-semibold tracking-[-0.03em] leading-none text-foreground">
                          <PlanText instance={inst} isPreview={isPreview} index={i} field="price" value={plan.price} />
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                          <PlanText instance={inst} isPreview={isPreview} index={i} field="priceSuffix" value={plan.priceSuffix} />
                        </span>
                      </div>
                      <PlanText
                        as="p"
                        instance={inst}
                        isPreview={isPreview}
                        index={i}
                        field="description"
                        value={plan.description}
                        className="text-sm text-muted-foreground leading-[1.5] mb-5"
                      />
                      <ul className="flex-1 flex flex-col gap-2.5 mb-6">
                        {(plan.features ?? []).slice(0, 4).map((f, fi) => (
                          <li key={fi} className="flex items-center gap-2">
                            <Check className="size-3.5 flex-shrink-0 text-muted-foreground" aria-hidden />
                            <span className="text-sm text-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <PlanCta
                        instance={inst}
                        isPreview={isPreview}
                        index={i}
                        plan={plan}
                        className="w-full h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors"
                        style={
                          plan.isPopular
                            ? { background: primary, color: "var(--primary-foreground)" }
                            : { border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)" }
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const pricingTierCardsSection = defineSection({
  id: "pricing-tier-cards",
  displayName: "Ladder",
  description: "Four compact tiers in a row, each marked by its own colour bar.",
  category: "pricing",
  layoutArchetype: "ladder",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["app_landing", "saas", "startup", "enterprise", "agency", "generic", "finance", "fitness", "dentist", "event", "travel"],
  trustWeight: 30,
  conversionWeight: 90,
  funnelStage: "decision",
  styles: ["modern", "minimal", "corporate"],
  goals: ["sales", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...pricingHeaderBlocks(),
      plansBlock({
        label: "Plans",
        fields: [
          "name",
          "price",
          "priceSuffix",
          "description",
          { key: "isPopular", label: "Popular (accent fill)", type: "switch" },
          "ctaLabel",
          "ctaHref",
        ],
        minItems: 2,
        maxItems: 4,
        newItem: () => ({ name: "Tier", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "Tier description.", features: ["Feature one", "Feature two", "Feature three"], ctaLabel: "Get started", ctaHref: "#", isPopular: false }),
      }),
    ],
    settings: [labelSetting("popularLabel", "Popular badge", POPULAR_FALLBACK)],
  },
  defaultProps: {
    eyebrow: "Plans",
    headline: "Start free, scale",
    accentWord: "without limits",
    description: "From solo builders to enterprise teams — a tier for every stage of growth.",
    plans: [
      { name: "Free", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "Try everything on one site.", features: ["1 website", "Free subdomain", "Community support"], ctaLabel: "Start free", ctaHref: "#", isPopular: false },
      { name: "Starter", price: "$12", priceSuffix: "/mo", annualPrice: "$9", description: "Launch with your own domain.", features: ["3 websites", "Custom domain", "Basic analytics"], ctaLabel: "Choose Starter", ctaHref: "#", isPopular: false },
      { name: "Pro", price: "$29", priceSuffix: "/mo", annualPrice: "$19", description: "Grow with every tool unlocked.", features: ["10 websites", "Advanced analytics", "Form submissions", "Priority support"], ctaLabel: "Choose Pro", ctaHref: "#", isPopular: true },
      { name: "Enterprise", price: "$99", priceSuffix: "/mo", annualPrice: "$79", description: "Control and scale for large teams.", features: ["Unlimited websites", "Single sign-on", "Audit log", "Dedicated manager"], ctaLabel: "Talk to sales", ctaHref: "#", isPopular: false },
    ],
  },
  Component: PricingTierCards,
})
