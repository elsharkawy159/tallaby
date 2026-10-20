"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import { CENTERED_HEADER, ItemText, labelSetting, stretchItems, textOf } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CaseStudy = {
  logoUrl?: string
  company?: string
  industry?: string
  challenge?: string
  result?: string
  stat?: string
  statLabel?: string
  href?: string
}

/**
 * Casebook — grid archetype.
 *
 * A centered header over a grid of case-study cards: client logo and industry
 * on a ruled top bar, then challenge, result and one hero figure. The card
 * labels ("Challenge", "Result", the link text) are section settings that fall
 * back to the copy this section always rendered.
 */
function ContentCaseStudy ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className={CENTERED_HEADER}
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const items = (inst.props.items as CaseStudy[] | undefined) ?? []
            if (items.length === 0) return null
            const challengeLabel = textOf(inst.props, "challengeLabel", "Challenge")
            const resultLabel = textOf(inst.props, "resultLabel", "Result")
            const linkLabel = textOf(inst.props, "linkLabel", "Read case study")
            return (
              <div className="mt-9 grid grid-cols-1 gap-6 text-start md:grid-cols-2 lg:grid-cols-3">
                {items.map((cs, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
                      {cs.logoUrl ? (
                        <SectionEditableImage
                          instanceId={inst.id}
                          elementKey={`items.${i}.logoUrl`}
                          src={cs.logoUrl}
                          alt={cs.company ?? ""}
                          collectionKey="items"
                          collectionIndex={i}
                          itemSrcProp="logoUrl"
                          isPreview={isPreview}
                          className="h-7 w-auto object-contain"
                        />
                      ) : (
                        <ItemText
                          instance={inst}
                          collection="items"
                          index={i}
                          field="company"
                          value={cs.company}
                          isPreview={isPreview}
                          className="text-base font-semibold text-foreground"
                        />
                      )}
                      {cs.industry ? (
                        <ItemText
                          instance={inst}
                          collection="items"
                          index={i}
                          field="industry"
                          value={cs.industry}
                          isPreview={isPreview}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">{challengeLabel}</p>
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="challenge"
                          value={cs.challenge}
                          elementId={`challenge${i}`}
                          isPreview={isPreview}
                          className="text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-primary">{resultLabel}</p>
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="result"
                          value={cs.result}
                          elementId={`result${i}`}
                          isPreview={isPreview}
                          className="text-sm font-medium text-foreground"
                        />
                      </div>

                      {cs.stat ? (
                        <div className="mt-auto rounded-xl bg-primary/[0.08] p-4">
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="items"
                            index={i}
                            field="stat"
                            value={cs.stat}
                            isPreview={isPreview}
                            className="text-3xl font-semibold text-primary"
                          />
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="items"
                            index={i}
                            field="statLabel"
                            value={cs.statLabel}
                            isPreview={isPreview}
                            className="text-xs text-muted-foreground"
                          />
                        </div>
                      ) : null}

                      {cs.href ? (
                        <a
                          href={cs.href}
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-70"
                        >
                          {linkLabel}
                        </a>
                      ) : null}
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

export const contentCaseStudySection = defineSection({
  id: "content-case-study",
  displayName: "Casebook",
  description: "Grid of client case studies — logo, challenge, result and one hero figure per card.",
  category: "content",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "web_dev_service", "creative", "it_support", "saas", "enterprise"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["trust", "leads", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 85,
  trustWeight: 90,
  tags: ["case-study", "portfolio", "agency", "results", "proof"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "items",
        key: "items",
        canonical: "cards",
        label: "Case studies",
        pick: [],
        itemPlaceholder: "logo",
        itemFields: [
          { key: "logoUrl", label: "Client logo", type: "image", canonical: "image" },
          { key: "company", label: "Company name", type: "text", canonical: "brandName", maxLength: 40 },
          { key: "industry", label: "Industry", type: "text", aiHint: "Industry or vertical (e.g. SaaS, Ecommerce)", maxLength: 30 },
          { key: "challenge", label: "Challenge", type: "textarea", aiHint: "The problem the client had (1-2 sentences)", maxLength: 160 },
          { key: "result", label: "Result", type: "textarea", aiHint: "What you delivered (1-2 sentences)", maxLength: 160 },
          { key: "stat", label: "Hero stat", type: "text", aiHint: "Big number or metric (e.g. 3×, +62%)", maxLength: 15 },
          { key: "statLabel", label: "Stat label", type: "text", aiHint: "What the stat measures", maxLength: 50 },
          { key: "href", label: "Case study link", type: "url", canonical: "ctaLink" },
        ],
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ logoUrl: "", company: "Client", industry: "Industry", challenge: "The challenge they faced.", result: "The outcome we delivered.", stat: "+X%", statLabel: "Key metric", href: "" }),
      },
    ],
    settings: [
      labelSetting("challengeLabel", "Challenge label"),
      labelSetting("resultLabel", "Result label"),
      labelSetting("linkLabel", "Case study link label"),
    ],
  },
  defaultProps: {
    eyebrow: "Client work",
    headline: "Results our clients can measure",
    description: "A few recent engagements, the problem we were brought in to solve, and what changed afterwards.",
    challengeLabel: "Challenge",
    resultLabel: "Result",
    linkLabel: "Read case study",
    items: [
      { logoUrl: "", company: "Northwind", industry: "Ecommerce", challenge: "Checkout abandonment was climbing every quarter.", result: "Rebuilt the checkout as a single, mobile-first step.", stat: "+38%", statLabel: "Completed orders", href: "#" },
      { logoUrl: "", company: "Fieldstone", industry: "SaaS", challenge: "Trial users rarely reached the product's core feature.", result: "Redesigned onboarding around one guided first project.", stat: "2.4×", statLabel: "Trial-to-paid conversion", href: "#" },
      { logoUrl: "", company: "Harbor Health", industry: "Healthcare", challenge: "Patients struggled to book appointments online.", result: "Launched a booking flow that works in under a minute.", stat: "-62%", statLabel: "Phone bookings", href: "#" },
    ],
  },
  Component: ContentCaseStudy,
})
