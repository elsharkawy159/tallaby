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
 * Ticker — marquee archetype.
 *
 * A label over one continuously scrolling row of logos. The row is rendered
 * twice back to back so the loop is seamless; both copies edit the same item.
 */
function LogoCloudStrip ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-8"
          align="center"
          overrides={{
            eyebrow: labelOverride(
              "text-center text-xs font-semibold text-muted-foreground",
              isPreview
            ),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            const doubled = [...logos, ...logos]
            return (
              <div className="overflow-hidden">
                <div
                  className="flex items-center gap-10"
                  style={{ animation: "marquee 25s linear infinite", width: "max-content" }}
                >
                  {doubled.map((logo, i) => (
                    <div
                      key={i}
                      data-element-collection="logos"
                      data-element-index={String(i % logos.length)}
                      data-element-item-label-prop="name"
                      className="flex shrink-0 items-center justify-center grayscale opacity-60 transition-all hover:opacity-90 hover:grayscale-0"
                    >
                      <LogoMark
                        instance={inst}
                        logo={logo}
                        index={i % logos.length}
                        isPreview={isPreview}
                        fallback="box"
                        imgClassName="h-8 w-auto max-w-[6rem] object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudStripSection = defineSection({
  id: "logo-cloud-strip",
  displayName: "Ticker",
  description: "A label over one continuously scrolling row of customer logos.",
  category: "logo-cloud",
  layoutArchetype: "marquee",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "ecommerce"],
  trustWeight: 75,
  conversionWeight: 25,
  funnelStage: "awareness",
  styles: ["minimal", "modern", "corporate"],
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
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow text",
        aiHint: "Short label above the headline (1–3 words, sentence case)",
        maxLength: 30,
      }),
      logosBlock({ minItems: 3, maxItems: 16 }),
    ],
  },
  defaultProps: {
    eyebrow: "Trusted by teams at",
    logos: sampleLogos(8),
  },
  Component: LogoCloudStrip,
})
