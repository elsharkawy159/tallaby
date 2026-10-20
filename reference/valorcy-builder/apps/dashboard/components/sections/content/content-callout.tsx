"use client"

import type { CSSProperties } from "react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD, SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Marginalia — minimal archetype.
 *
 * One declarative statement set large and italic against a brand-coloured
 * rule, its attribution underneath. The rule is the only chrome; the
 * statement and the attribution are slot entries.
 */
function ContentCallout ({ instance, isPreview, definition }: SectionComponentProps) {
  return (
    <section className="bg-background" style={SECTION_PADDING_STANDARD as CSSProperties}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-4 border-s-4 border-primary ps-6"
          align="left"
          bodyClassName="text-xl font-medium italic leading-8 text-foreground md:text-2xl"
          noteClassName="text-sm text-muted-foreground"
        />
      </SectionContainer>
    </section>
  )
}

export const contentCalloutSection = defineSection({
  id: "content-callout",
  displayName: "Marginalia",
  description: "A single large italic statement on a brand-coloured rule, with its attribution.",
  category: "content",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["generic", "creative", "portfolio", "agency", "nonprofit", "education", "startup"],
  trustWeight: 30,
  conversionWeight: 15,
  funnelStage: "awareness",
  styles: ["editorial", "minimal", "modern", "bold"],
  goals: ["brand", "trust", "awareness", "education"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Statement", isDefault: true }],
    blocks: [
      {
        kind: "body",
        id: "statement",
        label: "Statement",
        field: {
          key: "statement",
          label: "Statement text",
          type: "textarea",
          canonical: "body",
          aiHint: "Bold declarative statement (5–12 words)",
          maxLength: 120,
          group: "content",
        },
      },
      {
        kind: "note",
        id: "attribution",
        label: "Attribution",
        field: {
          key: "attribution",
          label: "Attribution",
          type: "text",
          canonical: "body",
          aiHint: "Attribution line — name or source",
          maxLength: 60,
          group: "content",
        },
      },
    ],
  },
  defaultProps: {
    statement: "Good design is invisible until it is missing.",
    attribution: "— From our design principles",
  },
  Component: ContentCallout,
})
