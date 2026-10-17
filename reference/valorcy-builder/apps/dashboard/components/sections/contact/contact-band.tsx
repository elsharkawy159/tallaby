"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { noteBlock, textOverride } from "@/components/sections/contact/contact-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** What a page saved before the slot migration rendered while `line` was unset. */
const LINE_FALLBACK = "Lorem ipsum dolor sit amet, consectetur adipiscing elit."

/**
 * Ticker — strip archetype.
 *
 * One line of copy on a muted band, meant to sit between sections ("Questions?
 * We reply within the hour"). The band is chrome; the line is the slot's entry,
 * so a link or button can be dropped beside it.
 */
function ContactBand ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })

  return (
    <section className="bg-muted/70" style={rootStyle}>
      <SectionContainer className="text-center text-sm">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-2"
          align="center"
          overrides={{ line: textOverride("line", LINE_FALLBACK, "", isPreview) }}
        />
      </SectionContainer>
    </section>
  )
}

export const contactBandSection = defineSection({
  id: "contact-band",
  displayName: "Ticker",
  description: "Thin muted strip carrying one line — a reply-time promise or a quick way to reach you.",
  category: "contact",
  layoutArchetype: "strip",
  industries: ["saas", "agency", "startup", "enterprise", "generic"],
  styles: ["modern", "minimal", "bold"],
  goals: ["leads", "conversion", "bookings"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["contact", "cta", "inline"],
  conversionWeight: 80,
  funnelStage: "decision",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "center", paddingY: "sm" },
  schema: {
    slots: [{ id: "copy", label: "Strip", isDefault: true }],
    blocks: [noteBlock("line", "Line", { maxLength: 160 })],
  },
  defaultProps: {
    line: "Questions before you start? Email hello@yourcompany.com — we reply within one business hour.",
  },
  Component: ContactBand,
})
