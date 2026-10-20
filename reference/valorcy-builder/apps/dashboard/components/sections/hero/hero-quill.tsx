"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_DISPLAY, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Quill — minimal archetype.
 *
 * Type only. No image, no card, no gradient. A hairline rule and a wide measure do
 * all the structural work, and the headline is set at a larger optical size than
 * anywhere else in the catalog because it is the only thing on the page.
 */
function HeroQuill ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section className="relative" style={rootStyle}>
      <SectionContainer className="flex max-w-4xl flex-col gap-10">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-8"
          headingLevel={1}
          align="left"
          headingClassName={`${TYPE_DISPLAY} text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-[52ch]`}
          overrides={{
            // The meta line is an eyebrow paired with a rule that fills the
            // remaining width — structure the shared eyebrow renderer has no
            // reason to know about.
            meta: ({ instance: inst }) => {
              const meta = inst.props.meta as string | undefined
              if (!meta) return null
              return (
                <div className="flex items-center gap-4">
                  <InlineEditableText
                    as="span"
                    data-element-id={`${inst.id}::meta`}
                    data-element-type="text"
                    className="shrink-0 text-sm text-muted-foreground"
                    value={meta}
                    isPreview={isPreview}
                    onChange={(t) => store().updateSectionProps(inst.id, { meta: t })}
                    onCommit={(t) => store().updateSectionProps(inst.id, { meta: t })}
                  />
                  <span aria-hidden className="h-px flex-1 bg-border" />
                </div>
              )
            },
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const heroQuillSection = defineSection({
  id: "hero-quill",
  displayName: "Quill",
  description: "Typography-only hero. A rule, a headline, and nothing competing with it.",
  category: "hero",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_XL,
  industries: ["portfolio", "creative", "photography", "podcast", "law", "finance", "generic"],
  styles: ["minimal", "editorial"],
  goals: ["brand", "awareness", "engagement"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 99,
  editable: true,
  trustWeight: 20,
  conversionWeight: 20,
  funnelStage: "awareness",
  tags: ["minimal", "typography", "editorial"],
  defaultOptions: { align: "start", containerWidth: "narrow", paddingY: "xl" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", id: "meta", label: "Meta line", field: { key: "meta" } },
      { kind: "heading", level: 1, accent: false },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 2 },
    ],
  },
  defaultProps: {
    meta: "Independent studio",
    headline: "We make quiet things that work well.",
    description:
      "A small practice focused on brand, product and the space between them.",
    buttons: [{ label: "See selected work", href: "#", variant: "primary" }],
  },
  Component: HeroQuill,
})
