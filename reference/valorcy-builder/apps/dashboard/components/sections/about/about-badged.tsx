"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { propTextOverride } from "@/components/sections/about/about-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Masthead — minimal archetype.
 *
 * A small tag and one line of type: the lightest way to open an about page or
 * label a story block further down it. The headline is bound to `title`, the
 * key this section has always stored.
 */
function AboutBadged ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          align="left"
          headingClassName={`${TYPE_H2}`}
          overrides={{
            badge: propTextOverride(
              "badge",
              "mb-2 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary",
              { as: "span", isPreview }
            ),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const aboutBadgedSection = defineSection({
  id: "about-badged",
  displayName: "Masthead",
  description: "A small tag over one line of type — the lightest possible story opener.",
  category: "about",
  layoutArchetype: "minimal",
  industries: ["saas", "startup", "agency", "creative", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["brand", "trust", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["about", "brand"],
  funnelStage: "awareness",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "badge",
        field: { key: "badge", label: "Badge", aiHint: "Pill label (1–4 words)", maxLength: 30 },
      },
      {
        kind: "heading",
        id: "title",
        level: 2,
        accent: false,
        fields: {
          headline: { key: "title", label: "Title", aiHint: "Section title (4–8 words)", maxLength: 60 },
        },
      },
    ],
  },
  defaultProps: {
    badge: "Our story",
    title: "Built by people who care about craft",
  },
  Component: AboutBadged,
})
