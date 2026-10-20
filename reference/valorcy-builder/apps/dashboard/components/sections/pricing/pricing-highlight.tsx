"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { textProp, textWithFallback } from "@/components/sections/pricing/pricing-parts"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Keystone — minimal archetype.
 *
 * One plan named and priced, nothing else. Signature move: a single ruled price
 * line, the plan name at the start and the figure at the end on one baseline,
 * like a line on a menu. For pages that link to a full pricing page and
 * only need to state the headline offer.
 *
 * The title keeps the section-style formatting toolbar it always had, so it is
 * drawn by an override rather than the shared headline primitive. Every value
 * falls back to the copy the section used to hardcode when its prop is absent.
 */
function PricingHighlight ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, sectionStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-y border-border py-8 sm:grid-cols-[1fr_auto]"
          align="left"
          entryClassName={(entry) => (entry.kind === "block" && entry.block.id === "badge" ? "sm:col-span-2" : undefined)}
          overrides={{
            badge: ({ instance: inst }) => {
              const write = (t: string) =>
                useBuilderStore.getState().updateSectionProps(inst.id, { badge: t })
              return (
                <InlineEditableText
                  as="span"
                  data-element-id={`${inst.id}::badge`}
                  data-element-type="text"
                  className="text-sm font-medium text-muted-foreground"
                  value={textProp(inst.props, "badge", "Popular")}
                  isPreview={isPreview}
                  onChange={write}
                  onCommit={write}
                />
              )
            },
            title: ({ instance: inst }) => {
              const write = (t: string) =>
                useBuilderStore.getState().updateSectionProps(inst.id, { title: t })
              return (
                <InlineEditableText
                  as="h2"
                  data-element-id={`${inst.id}::title`}
                  data-element-type="text"
                  className="font-heading text-[clamp(1.5rem,1.2vw+1rem,2rem)] font-semibold tracking-[-0.018em] text-foreground"
                  value={textProp(inst.props, "title", "Most popular")}
                  isPreview={isPreview}
                  formatStyle={sectionStyle}
                  onFormatStyle={(p) => useBuilderStore.getState().updateSectionStyle(inst.id, p)}
                  onChange={write}
                  onCommit={write}
                />
              )
            },
            price: textWithFallback({
              propKey: "price",
              fallback: "$49/mo",
              className: "font-heading text-[clamp(2rem,2vw+1rem,3rem)] font-semibold tracking-[-0.03em] text-foreground",
            }),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const pricingHighlightSection = defineSection({
  id: "pricing-highlight",
  isPremium: true,
  displayName: "Keystone",
  description: "Headline offer on the center line — a pill, the plan name and one large price.",
  category: "pricing",
  layoutArchetype: "minimal",
  industries: ["saas", "startup", "software", "agency", "generic"],
  styles: ["minimal", "modern", "editorial"],
  goals: ["sales", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["pricing", "highlight", "featured"],
  conversionWeight: 92,
  funnelStage: "decision",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "badge",
        field: {
          key: "badge",
          label: "Badge",
          type: "text",
          canonical: "badge",
          aiHint: "Pill label (1–4 words)",
          maxLength: 30,
          group: "content",
        },
      },
      {
        kind: "heading",
        id: "title",
        level: 2,
        accent: false,
        fields: {
          headline: {
            key: "title",
            label: "Title",
            type: "text",
            canonical: "headline",
            aiHint: "Section title (4–8 words)",
            maxLength: 60,
            group: "content",
          },
        },
      },
      { kind: "note", id: "price", label: "Price", field: { key: "price", label: "Price", type: "text", maxLength: 20 } },
    ],
  },
  defaultProps: {
    title: "Pro — for growing teams",
    price: "$29/mo",
    badge: "Most popular",
  },
  Component: PricingHighlight,
})
