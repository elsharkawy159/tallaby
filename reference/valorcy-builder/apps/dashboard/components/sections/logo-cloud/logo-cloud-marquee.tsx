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
  type LogoItem,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

/** One looping row. Logos render twice so the -50% translate loops seamlessly. */
function MarqueeRow ({
  instance,
  logos,
  isPreview,
  animation,
  opacity,
}: {
  instance: SectionInstance
  logos: LogoItem[]
  isPreview?: boolean
  animation: string
  opacity: string
}) {
  const doubled = [...logos, ...logos]
  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-8" style={{ animation, width: "max-content" }}>
        {doubled.map((logo, i) => (
          <div
            key={i}
            data-element-collection="logos"
            data-element-index={String(i % logos.length)}
            data-element-item-label-prop="name"
            className={`flex shrink-0 items-center justify-center grayscale ${opacity}`}
          >
            <LogoMark
              instance={instance}
              logo={logo}
              index={i % logos.length}
              isPreview={isPreview}
              fallback="box"
              boxClassName="h-7 w-20 rounded bg-muted"
              imgClassName="h-7 w-auto max-w-[6rem] object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Crosscurrent — dual-marquee archetype.
 *
 * Two rows of the same logos drifting in opposite directions at different
 * speeds — the motion is the section's identity, so the rows are chrome around
 * the single `logos` collection.
 */
function LogoCloudMarquee ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes marquee-reverse { from { transform: translateX(-50%) } to { transform: translateX(0) } }
      `}</style>
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
            return (
              <div className="space-y-4 overflow-hidden">
                <MarqueeRow
                  instance={inst}
                  logos={logos}
                  isPreview={isPreview}
                  animation="marquee 30s linear infinite"
                  opacity="opacity-60"
                />
                <MarqueeRow
                  instance={inst}
                  logos={logos}
                  isPreview={isPreview}
                  animation="marquee-reverse 25s linear infinite"
                  opacity="opacity-50"
                />
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudMarqueeSection = defineSection({
  id: "logo-cloud-marquee",
  displayName: "Crosscurrent",
  description: "Two rows of logos drifting in opposite directions for a lively trust display.",
  category: "logo-cloud",
  layoutArchetype: "dual-marquee",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "ecommerce"],
  trustWeight: 75,
  conversionWeight: 25,
  funnelStage: "awareness",
  styles: ["modern", "bold", "dark"],
  goals: ["trust", "brand", "awareness", "engagement"],
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
      logosBlock({ minItems: 4, maxItems: 20 }),
    ],
  },
  defaultProps: {
    eyebrow: "Powering teams worldwide",
    logos: sampleLogos(8),
  },
  Component: LogoCloudMarquee,
})
