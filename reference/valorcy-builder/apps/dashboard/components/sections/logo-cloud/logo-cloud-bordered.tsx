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
 * Gridline — divided-grid archetype.
 *
 * Logos in cells that share hairline rules instead of sitting in separate
 * cards — the structured, enterprise look.
 */
function LogoCloudBordered ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-10"
          align="center"
          overrides={{
            eyebrow: labelOverride("text-center text-sm font-medium text-muted-foreground", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              // Divided cell grid: hairline borders, no card fills.
              <div className="grid grid-cols-2 border-s border-t border-border sm:grid-cols-3 lg:grid-cols-4">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="flex h-24 items-center justify-center border-b border-e border-border grayscale opacity-70 transition hover:bg-muted/40 hover:opacity-100 hover:grayscale-0"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-8 w-auto max-w-[7rem] object-contain"
                      nameClassName="text-sm font-semibold tracking-tight text-foreground/80"
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

export const logoCloudBorderedSection = defineSection({
  id: "logo-cloud-bordered",
  displayName: "Gridline",
  description: "Logos in cells divided by hairline rules — clean, structured, enterprise-grade.",
  category: "logo-cloud",
  layoutArchetype: "divided-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "enterprise", "finance", "agency", "generic"],
  styles: ["minimal", "corporate", "modern"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 93,
  editable: true,
  tags: ["logos", "trust", "grid", "bordered"],
  trustWeight: 74,
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_MEDIUM,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow",
        aiHint: "Short label above the logos (4–7 words)",
        maxLength: 50,
      }),
      logosBlock({ minItems: 4, maxItems: 16 }),
    ],
  },
  defaultProps: {
    eyebrow: "Relied on by finance and operations teams",
    logos: sampleLogos(8),
  },
  Component: LogoCloudBordered,
})
