"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  LogoMark,
  PropText,
  logosBlock,
  readLogos,
  sampleLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Tally — statement archetype.
 *
 * An oversized customer count is the headline; its label shares the baseline,
 * and the logo row sits underneath as proof. The slot is a wrapping baseline
 * row, so the number and its label stay on one line while the logos (and any
 * dropped element) take a full row of their own.
 */
function LogoCloudStat ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-wrap items-baseline justify-center gap-x-2"
          align="center"
          entryClassName={(entry) =>
            entry.kind === "node" || entry.block.kind === "items" ? "mt-10 basis-full" : undefined
          }
          overrides={{
            statValue: ({ instance: inst }) => (
              <PropText
                instance={inst}
                propKey="statValue"
                isPreview={isPreview}
                className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl"
              />
            ),
            statLabel: ({ instance: inst }) => (
              <PropText
                instance={inst}
                propKey="statLabel"
                isPreview={isPreview}
                className="text-base font-medium text-muted-foreground sm:text-lg"
              />
            ),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
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
                      nameClassName="text-[13px] font-semibold text-foreground/75"
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

export const logoCloudStatSection = defineSection({
  id: "logo-cloud-stat",
  displayName: "Tally",
  description: "An oversized customer count as the headline, with a logo row as proof beneath it.",
  category: "logo-cloud",
  layoutArchetype: "statement",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "agency", "generic", "finance"],
  styles: ["modern", "bold", "minimal"],
  goals: ["trust", "brand", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 94,
  editable: true,
  tags: ["logos", "trust", "stat"],
  trustWeight: 78,
  funnelStage: "consideration",
  defaultStyle: SECTION_PADDING_MEDIUM,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      {
        kind: "note",
        id: "statValue",
        label: "Stat value",
        field: {
          key: "statValue",
          label: "Stat value",
          type: "text",
          canonical: "headline",
          aiHint: "Big customer-count number (e.g. 4,000+)",
          maxLength: 12,
          group: "content",
        },
      },
      {
        kind: "note",
        id: "statLabel",
        label: "Stat label",
        field: {
          key: "statLabel",
          label: "Stat label",
          type: "text",
          canonical: "subheadline",
          aiHint: "What the number represents (4–8 words)",
          maxLength: 70,
          group: "content",
        },
      },
      logosBlock({ minItems: 3, maxItems: 12 }),
    ],
  },
  defaultProps: {
    statValue: "4,000+",
    statLabel: "teams ship their websites with us",
    logos: sampleLogos(6),
  },
  Component: LogoCloudStat,
})
