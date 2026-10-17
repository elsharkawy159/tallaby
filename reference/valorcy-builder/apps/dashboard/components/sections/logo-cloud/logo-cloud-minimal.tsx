"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_RELAXED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  LogoMark,
  logosBlock,
  readLogos,
  sampleLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Hush — minimal archetype.
 *
 * No label, no cards: one muted row of logos, the quietest possible trust
 * marker. The slot still accepts elements, so a label can be added by drop.
 */
function LogoCloudMinimal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-8"
          align="center"
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 opacity-60">
                {logos.map((logo, i) => (
                  <div key={i} className="flex items-center justify-center grayscale">
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-6 w-auto max-w-[5.5rem] object-contain"
                      nameClassName="text-sm font-semibold text-foreground/70"
                    />
                  </div>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudMinimalSection = defineSection({
  id: "logo-cloud-minimal",
  displayName: "Hush",
  description: "A bare, label-free row of muted logos — the quietest trust marker.",
  category: "logo-cloud",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "portfolio", "creative", "agency", "generic"],
  styles: ["minimal", "modern", "editorial"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["logos", "trust", "minimal"],
  trustWeight: 55,
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_RELAXED,
  defaultOptions: { align: "center", paddingY: "sm" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [logosBlock({ minItems: 2, maxItems: 10 })],
  },
  defaultProps: {
    logos: sampleLogos(5),
  },
  Component: LogoCloudMinimal,
})
