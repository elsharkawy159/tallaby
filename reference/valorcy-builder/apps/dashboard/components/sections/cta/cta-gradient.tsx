"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_DISPLAY, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Crescendo — statement archetype.
 *
 * The loudest closer in the catalog, made loud by type alone: an oversized,
 * start-aligned headline under one hard rule, the way a poster ends. Signature
 * move: display-scale type; no gradients, glows or orbs. The copy column is a slot.
 */
function CtaGradient ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start gap-7 border-t border-foreground pt-10"
          align="left"
          headingClassName={`${TYPE_DISPLAY} max-w-5xl text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-xl`}
          ctaClassName="mt-2"
        />
      </SectionContainer>
    </section>
  )
}

export const ctaGradientSection = defineSection({
  id: "cta-gradient",
  displayName: "Crescendo",
  description: "Statement closer: an oversized, start-aligned headline under one hard rule.",
  category: "cta",
  layoutArchetype: "statement",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "creative", "agency", "generic", "travel", "event"],
  trustWeight: 15,
  conversionWeight: 85,
  funnelStage: "decision",
  styles: ["bold", "editorial", "modern", "minimal"],
  goals: ["conversion", "brand", "awareness", "sales"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  tags: ["statement", "oversized", "typographic"],
  recommendedNeighbors: { before: ["features-grid", "testimonials-grid", "pricing-table"], after: ["footer-minimal"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "xl" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "badge", id: "eyebrow", label: "Eyebrow", field: { key: "eyebrow", canonical: "eyebrow" } },
      { kind: "heading", level: 2, accent: true },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 3 },
    ],
  },
  defaultProps: {
    eyebrow: "Your move",
    headline: "The last website builder",
    accentWord: "you'll ever need",
    description: "Thousands of teams already ship faster with an AI-powered builder. Join them today.",
    buttons: [
      { label: "Start building free", href: "#", variant: "primary" },
      { label: "See examples", href: "#", variant: "outline" },
    ],
  },
  Component: CtaGradient,
})
