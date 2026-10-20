"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_RELAXED } from "@/components/sections/section-style-presets"
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
 * Pennant — banner archetype.
 *
 * A full-bleed band in the brand colour: the label on the start side, inverted
 * logos on the end side. Label and logos share one row, so they can swap.
 */
function LogoCloudBanner ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false, defaultColor: "var(--primary-foreground)" } })

  return (
    <section className="bg-primary text-primary-foreground" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="row"
          className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between"
          align="left"
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full sm:flex-1" : undefined
          }
          overrides={{
            label: labelOverride(
              "shrink-0 text-sm font-semibold text-primary-foreground/80",
              isPreview,
              "span"
            ),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-end">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="flex items-center justify-center opacity-80 transition hover:opacity-100"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-6 w-auto max-w-[5.5rem] object-contain brightness-0 invert"
                      nameClassName="text-[13px] font-semibold text-primary-foreground/85"
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

export const logoCloudBannerSection = defineSection({
  id: "logo-cloud-banner",
  displayName: "Pennant",
  description: "Brand-colour band — a label on one side, inverted logos on the other.",
  category: "logo-cloud",
  layoutArchetype: "banner",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "agency", "generic"],
  styles: ["bold", "modern", "corporate"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["logos", "trust", "banner", "band"],
  trustWeight: 66,
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_RELAXED,
  defaultOptions: { align: "start", paddingY: "sm" },
  schema: {
    slots: [{ id: "row", label: "Row", isDefault: true, eject: { direction: "row" } }],
    blocks: [
      labelBlock("label", {
        label: "Label",
        aiHint: "Short trusted-by label (2–4 words)",
        maxLength: 30,
      }),
      logosBlock({ minItems: 2, maxItems: 10 }),
    ],
  },
  defaultProps: {
    label: "Trusted by",
    logos: sampleLogos(5),
  },
  Component: LogoCloudBanner,
})
