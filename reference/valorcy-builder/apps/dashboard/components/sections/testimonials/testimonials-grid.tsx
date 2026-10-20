"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  Attribution,
  ItemQuote,
  headerBlocks,
  itemsOf,
  testimonialItemsBlock,
} from "@/components/sections/testimonials/testimonials-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Chorus — grid archetype.
 *
 * Signature move: no cards at all. Three columns of quotes, each hung from a thin
 * rule, under a start-aligned header, so the words carry the section. The header
 * and the collection are slot entries, so a user can reorder them, hide the
 * subheadline or drop an element beside them.
 */
function TestimonialsGrid ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-4"
          align="left"
          headingClassName={`${TYPE_H2} max-w-2xl text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-2xl`}
          renderItems={({ instance: inst }) => (
            <div className="mt-12 grid gap-x-10 gap-y-12 text-start md:grid-cols-3">
              {itemsOf(inst).map((it, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-6 border-t border-border pt-6"
                >
                  <ItemQuote
                    instanceId={inst.id}
                    item={it}
                    index={i}
                    isPreview={isPreview}
                    className="flex-1 text-lg leading-relaxed text-foreground"
                  />
                  <div>
                    <Attribution
                      instanceId={inst.id}
                      item={it}
                      index={i}
                      isPreview={isPreview}
                      className="min-w-0"
                      nameClassName="text-sm font-semibold text-foreground"
                      metaClassName="text-sm text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const testimonialsGridSection = defineSection({
  id: "testimonials-grid",
  displayName: "Chorus",
  description: "Three-column grid of compact quote cards with rating and author.",
  category: "testimonials",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return testimonialsGridSection.defaultProps
    return oldProps
  },
  industries: ["saas", "agency", "startup", "ecommerce", "generic"],
  trustWeight: 90,
  conversionWeight: 45,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "conversion", "sales"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 82,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...headerBlocks(),
      testimonialItemsBlock({
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ quote: "This product changed how we work.", author: "Name", role: "Role", company: "Company", rating: 5 }),
      }),
    ],
  },
  defaultProps: {
    headline: "Loved by teams that ship",
    subheadline: "Thousands of teams rely on us every day. Here is what a few of them have to say.",
    items: [
      { quote: "We replaced three tools with one and cut our launch time in half. The team adopted it in a week.", author: "Maya Chen", role: "Head of Product", company: "Northwind", rating: 5 },
      { quote: "Support answers in minutes, not days. It feels like having another engineer on the team.", author: "Daniel Okafor", role: "CTO", company: "Brightline", rating: 5 },
      { quote: "The cleanest onboarding we have seen. Our customers noticed the difference immediately.", author: "Sofia Ramirez", role: "Customer Success Lead", company: "Lumen", rating: 5 },
      { quote: "Reporting that used to take a day now takes a click. Our leadership reviews are finally data-driven.", author: "James Whitfield", role: "VP Operations", company: "Harbor & Co", rating: 5 },
      { quote: "Reliable, fast and genuinely pleasant to use. It is rare to say that about business software.", author: "Aisha Rahman", role: "Founder", company: "Atelier Studio", rating: 5 },
      { quote: "We scaled from ten to two hundred customers without adding headcount to operations.", author: "Lukas Berger", role: "COO", company: "Fieldnote", rating: 5 },
    ],
  },
  Component: TestimonialsGrid,
})
