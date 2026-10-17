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
 * Spine — side-label archetype.
 *
 * A rotated label on a side rail, a hairline divider, then logos flowing to the
 * end. The divider belongs to the logo entry, so it travels with the logos when
 * the two are reordered.
 */
function LogoCloudVerticalLabel ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="row"
          className="flex items-center gap-6 sm:gap-10"
          align="left"
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items"
              ? "flex flex-1 items-center gap-6 sm:gap-10"
              : undefined
          }
          overrides={{
            label: labelOverride(
              "shrink-0 rotate-180 text-xs font-semibold text-primary [writing-mode:vertical-rl]",
              isPreview,
              "span"
            ),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <>
                <div className="h-16 w-px shrink-0 bg-border/70" aria-hidden />
                <div className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-5">
                  {logos.map((logo, i) => (
                    <div
                      key={i}
                      data-element-collection="logos"
                      data-element-index={String(i)}
                      data-element-item-label-prop="name"
                      className="flex items-center justify-center grayscale opacity-65 transition hover:opacity-100 hover:grayscale-0"
                    >
                      <LogoMark
                        instance={inst}
                        logo={logo}
                        index={i}
                        isPreview={isPreview}
                        imgClassName="h-7 w-auto max-w-[6rem] object-contain"
                        nameClassName="text-sm font-semibold text-foreground/75"
                      />
                    </div>
                  ))}
                </div>
              </>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudVerticalLabelSection = defineSection({
  id: "logo-cloud-vertical-label",
  displayName: "Spine",
  description: "A rotated label and hairline divider on a side rail, logos flowing beside it.",
  category: "logo-cloud",
  layoutArchetype: "side-label",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "creative", "startup", "generic"],
  styles: ["editorial", "modern", "minimal"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["logos", "trust", "vertical"],
  trustWeight: 62,
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_MEDIUM,
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "row", label: "Row", isDefault: true, eject: { direction: "row" } }],
    blocks: [
      labelBlock("label", {
        label: "Vertical label",
        aiHint: "Short trusted-by label (1–2 words)",
        maxLength: 20,
      }),
      logosBlock({ minItems: 2, maxItems: 10 }),
    ],
  },
  defaultProps: {
    label: "Trusted by",
    logos: sampleLogos(5),
  },
  Component: LogoCloudVerticalLabel,
})
