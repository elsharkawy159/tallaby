"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD, SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { PropSpan, isBlockHidden, propText, textOverride } from "@/components/sections/social-proof/social-proof-parts"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { NoteBlock } from "@/components/sections/schema/section-schema"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** The three flat stat pairs this section has always stored. */
type StatIndex = 1 | 2 | 3

/**
 * Tally — statement archetype.
 *
 * Two or three oversized numbers in one centered row, the first in the brand
 * colour. The pairs are stored as flat `statNValue` / `statNLabel` props, so each
 * pair is drawn by its value block (the label block is an inspector field the
 * value carries, like a flat button's link). That keeps every pair one entry in
 * the row: reorder or hide a stat and its label moves with it.
 */
function SocialProofNumbers ({ instance, isPreview, definition }: SectionComponentProps) {
  const { ds } = useSectionSurface({ instanceId: instance.id })

  const statOverride = (n: StatIndex): BlockOverride =>
    function StatPair ({ instance: inst }) {
      if (propText(inst, `stat${n}Value`) === undefined && propText(inst, `stat${n}Label`) === undefined) {
        return null
      }
      return (
        <div className="flex flex-col items-center gap-1">
          <div
            className="text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
            style={{ color: n === 1 ? ds?.colors?.primary : undefined }}
          >
            <PropSpan instance={inst} propKey={`stat${n}Value`} isPreview={isPreview} />
          </div>
          {!isBlockHidden(inst, "stats", `stat${n}Label`) && (
            <p className="text-sm text-muted-foreground">
              <PropSpan instance={inst} propKey={`stat${n}Label`} isPreview={isPreview} />
            </p>
          )}
        </div>
      )
    }

  return (
    // Padding is applied directly rather than through the section surface, as it
    // always has been — saved pages keep their exact spacing.
    <section className="bg-background" style={SECTION_PADDING_STANDARD}>
      <SectionContainer className="flex flex-col gap-10 text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-4"
          align="center"
          overrides={{
            eyebrow: textOverride({
              key: "eyebrow",
              className: "text-xs font-semibold text-muted-foreground",
              isPreview,
            }),
          }}
        />
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="stats"
          className="flex flex-wrap items-center justify-center gap-12 lg:gap-20"
          align="center"
          overrides={{
            stat1Value: statOverride(1),
            stat1Label: () => null,
            stat2Value: statOverride(2),
            stat2Label: () => null,
            stat3Value: statOverride(3),
            stat3Label: () => null,
          }}
        />
      </SectionContainer>
    </section>
  )
}

function statBlocks (n: StatIndex): NoteBlock[] {
  return [
    {
      kind: "note",
      id: `stat${n}Value`,
      label: `Stat ${n}`,
      slot: "stats",
      field: { key: `stat${n}Value`, label: `Stat ${n} value`, type: "text", maxLength: 16 },
    },
    {
      kind: "note",
      id: `stat${n}Label`,
      label: `Stat ${n} label`,
      slot: "stats",
      field: { key: `stat${n}Label`, label: `Stat ${n} label`, type: "text", maxLength: 40 },
    },
  ]
}

export const socialProofNumbersSection = defineSection({
  id: "social-proof-numbers",
  displayName: "Tally",
  description: "Two or three oversized headline numbers in one centered row.",
  category: "social-proof",
  layoutArchetype: "statement",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "generic", "finance", "education", "nonprofit"],
  trustWeight: 85,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["bold", "modern", "minimal", "corporate"],
  goals: ["trust", "conversion", "brand", "awareness"],
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
      { id: "copy", label: "Copy", isDefault: true },
      { id: "stats", label: "Stats", eject: { direction: "row" } },
    ],
    blocks: [
      {
        kind: "eyebrow",
        field: {
          key: "eyebrow",
          label: "Eyebrow",
          canonical: "eyebrow",
          aiHint: "Short label above the headline (1–3 words, sentence case)",
          maxLength: 30,
          group: "content",
        },
      },
      ...statBlocks(1),
      ...statBlocks(2),
      ...statBlocks(3),
    ],
  },
  defaultProps: {
    eyebrow: "By the numbers",
    stat1Value: "12,000+",
    stat1Label: "Teams onboard",
    stat2Value: "4.9/5",
    stat2Label: "Average rating",
    stat3Value: "99.99%",
    stat3Label: "Uptime last year",
  },
  Component: SocialProofNumbers,
})
