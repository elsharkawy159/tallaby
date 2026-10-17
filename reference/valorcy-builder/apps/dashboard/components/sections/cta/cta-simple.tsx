"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CtaChecklist, trustItemsBlock } from "@/components/sections/cta/cta-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Beacon — centered archetype.
 *
 * The universal closer: one centered column of copy, buttons, and a row of trust
 * points underneath, on a plain surface. Signature move: restraint, nothing but
 * the words and the action. Everything in the column is a slot entry the user
 * can reorder, hide or add to.
 */
function CtaSimple ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-6 text-center"
          align="center"
          headingClassName={`${TYPE_H2} max-w-3xl text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-2xl`}
          renderItems={({ instance: inst }) => (
            <CtaChecklist
              instance={inst}
              isPreview={isPreview}
              className="flex flex-wrap justify-center gap-5"
              itemClassName="text-muted-foreground"
            />
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const ctaSimpleSection = defineSection({
  id: "cta-simple",
  displayName: "Beacon",
  description: "Centered closer — headline, buttons and a row of trust points on a soft glow.",
  category: "cta",
  layoutArchetype: "centered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "startup", "agency", "generic", "enterprise", "finance", "nonprofit", "dentist", "real_estate", "law"],
  trustWeight: 15,
  conversionWeight: 85,
  funnelStage: "decision",
  styles: ["modern", "minimal", "corporate"],
  goals: ["conversion", "leads", "sales"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 98,
  editable: true,
  tags: ["centered", "trust", "universal"],
  recommendedNeighbors: { before: ["features-grid", "pricing-table", "testimonials-grid"], after: ["footer-minimal"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "badge", id: "eyebrow", label: "Eyebrow", field: { key: "eyebrow", canonical: "eyebrow" } },
      { kind: "heading", level: 2, accent: false },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 3 },
      trustItemsBlock(["Free 14-day trial", "No credit card required", "Cancel anytime"]),
    ],
  },
  defaultProps: {
    eyebrow: "Get started",
    headline: "Ready to see it in action?",
    description: "Join thousands of teams already building with us. Set up in minutes — free to start.",
    buttons: [
      { label: "Start free", href: "#", variant: "primary" },
      { label: "Talk to sales", href: "#", variant: "outline" },
    ],
  },
  Component: CtaSimple,
})
