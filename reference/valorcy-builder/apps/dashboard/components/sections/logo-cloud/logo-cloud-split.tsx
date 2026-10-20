"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
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
 * Meridian — split archetype.
 *
 * The argument on the start side (eyebrow, headline, supporting line), a
 * bordered logo grid on the end side. Two slots, one per column.
 */
function LogoCloudSplit ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="bg-muted/30" style={rootStyle}>
      <SectionContainer className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-3"
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} max-w-md`}
          overrides={{
            eyebrow: labelOverride("text-xs font-semibold text-primary", isPreview),
          }}
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="logos"
          className="flex flex-col gap-4"
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border sm:grid-cols-3">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="flex h-20 items-center justify-center border-b border-e border-border bg-background/40 p-5 grayscale opacity-70 transition hover:opacity-100 hover:grayscale-0"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-7 w-auto max-w-[6.5rem] object-contain"
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

export const logoCloudSplitSection = defineSection({
  id: "logo-cloud-split",
  displayName: "Meridian",
  description: "Headline and supporting copy on one side, a bordered logo grid on the other.",
  category: "logo-cloud",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "finance"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["logos", "trust", "split"],
  trustWeight: 70,
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "logos", label: "Logo grid" },
    ],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow",
        aiHint: "Short label above the headline (1–3 words)",
        maxLength: 30,
      }),
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: {
          headline: {
            key: "headline",
            label: "Headline",
            canonical: "headline",
            aiHint: "Trust-focused headline (6–10 words)",
            maxLength: 80,
            group: "content",
          },
        },
      },
      {
        kind: "body",
        id: "body",
        label: "Body",
        field: {
          key: "body",
          label: "Body",
          type: "textarea",
          canonical: "body",
          aiHint: "Supporting sentence about your customers (1–2 sentences)",
          maxLength: 200,
          group: "content",
        },
      },
      logosBlock({ minItems: 2, maxItems: 12, slot: "logos" }),
    ],
  },
  defaultProps: {
    eyebrow: "Customers",
    headline: "The platform behind fast-moving teams",
    body: "From seed-stage startups to public companies, thousands of teams run their sites on us.",
    logos: sampleLogos(6),
  },
  Component: LogoCloudSplit,
})
