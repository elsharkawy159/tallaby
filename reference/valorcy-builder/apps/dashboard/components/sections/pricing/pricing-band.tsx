"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { textProp } from "@/components/sections/pricing/pricing-parts"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Ticker — strip archetype.
 *
 * A thin promo line on the brand colour, meant to sit directly above or below a
 * pricing table. The line keeps the section-style formatting toolbar it always
 * had and falls back to its old copy when the prop was never set.
 */
function PricingBand ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, ds, sectionStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })

  return (
    <section
      className="py-6"
      style={{
        ...rootStyle,
        backgroundColor: (rootStyle.backgroundColor as string | undefined) ?? ds?.colors?.primary,
        color: (rootStyle.color as string | undefined) ?? "var(--primary-foreground)",
      }}
    >
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="row"
          className="flex flex-col items-center gap-2 text-center"
          align="center"
          overrides={{
            line: ({ instance: inst }) => {
              const write = (t: string) =>
                useBuilderStore.getState().updateSectionProps(inst.id, { line: t })
              return (
                <InlineEditableText
                  as="p"
                  data-element-id={`${inst.id}::line`}
                  data-element-type="text"
                  className="text-sm font-medium"
                  value={textProp(inst.props, "line", "Start free — upgrade when you grow.")}
                  isPreview={isPreview}
                  formatStyle={sectionStyle}
                  onFormatStyle={(p) => useBuilderStore.getState().updateSectionStyle(inst.id, p)}
                  onChange={write}
                  onCommit={write}
                />
              )
            },
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const pricingBandSection = defineSection({
  id: "pricing-band",
  displayName: "Ticker",
  description: "Thin promo line on the brand colour, for above or below a plan table.",
  category: "pricing",
  layoutArchetype: "strip",
  industries: ["saas", "startup", "agency", "software", "generic"],
  styles: ["minimal", "modern", "corporate"],
  goals: ["sales", "conversion", "leads"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["pricing", "band"],
  conversionWeight: 90,
  funnelStage: "decision",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "center", paddingY: "sm" },
  schema: {
    slots: [{ id: "row", label: "Row", isDefault: true }],
    blocks: [
      { kind: "note", id: "line", label: "Line", field: { key: "line", label: "Line", type: "text" } },
    ],
  },
  defaultProps: { line: "Start free — upgrade when you grow. Annual plans save 35%." },
  Component: PricingBand,
})
