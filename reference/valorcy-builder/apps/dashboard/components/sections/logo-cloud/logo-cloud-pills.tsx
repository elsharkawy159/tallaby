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
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Pebbles — chips archetype.
 *
 * Each logo in its own rounded chip with a hairline border, wrapping freely —
 * reads as a tool stack, which suits integrations better than customers.
 */
function LogoCloudPills ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-8"
          align="center"
          overrides={{
            eyebrow: labelOverride(
              "text-xs font-semibold text-muted-foreground",
              isPreview
            ),
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 transition hover:border-primary/40 hover:shadow"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-5 w-auto max-w-[5rem] object-contain"
                      nameClassName="text-[13px] font-semibold tracking-tight text-foreground/80"
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

export const logoCloudPillsSection = defineSection({
  id: "logo-cloud-pills",
  displayName: "Pebbles",
  description: "Each logo in its own rounded chip — ideal for integrations and tool stacks.",
  category: "logo-cloud",
  layoutArchetype: "chips",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "tech", "software", "agency", "generic"],
  styles: ["modern", "playful", "minimal"],
  goals: ["trust", "brand", "engagement"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 94,
  editable: true,
  tags: ["logos", "integrations", "pills", "chips"],
  trustWeight: 60,
  funnelStage: "consideration",
  defaultStyle: SECTION_PADDING_MEDIUM,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow",
        aiHint: "Short label above the pills (3–6 words)",
        maxLength: 40,
      }),
      logosBlock({
        minItems: 3,
        maxItems: 18,
        nameLabel: "Tool name",
        newItem: () => ({ name: "Tool" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Works with the tools you already use",
    logos: [
      { name: "Slack" }, { name: "Notion" }, { name: "Figma" }, { name: "GitHub" },
      { name: "Stripe" }, { name: "HubSpot" }, { name: "Zapier" }, { name: "Linear" },
    ],
  },
  Component: LogoCloudPills,
})
