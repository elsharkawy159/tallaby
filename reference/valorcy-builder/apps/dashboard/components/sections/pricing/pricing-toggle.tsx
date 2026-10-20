"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
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
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** Copy that pages saved before the slot migration rendered as hardcoded text. */
const FALLBACK = {
  monthly: "Monthly",
  annual: "Annual",
  billedAnnually: "Billed annually",
  popular: "Most popular",
} as const

/**
 * Cadence — tabs archetype.
 *
 * Three plans behind a monthly / annual switch: the switch flips every plan
 * between `price` and `annualPrice`. Signature move: one joined panel split
 * into columns by hairlines (not three floating cards), the recommended plan on
 * a muted tint. The switch is a slot entry (the
 * `savingsBadge` block draws the whole control) so it can sit above or below
 * the copy; its state lives here so the cards can read it.
 */
function PricingToggle ({ instance, isPreview, definition }: SectionComponentProps) {
  const [isAnnual, setIsAnnual] = useState(false)
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })
  const primary = ds?.colors?.primary ?? "var(--primary)"
  const props = instance.props
  const popularLabel = textProp(props, "popularLabel", FALLBACK.popular)
  const billedAnnually = textProp(props, "billedAnnuallyLabel", FALLBACK.billedAnnually)

  return (
    <section className="relative bg-background" style={rootStyle}>
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
              headline: "Flexible plans for",
              accentWord: "every team",
              className: `${TYPE_H2} text-foreground`,
            }),
            description: textWithFallback({
              propKey: "description",
              fallback: "Switch to annual billing and save up to 35%.",
              className: `${TYPE_LEAD} max-w-md mx-auto`,
            }),
            savingsBadge: ({ instance: inst }) => {
              const write = (t: string) =>
                useBuilderStore.getState().updateSectionProps(inst.id, { savingsBadge: t })
              return (
                <div className="mt-3 inline-flex items-center gap-3">
                  <span className={`text-[14px] font-medium transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
                    {textProp(inst.props, "monthlyLabel", FALLBACK.monthly)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAnnual(!isAnnual)}
                    className="relative w-12 h-6 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ background: isAnnual ? primary : "var(--border)" }}
                    aria-label="Toggle billing period"
                    aria-pressed={isAnnual}
                  >
                    <span className={`absolute top-0.5 start-0.5 size-5 rounded-full bg-background shadow transition-transform ${isAnnual ? "translate-x-6 rtl:-translate-x-6" : "translate-x-0"}`} />
                  </button>
                  <span className={`text-[14px] font-medium transition-colors flex items-center gap-1.5 ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
                    {textProp(inst.props, "annualLabel", FALLBACK.annual)}
                    <span className="text-[13px] font-medium" style={{ color: primary }}>
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::savingsBadge`}
                        data-element-type="text"
                        value={textProp(inst.props, "savingsBadge", "Save 35%")}
                        isPreview={isPreview}
                        onChange={write}
                        onCommit={write}
                      />
                    </span>
                  </span>
                </div>
              )
            },
          }}
          renderItems={({ instance: inst }) => (
            <div className="mt-10 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-[var(--radius-xl)] border border-border text-start md:grid-cols-3 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
              {readItems<Plan>(inst.props, "plans").map((plan, i) => (
                <div
                  key={i}
                  className={`relative flex flex-col p-8 ${plan.isPopular ? "bg-muted/50" : "bg-card"}`}
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
                      <PlanText
                        key={isAnnual ? "annual" : "monthly"}
                        instance={inst}
                        isPreview={isPreview}
                        index={i}
                        field={isAnnual ? "annualPrice" : "price"}
                        value={isAnnual ? plan.annualPrice : plan.price}
                      />
                    </span>
                    <span className="text-[15px] text-muted-foreground">{plan.priceSuffix}</span>
                  </div>
                  {isAnnual && plan.annualPrice !== plan.price && (
                    <p className="text-sm text-muted-foreground mb-1">{billedAnnually}</p>
                  )}
                  <PlanText
                    as="p"
                    instance={inst}
                    isPreview={isPreview}
                    index={i}
                    field="description"
                    value={plan.description}
                    className="text-[14px] text-muted-foreground leading-[1.55] mb-6 mt-2"
                  />
                  <div className="my-4 h-px bg-border" />
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

export const pricingToggleSection = defineSection({
  id: "pricing-toggle",
  displayName: "Cadence",
  description: "Three plan cards behind a monthly / annual switch, with a savings badge on annual.",
  category: "pricing",
  layoutArchetype: "tabs",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "generic", "enterprise", "education"],
  trustWeight: 30,
  conversionWeight: 90,
  funnelStage: "decision",
  styles: ["modern", "minimal"],
  goals: ["sales", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...pricingHeaderBlocks(),
      {
        kind: "note",
        id: "savingsBadge",
        label: "Billing switch",
        field: { key: "savingsBadge", label: "Savings badge text", maxLength: 20 },
      },
      plansBlock({
        fields: [
          "name",
          { key: "price", label: "Monthly price", type: "text" },
          "priceSuffix",
          { key: "annualPrice", label: "Annual price (per month)", type: "text" },
          "description",
          { key: "isPopular", label: "Popular (accent border)", type: "switch" },
          "ctaLabel",
          "ctaHref",
        ],
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ name: "Plan", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "Plan description.", features: ["Feature one"], ctaLabel: "Get started", ctaHref: "#", isPopular: false }),
      }),
    ],
    settings: [
      labelSetting("monthlyLabel", "Monthly label", FALLBACK.monthly),
      labelSetting("annualLabel", "Annual label", FALLBACK.annual),
      labelSetting("billedAnnuallyLabel", "Billed annually note", FALLBACK.billedAnnually),
      labelSetting("popularLabel", "Popular badge", FALLBACK.popular),
    ],
  },
  defaultProps: {
    eyebrow: "Pricing",
    headline: "Flexible plans for",
    accentWord: "every team",
    description: "Pay monthly, or switch to annual billing and keep more of your budget.",
    savingsBadge: "Save 35%",
    plans: [
      { name: "Starter", price: "$0", priceSuffix: "/mo", annualPrice: "$0", description: "Everything you need to launch your first site.", features: ["1 website", "Free SSL", "Basic analytics", "Community support"], ctaLabel: "Start free", ctaHref: "#", isPopular: false },
      { name: "Pro", price: "$29", priceSuffix: "/mo", annualPrice: "$19", description: "For growing businesses that need more room.", features: ["10 websites", "Custom domains", "Advanced analytics", "Form submissions", "Remove branding", "Priority support"], ctaLabel: "Start free trial", ctaHref: "#", isPopular: true },
      { name: "Business", price: "$99", priceSuffix: "/mo", annualPrice: "$79", description: "For teams managing many sites together.", features: ["Unlimited websites", "Team seats", "Role permissions", "Single sign-on", "Dedicated success manager"], ctaLabel: "Talk to sales", ctaHref: "#", isPopular: false },
    ],
  },
  Component: PricingToggle,
})
