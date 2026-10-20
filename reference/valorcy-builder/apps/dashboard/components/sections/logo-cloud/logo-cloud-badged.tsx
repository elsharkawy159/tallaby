"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  LogoMark,
  labelBlock,
  labelOverride,
  logosBlock,
  readLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Roster — captioned-grid archetype.
 *
 * A grid of logo tiles, each with a short caption underneath ("since 2019",
 * "10k seats") — the caption is what separates it from Lattice.
 */
function LogoCloudBadged ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
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
              "text-center text-xs font-semibold text-muted-foreground",
              isPreview
            ),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {logos.map((logo, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      data-element-collection="logos"
                      data-element-index={String(i)}
                      data-element-item-label-prop="name"
                      className="flex h-16 w-full items-center justify-center rounded-xl border border-border bg-card p-4 grayscale opacity-70 transition-all hover:opacity-100 hover:grayscale-0"
                    >
                      <LogoMark
                        instance={inst}
                        logo={logo}
                        index={i}
                        isPreview={isPreview}
                        fallback="box"
                        imgClassName="h-8 w-auto max-w-[7rem] object-contain"
                      />
                    </div>
                    {logo.badge ? (
                      <ItemText
                        instance={inst}
                        collection="logos"
                        index={i}
                        field="badge"
                        value={logo.badge}
                        className="text-xs text-muted-foreground"
                        isPreview={isPreview}
                      />
                    ) : null}
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

export const logoCloudBadgedSection = defineSection({
  id: "logo-cloud-badged",
  displayName: "Roster",
  description: "Logo tiles in a grid, each captioned with a short credential underneath.",
  category: "logo-cloud",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "enterprise", "agency", "startup", "generic", "finance", "ecommerce"],
  trustWeight: 75,
  conversionWeight: 25,
  funnelStage: "awareness",
  styles: ["modern", "minimal", "corporate"],
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
      logosBlock({
        minItems: 2,
        maxItems: 12,
        extraFields: [
          {
            key: "badge",
            label: "Badge text",
            type: "text",
            canonical: "badge",
            aiHint: "Pill label (1–4 words)",
            maxLength: 30,
            group: "content",
          },
        ],
        newItem: () => ({ name: "Company", badge: "since 2024" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Long-standing partners",
    logos: [
      { name: "Northwind", badge: "since 2019" },
      { name: "Lumen", badge: "12k seats" },
      { name: "Arcadia", badge: "since 2020" },
      { name: "Vertex", badge: "40 countries" },
      { name: "Halcyon", badge: "since 2021" },
      { name: "Quarry", badge: "8k seats" },
      { name: "Brightline", badge: "since 2022" },
      { name: "Solace", badge: "Fortune 500" },
    ],
  },
  Component: LogoCloudBadged,
})
