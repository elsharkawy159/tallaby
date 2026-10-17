"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import type { SectionBlock } from "@/components/sections/schema/section-schema"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Folio — editorial archetype.
 *
 * A headline over three paragraphs of prose in the page column, set in a
 * reading size. No chrome at all: the typography is the design. Each
 * paragraph is its own entry, so a user can reorder, hide or add to them.
 */
function ContentLongform ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-6"
          align="left"
          headingLevel={1}
          headingClassName={`${TYPE_H2} mb-2 text-foreground`}
          bodyClassName={`${TYPE_LEAD}`}
        />
      </SectionContainer>
    </section>
  )
}

const paragraph = (n: number): SectionBlock => ({
  kind: "body",
  id: `body${n}`,
  label: `Paragraph ${n}`,
  field: { key: `body${n}`, label: `Paragraph ${n}`, type: "textarea", maxLength: 600 },
})

export const contentLongformSection = defineSection({
  id: "content-longform",
  displayName: "Folio",
  description: "Article prose — a headline over paragraphs of body copy in the reading column.",
  category: "content",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "portfolio", "agency", "startup", "enterprise", "generic", "nonprofit", "education", "creative"],
  trustWeight: 30,
  conversionWeight: 15,
  funnelStage: "awareness",
  styles: ["editorial", "minimal", "modern", "corporate"],
  goals: ["brand", "education", "awareness", "trust"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Article", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        level: 1,
        accent: false,
        fields: { headline: { key: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80 } },
      },
      paragraph(1),
      paragraph(2),
      paragraph(3),
    ],
  },
  defaultProps: {
    headline: "Why we build software the slow way",
    body1:
      "Every product decision we make starts with a conversation, not a spreadsheet. We sit with the people who will use what we build, watch where they hesitate, and write down what they never think to mention.",
    body2:
      "That patience shows up later as fewer rewrites and calmer launches. A feature that ships a week later but never needs an apology is, in our experience, the faster path every time.",
    body3:
      "It also means we say no more often than we say yes. The work we take on gets our full attention — and the teams we work with know exactly who to call when something matters.",
  },
  Component: ContentLongform,
})
