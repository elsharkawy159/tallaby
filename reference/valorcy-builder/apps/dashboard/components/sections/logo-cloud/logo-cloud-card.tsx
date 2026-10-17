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
 * Cabinet — contained archetype.
 *
 * The whole cloud sits inside one elevated rounded card. The card surface is
 * chrome; the slot is its child list.
 */
function LogoCloudCard ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="card"
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
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
                  {logos.map((logo, i) => (
                    <div
                      key={i}
                      data-element-collection="logos"
                      data-element-index={String(i)}
                      data-element-item-label-prop="name"
                      className="flex items-center justify-center grayscale opacity-70 transition hover:opacity-100 hover:grayscale-0"
                    >
                      <LogoMark
                        instance={inst}
                        logo={logo}
                        index={i}
                        isPreview={isPreview}
                        imgClassName="h-7 w-auto max-w-[6rem] object-contain"
                        nameClassName="text-sm font-semibold tracking-tight text-foreground/80"
                      />
                    </div>
                  ))}
                </div>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const logoCloudCardSection = defineSection({
  id: "logo-cloud-card",
  displayName: "Cabinet",
  description: "Logos gathered inside one elevated rounded card with a soft shadow.",
  category: "logo-cloud",
  layoutArchetype: "contained",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "finance"],
  styles: ["modern", "corporate"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 93,
  editable: true,
  tags: ["logos", "trust", "card"],
  trustWeight: 72,
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_MEDIUM,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "card", label: "Card", isDefault: true }],
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
    eyebrow: "In good company",
    logos: sampleLogos(6),
  },
  Component: LogoCloudCard,
})
