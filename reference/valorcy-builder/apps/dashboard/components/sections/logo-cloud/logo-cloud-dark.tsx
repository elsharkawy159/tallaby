"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
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
 * Eclipse — inverted archetype.
 *
 * An inverted band (the site foreground as the surface) with logos knocked out of
 * it. Uses the inverted semantic pair, so it follows every palette and flips
 * correctly in dark mode. Signature move: the inversion itself; no tiles.
 */
function LogoCloudDark ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false, defaultColor: "var(--background)" } })

  return (
    <section className="bg-foreground text-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-10"
          align="center"
          overrides={{
            eyebrow: labelOverride(
              "text-center text-sm font-medium text-background/60",
              isPreview
            ),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="flex h-12 items-center justify-center opacity-70"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      fallback="box"
                      boxClassName="h-6 w-24 rounded bg-background/25"
                      imgClassName="h-8 w-auto max-w-[7rem] object-contain brightness-0 invert"
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

export const logoCloudDarkSection = defineSection({
  id: "logo-cloud-dark",
  displayName: "Eclipse",
  description: "Near-black band of translucent tiles with logos inverted to white.",
  category: "logo-cloud",
  layoutArchetype: "inverted",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "creative", "tech"],
  trustWeight: 75,
  conversionWeight: 25,
  funnelStage: "awareness",
  styles: ["dark", "bold", "modern"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow text",
        aiHint: "Short label above the headline (1–3 words, sentence case)",
        maxLength: 30,
      }),
      logosBlock({ minItems: 2, maxItems: 16, imageLabel: "Logo image (will be inverted white)" }),
    ],
  },
  defaultProps: {
    eyebrow: "Built with the best",
    logos: sampleLogos(8),
  },
  Component: LogoCloudDark,
})
