"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM, TYPE_BODY } from "@/components/sections/_primitives/type-scale"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Whisper — minimal archetype.
 *
 * Type and one action, nothing else: no glow, no card, no band. For pages whose
 * design is already doing the persuading and only need a quiet sign-off.
 *
 * The headline is bound to `title`, the key this section has always stored.
 * The description and button blocks are absent from pages saved before the slot
 * migration, and an absent block renders nothing — those pages are unchanged.
 */
function CtaMinimal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-4 text-center"
          align="center"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} max-w-lg`}
          ctaClassName="mt-1"
        />
      </SectionContainer>
    </section>
  )
}

export const ctaMinimalSection = defineSection({
  id: "cta-minimal",
  displayName: "Whisper",
  description: "Quiet sign-off — one line of type and a single action.",
  category: "cta",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  industries: ["saas", "startup", "portfolio", "creative", "agency", "generic"],
  styles: ["minimal", "modern"],
  goals: ["leads", "conversion", "sales"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 98,
  editable: true,
  tags: ["cta", "minimal", "conversion"],
  conversionWeight: 85,
  funnelStage: "decision",
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: { headline: { key: "title", label: "Title", maxLength: 60 } },
      },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 2 },
    ],
  },
  defaultProps: {
    title: "Have a project in mind?",
    description: "We reply to every message within one business day.",
    buttons: [{ label: "Get in touch", href: "#", variant: "primary" }],
  },
  Component: CtaMinimal,
})
