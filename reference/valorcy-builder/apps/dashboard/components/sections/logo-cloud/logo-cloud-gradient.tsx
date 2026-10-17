"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  LogoMark,
  labelBlock,
  labelOverride,
  logosBlock,
  readLogos,
  sampleLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Expanse — full-bleed archetype (id kept from its old name, Aurora).
 *
 * An edge-to-edge muted band with larger logos spread across the full width.
 * Signature move: scale and spread, no tiles, no gradient. Pennant is the brand
 * band and Eclipse the inverted one.
 */
function LogoCloudGradient ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })

  return (
    <section
      className="relative overflow-hidden"
      style={{
        ...rootStyle,
        background: "var(--muted)",
      }}
    >
      <SectionContainer className="relative text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-8"
          align="center"
          overrides={{
            eyebrow: labelOverride("text-sm font-medium text-muted-foreground", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 lg:justify-between">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="flex items-center justify-center opacity-80"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-9 w-auto max-w-[8rem] object-contain grayscale"
                      nameClassName="font-heading text-xl font-semibold text-foreground"
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

export const logoCloudGradientSection = defineSection({
  id: "logo-cloud-gradient",
  displayName: "Expanse",
  description: "Edge-to-edge muted band with large logos spread across the full width.",
  category: "logo-cloud",
  layoutArchetype: "full-bleed",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "creative", "agency", "tech", "generic"],
  styles: ["minimal", "bold", "modern"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 91,
  editable: true,
  tags: ["logos", "trust", "gradient"],
  trustWeight: 68,
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow",
        aiHint: "Short label above the logos (3–6 words)",
        maxLength: 40,
      }),
      logosBlock({ minItems: 3, maxItems: 12 }),
    ],
  },
  defaultProps: {
    eyebrow: "Chosen by ambitious teams",
    logos: sampleLogos(6),
  },
  Component: LogoCloudGradient,
})
