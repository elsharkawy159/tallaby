"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { itemsOf, testimonialItemsBlock, writeItem } from "@/components/sections/testimonials/testimonials-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Murmur — strip archetype.
 *
 * Three short quotes in a compact row between hairlines, under a small caps
 * label. Meant to sit between sections rather than carry a page on its own.
 */
function TestimonialsStrip ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, sectionStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section className="border-y border-border" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-6"
          align="center"
          overrides={{
            // Keeps the inline format bar the title has always had.
            title: ({ instance: inst }) => {
              const raw = inst.props.title
              if (typeof raw !== "string") return null
              return (
                <InlineEditableText
                  as="h2"
                  data-element-id={`${inst.id}::title`}
                  data-element-type="text"
                  className="text-center text-sm font-semibold text-muted-foreground"
                  value={raw}
                  isPreview={isPreview}
                  formatStyle={sectionStyle}
                  onFormatStyle={(p) => store().updateSectionStyle(inst.id, p)}
                  onChange={(t) => store().updateSectionProps(inst.id, { title: t })}
                  onCommit={(t) => store().updateSectionProps(inst.id, { title: t })}
                />
              )
            },
          }}
          renderItems={({ instance: inst }) => (
            <div className="grid gap-6 md:grid-cols-3">
              {itemsOf(inst).map((it, i) => (
                <div key={i} className="text-sm">
                  <InlineEditableText
                    as="p"
                    data-element-id={`${inst.id}::quote${i}`}
                    data-element-type="text"
                    className="text-muted-foreground"
                    value={String(it.quote ?? "")}
                    isPreview={isPreview}
                    onChange={writeItem(inst.id, "items", i, "quote")}
                    onCommit={writeItem(inst.id, "items", i, "quote")}
                  />
                  <InlineEditableText
                    as="p"
                    data-element-id={`${inst.id}::author${i}`}
                    data-element-type="text"
                    className="mt-2 font-medium"
                    value={String(it.author ?? "")}
                    isPreview={isPreview}
                    onChange={writeItem(inst.id, "items", i, "author")}
                    onCommit={writeItem(inst.id, "items", i, "author")}
                  />
                </div>
              ))}
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const testimonialsStripSection = defineSection({
  id: "testimonials-strip",
  displayName: "Murmur",
  description: "Compact row of three short quotes between hairlines.",
  category: "testimonials",
  layoutArchetype: "strip",
  industries: ["saas", "startup", "agency", "ecommerce", "generic"],
  styles: ["minimal", "modern"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["testimonials", "strip", "compact"],
  trustWeight: 70,
  funnelStage: "consideration",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        id: "title",
        label: "Title",
        level: 2,
        accent: false,
        fields: {
          headline: {
            key: "title",
            label: "Title",
            canonical: "headline",
            aiHint: "Section title (4–8 words)",
            maxLength: 60,
            group: "content",
          },
        },
      },
      testimonialItemsBlock({
        label: "Items",
        fields: ["quote", "author"],
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ quote: "Quote", author: "Name" }),
      }),
    ],
  },
  defaultProps: {
    title: "What customers are saying",
    items: [
      { quote: "The easiest decision we made all year. Setup took minutes.", author: "Maya Chen, Northwind" },
      { quote: "Our team adopted it overnight — no training required.", author: "Daniel Okafor, Brightline" },
      { quote: "Support that actually answers. Every single time.", author: "Sofia Ramirez, Lumen" },
    ],
  },
  Component: TestimonialsStrip,
})
