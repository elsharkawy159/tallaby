"use client"

import { Check } from "lucide-react"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionLink } from "@/components/website-builder/section-link"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  eyebrowPill,
  headlineWithFallback,
  pricingHeaderBlocks,
  textWithFallback,
} from "@/components/sections/pricing/pricing-parts"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type SinglePlan = {
  name?: string
  price?: string
  priceSuffix?: string
  description?: string
  features?: string[]
  ctaLabel?: string
  ctaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
}

/**
 * Solo — contained archetype.
 *
 * One plan, one price, one decision. Signature move: the price itself is the
 * headline, set at display size in the heading font inside one plain card, with
 * the full feature list and a single action. For products with a
 * single tier or a trial offer.
 *
 * The plan is stored as one `plan` object rather than a collection, so the card
 * is chrome between two slots — its fields are edited in place, written back
 * into that object — while the copy above it and the small print below it are
 * slot entries.
 */
function PlanCard ({ instance, isPreview, primary }: { instance: SectionInstance; isPreview?: boolean; primary: string }) {
  const raw = instance.props.plan
  const plan: SinglePlan = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as SinglePlan) : {}
  const write = (key: keyof SinglePlan) => (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { plan: { ...plan, [key]: t } })
  const edit = (key: keyof SinglePlan, elementKey: string, className?: string) => (
    <InlineEditableText
      as="span"
      data-element-id={`${instance.id}::${elementKey}`}
      data-element-type="text"
      className={className}
      value={String(plan[key] ?? "")}
      isPreview={isPreview}
      onChange={write(key)}
      onCommit={write(key)}
    />
  )

  return (
    <div
      className="rounded-[var(--radius-2xl)] border border-border bg-card p-10 md:p-14"
    >
      <div className="font-heading text-lg font-semibold text-foreground mb-4">
        {edit("name", "planName")}
      </div>
      <div className="flex items-end justify-center gap-1.5 mb-4">
        <span className="font-heading text-[clamp(4rem,8vw,6rem)] font-semibold tracking-[-0.04em] leading-none text-foreground">
          {edit("price", "planPrice")}
        </span>
        <span className="text-lg text-muted-foreground pb-2">{edit("priceSuffix", "planPriceSuffix")}</span>
      </div>
      <InlineEditableText
        as="p"
        data-element-id={`${instance.id}::planDescription`}
        data-element-type="text"
        className="mx-auto max-w-md text-base text-muted-foreground leading-[1.6] mb-10"
        value={String(plan.description ?? "")}
        isPreview={isPreview}
        onChange={write("description")}
        onCommit={write("description")}
      />

      <div className="mx-auto grid max-w-xl grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-10 text-start">
        {(plan.features ?? []).map((f, fi) => (
          <div key={fi} className="flex items-center gap-2.5">
            <Check className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
            <span className="text-[15px] text-foreground">{f}</span>
          </div>
        ))}
      </div>

      <SectionLink
        link={linkValueFromProp(plan.ctaHref)}
        isPreview={isPreview}
        className="inline-flex items-center justify-center w-full max-w-xs mx-auto h-12 px-8 rounded-lg text-[15px] font-semibold transition-colors"
        style={{ background: primary, color: "var(--primary-foreground)" }}
      >
        {edit("ctaLabel", "planCtaLabel")}
      </SectionLink>
      {plan.secondaryCtaLabel && (
        <div className="mt-4">
          <SectionLink
            link={linkValueFromProp(plan.secondaryCtaHref)}
            isPreview={isPreview}
            className="text-[14px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            {edit("secondaryCtaLabel", "planSecondaryCtaLabel")}
          </SectionLink>
        </div>
      )}
    </div>
  )
}

function PricingSingle ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })
  const primary = ds?.colors?.primary ?? "var(--primary)"

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="text-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="mb-10 flex flex-col items-center gap-5"
            align="center"
            overrides={{
              eyebrow: eyebrowPill({ primary, fallback: "One simple price" }),
              headline: headlineWithFallback({
                headline: "Everything included,",
                accentWord: "no surprises",
                className: `${TYPE_H2} text-foreground`,
              }),
            }}
          />

          <PlanCard instance={instance} isPreview={isPreview} primary={primary} />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="footer"
            className="mt-6 flex flex-col items-center gap-2"
            align="center"
            overrides={{
              footerNote: textWithFallback({
                propKey: "footerNote",
                fallback: "14-day free trial · No credit card required · Cancel anytime",
                className: "text-[13px] text-muted-foreground",
              }),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const pricingSingleSection = defineSection({
  id: "pricing-single",
  displayName: "Solo",
  description: "One plan in one card — a large centered price, the full feature list and a single action.",
  category: "pricing",
  layoutArchetype: "contained",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "creative", "portfolio", "generic", "education"],
  trustWeight: 30,
  conversionWeight: 90,
  funnelStage: "decision",
  styles: ["minimal", "modern", "bold"],
  goals: ["conversion", "sales"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "footer", label: "Small print" },
    ],
    blocks: [
      ...pricingHeaderBlocks({ description: false }),
      {
        kind: "note",
        id: "footerNote",
        label: "Footer note",
        slot: "footer",
        field: { key: "footerNote", label: "Footer note", type: "text" },
      },
    ],
  },
  defaultProps: {
    eyebrow: "One simple price",
    headline: "Everything included,",
    accentWord: "no surprises",
    footerNote: "14-day free trial · No credit card required · Cancel anytime",
    plan: {
      name: "All access",
      price: "$29",
      priceSuffix: "/mo",
      description: "Every feature, every template and every integration — one plan, billed monthly.",
      features: [
        "Unlimited pages", "Custom domain", "Free SSL",
        "Advanced analytics", "Form submissions", "Blog & CMS",
        "Remove branding", "Team collaboration", "Priority support",
        "Daily backups",
      ],
      ctaLabel: "Start your free trial",
      ctaHref: "#",
      secondaryCtaLabel: "Compare with free",
      secondaryCtaHref: "#",
    },
  },
  Component: PricingSingle,
})
