"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ProofLogoRow, logosBlock, textOverride } from "@/components/sections/social-proof/social-proof-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Roster — strip archetype.
 *
 * The quietest proof there is: a "trusted by" kicker over one row of grayscale
 * logos that warm up on hover. The row is a single `items` entry, so the kicker
 * can move below it or be hidden without touching the logos.
 */
function SocialProofLogos ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-8 text-center"
          align="center"
          overrides={{
            eyebrow: textOverride({
              key: "eyebrow",
              className: "text-xs font-semibold text-muted-foreground",
              isPreview,
            }),
          }}
          renderItems={({ instance: inst }) => (
            <ProofLogoRow
              instance={inst}
              isPreview={isPreview}
              className="flex flex-wrap items-center justify-center gap-8"
              itemClassName="flex items-center justify-center grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all"
              imgClassName="h-8 w-auto max-w-[6rem] object-contain"
              barClassName="h-8 w-24"
            />
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const socialProofLogosSection = defineSection({
  id: "social-proof-logos",
  displayName: "Roster",
  description: "Trusted-by kicker over a single row of grayscale customer logos.",
  category: "social-proof",
  layoutArchetype: "strip",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "finance", "education"],
  trustWeight: 85,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["minimal", "modern", "corporate", "editorial"],
  goals: ["trust", "brand", "awareness", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: {
          key: "eyebrow",
          label: "Eyebrow text",
          canonical: "eyebrow",
          aiHint: "Short label above the headline (1–3 words, sentence case)",
          maxLength: 30,
          group: "content",
        },
      },
      logosBlock({ maxItems: 12, newName: "Company Name" }),
    ],
  },
  defaultProps: {
    eyebrow: "Trusted by teams at",
    logos: [
      { name: "Northwind" },
      { name: "Lumen Labs" },
      { name: "Halcyon" },
      { name: "Brightline" },
      { name: "Fieldstone" },
      { name: "Corvid" },
    ],
  },
  Component: SocialProofLogos,
})
