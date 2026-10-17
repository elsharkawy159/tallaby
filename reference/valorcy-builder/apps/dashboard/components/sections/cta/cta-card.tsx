"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionCard } from "@/components/sections/_primitives/section-card"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM, TYPE_BODY } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Vault — contained archetype.
 *
 * The CTA sits inside a solid muted panel rather than across the page, so it
 * reads as a quiet aside between dense content instead of a full stop. The card
 * is the chrome; its child list is the slot.
 */
function CtaCard ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative" style={rootStyle}>
      <SectionContainer>
        <SectionCard variant="muted" pad="lg" rounded="2xl" className="sm:p-14">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="card"
            className="flex flex-col items-center gap-5 text-center"
            align="center"
            headingClassName={`${TYPE_H2_SM} max-w-2xl text-foreground`}
            bodyClassName={`${TYPE_BODY} max-w-md`}
            ctaClassName="mt-2"
          />
        </SectionCard>
      </SectionContainer>
    </section>
  )
}

export const ctaCardSection = defineSection({
  id: "cta-card",
  displayName: "Vault",
  description: "Contained closer: the call to action held in a quiet muted panel.",
  category: "cta",
  layoutArchetype: "contained",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "finance", "enterprise", "nonprofit", "education", "real_estate"],
  trustWeight: 15,
  conversionWeight: 88,
  funnelStage: "decision",
  styles: ["minimal", "modern", "corporate"],
  goals: ["conversion", "leads", "trust"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 97,
  editable: true,
  tags: ["card", "contained", "subtle"],
  recommendedNeighbors: { before: ["features-grid", "testimonials-grid", "pricing-table"], after: ["footer-minimal"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "card", label: "Card", isDefault: true }],
    blocks: [
      { kind: "badge", id: "eyebrow", label: "Eyebrow", field: { key: "eyebrow", canonical: "eyebrow" } },
      { kind: "heading", level: 2, accent: false },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 3 },
      { kind: "note", label: "Small note (below buttons)" },
    ],
  },
  defaultProps: {
    eyebrow: "Next step",
    headline: "Take the next step today",
    description: "Start your free trial in minutes. No credit card required, cancel anytime.",
    buttons: [
      { label: "Start free trial", href: "#", variant: "primary" },
      { label: "Book a demo", href: "#", variant: "outline" },
    ],
    note: "Trusted by 2,000+ teams worldwide.",
  },
  Component: CtaCard,
})
