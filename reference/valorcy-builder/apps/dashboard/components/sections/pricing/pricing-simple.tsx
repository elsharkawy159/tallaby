"use client"

import { Check } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
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

const POPULAR_FALLBACK = "Most popular"

/**
 * Trio — grid archetype.
 *
 * The default pricing page: a centered header over three plan cards. Signature
 * move: the recommended plan is marked by a brand-colour border and a plain label,
 * nothing glowing. The cards are the `plans` collection; the header lines are
 * slot entries the user can reorder, hide or add to.
 */
function PricingSimple ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })
  const primary = ds?.colors?.primary ?? "var(--primary)"
  const popularLabel = textProp(instance.props, "popularLabel", POPULAR_FALLBACK)

  return (
    <section className="relative bg-muted/30" style={rootStyle}>
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
            eyebrow: eyebrowPill({ primary, fallback: "Pricing" }),
            headline: headlineWithFallback({
              headline: "Simple, transparent",
              accentWord: "pricing",
              className: `${TYPE_H2} text-foreground`,
            }),
            description: textWithFallback({
              propKey: "description",
              fallback: "No hidden fees. No surprises. Pick a plan and start building today.",
              className: `${TYPE_LEAD} max-w-xl mx-auto`,
            }),
          }}
          renderItems={({ instance: inst }) => (
            <div className="mt-12 grid grid-cols-1 gap-5 text-start md:grid-cols-3">
              {readItems<Plan>(inst.props, "plans").map((plan, i) => (
                <div
                  key={i}
                  className="relative flex flex-col rounded-[var(--radius-xl)] p-8 bg-card"
                  style={{
                    border: plan.isPopular ? `2px solid ${primary}` : "1px solid var(--border)",
                  }}
                >
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <PlanText instance={inst} isPreview={isPreview} index={i} field="name" value={plan.name} className="font-heading text-lg font-semibold text-foreground" />
                    {plan.isPopular && (
                      <span className="text-sm font-medium whitespace-nowrap" style={{ color: primary }}>
                        {popularLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-5xl font-semibold tracking-[-0.03em] leading-none text-foreground">
                      <PlanText instance={inst} isPreview={isPreview} index={i} field="price" value={plan.price} />
                    </span>
                    <span className="text-[15px] text-muted-foreground">
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
                    className="text-[14px] text-muted-foreground leading-[1.55] mb-6"
                  />
                  <div className="my-5 h-px bg-border" />
                  <ul className="flex-1 flex flex-col gap-3 mb-7">
                    {(plan.features ?? []).map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2.5">
                        <Check className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
                        <span className="text-[14px] text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <PlanCta
                    instance={inst}
                    isPreview={isPreview}
                    index={i}
                    plan={plan}
                    className="w-full h-11 rounded-lg flex items-center justify-center text-[15px] font-semibold transition-colors"
                    style={
                      plan.isPopular
                        ? { background: primary, color: "var(--primary-foreground)" }
                        : { border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)" }
                    }
                  />
                </div>
              ))}
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const pricingSimpleSection = defineSection({
  id: "pricing-simple",
  displayName: "Trio",
  description: "Three plan cards under a centered header — the popular plan lifted by an accent border.",
  category: "pricing",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "startup", "agency", "generic", "enterprise", "education"],
  trustWeight: 30,
  conversionWeight: 90,
  funnelStage: "decision",
  styles: ["modern", "minimal", "corporate"],
  goals: ["sales", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return pricingSimpleSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...pricingHeaderBlocks(),
      plansBlock({
        fields: [
          "name",
          "price",
          "priceSuffix",
          "annualPrice",
          "description",
          { key: "isPopular", label: "Popular (accent border)", type: "switch" },
          "ctaLabel",
          "ctaHref",
        ],
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ name: "Plan", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "Plan description.", features: ["Feature one", "Feature two"], ctaLabel: "Get started", ctaHref: "#", isPopular: false }),
      }),
    ],
    settings: [labelSetting("popularLabel", "Popular badge", POPULAR_FALLBACK)],
  },
  defaultProps: {
    eyebrow: "Pricing",
    headline: "Plans that grow",
    accentWord: "with you",
    description: "Start free, upgrade when you need more. Every plan includes hosting, SSL and support.",
    plans: [
      { name: "Starter", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "For personal projects and first launches.", features: ["1 website", "Custom subdomain", "Free SSL", "Basic analytics", "Community support"], ctaLabel: "Start free", ctaHref: "#", isPopular: false },
      { name: "Pro", price: "$29", priceSuffix: "/mo", annualPrice: "$19", description: "For growing businesses that need more.", features: ["10 websites", "Custom domains", "Advanced analytics", "Form submissions", "Remove branding", "Priority support"], ctaLabel: "Start free trial", ctaHref: "#", isPopular: true },
      { name: "Business", price: "$99", priceSuffix: "/mo", annualPrice: "$79", description: "For teams running many sites at scale.", features: ["Unlimited websites", "Team seats", "Role permissions", "Audit log", "Single sign-on", "Dedicated success manager", "99.9% uptime SLA"], ctaLabel: "Talk to sales", ctaHref: "#", isPopular: false },
    ],
  },
  Component: PricingSimple,
})
