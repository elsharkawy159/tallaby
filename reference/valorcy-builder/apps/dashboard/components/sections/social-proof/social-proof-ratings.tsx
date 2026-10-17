"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD, SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { PropText, StarGlyphs, propText, textOverride } from "@/components/sections/social-proof/social-proof-parts"
import type { BadgeBlock } from "@/components/sections/schema/section-schema"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const BADGE_CLASS = "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground"

/**
 * Verdict — centered archetype.
 *
 * One aggregate score, set huge, with its star row and review count beneath and
 * the platforms it came from as pills. The star row is drawn with the score so
 * the two never separate; the pills live in their own row slot so they wrap
 * side by side and reorder among themselves.
 */
function SocialProofRatings ({ instance, isPreview, definition }: SectionComponentProps) {
  const { ds } = useSectionSurface({ instanceId: instance.id })

  return (
    // Padding is applied directly rather than through the section surface, as it
    // always has been — saved pages keep their exact spacing.
    <section className="bg-background" style={SECTION_PADDING_STANDARD}>
      <SectionContainer className="flex flex-col items-center gap-8 text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-4"
          align="center"
          overrides={{
            rating: ({ instance: inst }) => {
              if (propText(inst, "rating") === undefined) return null
              return (
                <div className="flex flex-col items-center gap-4">
                  <PropText
                    instance={inst}
                    propKey="rating"
                    as="div"
                    className="text-6xl font-semibold tracking-tight text-foreground"
                    isPreview={isPreview}
                  />
                  <StarGlyphs className="text-3xl" style={{ color: ds?.colors?.primary }} />
                </div>
              )
            },
            reviewCount: textOverride({
              key: "reviewCount",
              className: "text-sm text-muted-foreground",
              isPreview,
            }),
          }}
        />
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="badges"
          className="flex flex-wrap items-center justify-center gap-3"
          overrides={{
            badge1: textOverride({ key: "badge1", as: "div", className: BADGE_CLASS, isPreview }),
            badge2: textOverride({ key: "badge2", as: "div", className: BADGE_CLASS, isPreview }),
            badge3: textOverride({ key: "badge3", as: "div", className: BADGE_CLASS, isPreview }),
          }}
        />
      </SectionContainer>
    </section>
  )
}

function badgeBlock (n: 1 | 2 | 3, aiHint: string): BadgeBlock {
  return {
    kind: "badge",
    id: `badge${n}`,
    label: `Badge ${n}`,
    slot: "badges",
    field: { key: `badge${n}`, label: `Badge ${n}`, type: "text", canonical: "badge", aiHint, maxLength: 30, group: "content" },
  }
}

export const socialProofRatingsSection = defineSection({
  id: "social-proof-ratings",
  displayName: "Verdict",
  description: "One huge aggregate score with stars, a review count and platform pills.",
  category: "social-proof",
  layoutArchetype: "centered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "ecommerce", "startup", "enterprise", "generic", "fitness", "education"],
  trustWeight: 85,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["minimal", "modern", "corporate", "bold"],
  goals: ["trust", "conversion", "sales", "leads"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Score", isDefault: true },
      { id: "badges", label: "Platform badges", eject: { direction: "row" } },
    ],
    blocks: [
      {
        kind: "note",
        id: "rating",
        label: "Rating",
        field: { key: "rating", label: "Rating number", type: "text", canonical: "body", aiHint: "Rating value (e.g. 4.9)", maxLength: 5, group: "content" },
      },
      {
        kind: "note",
        id: "reviewCount",
        label: "Review count",
        field: { key: "reviewCount", label: "Review count label", type: "text", canonical: "body", aiHint: "Review count (e.g. 2,400 reviews)", maxLength: 30, group: "content" },
      },
      badgeBlock(1, "Platform badge label (e.g. G2 Leader)"),
      badgeBlock(2, "Platform badge label"),
      badgeBlock(3, "Platform badge label"),
    ],
  },
  defaultProps: {
    rating: "4.9",
    reviewCount: "Based on 2,400+ verified reviews",
    badge1: "G2 Leader 2025",
    badge2: "Capterra Best Value",
    badge3: "Trustpilot Excellent",
  },
  Component: SocialProofRatings,
})
