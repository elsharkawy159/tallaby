"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  Attribution,
  InitialsAvatar,
  ItemQuote,
  Stars,
  headerBlocks,
  itemsOf,
  testimonialItemsBlock,
} from "@/components/sections/testimonials/testimonials-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Accolade — editorial archetype.
 *
 * The rating-led layout: two columns of roomy cards on a muted band, each led by
 * its stars, with the quote set in the heading font for longer quotes that
 * deserve to be read. Signature move: quotes treated as headlines. The cards are
 * chrome; the header and the collection are slot entries.
 */
function TestimonialsCards ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="bg-muted/40" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-3 text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_LEAD} mx-auto max-w-2xl`}
          renderItems={({ instance: inst }) => (
            <div className="mt-12 grid gap-5 text-start md:grid-cols-2">
              {itemsOf(inst).map((it, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-6 rounded-2xl bg-background p-8"
                >
                  <Stars n={it.rating ?? 5} className="gap-1" starClassName="size-4" />
                  <ItemQuote
                    instanceId={inst.id}
                    item={it}
                    index={i}
                    isPreview={isPreview}
                    className="flex-1 font-heading text-xl leading-snug tracking-[-0.01em] text-foreground"
                  />
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={it.author} className="size-10 text-sm" />
                    <Attribution
                      instanceId={inst.id}
                      item={it}
                      index={i}
                      isPreview={isPreview}
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

export const testimonialsCardsSection = defineSection({
  id: "testimonials-cards",
  displayName: "Accolade",
  description: "Two-column premium cards with an oversized quote mark, rating and attribution.",
  category: "testimonials",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return testimonialsCardsSection.defaultProps
    return oldProps
  },
  industries: ["app_landing", "saas", "agency", "startup", "finance", "enterprise", "dentist", "fitness", "real_estate", "law", "restaurant", "event", "travel", "generic"],
  trustWeight: 90,
  conversionWeight: 45,
  funnelStage: "consideration",
  styles: ["modern", "corporate"],
  goals: ["trust", "conversion", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...headerBlocks(),
      testimonialItemsBlock({
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ quote: "This product transformed how we work.", author: "Name", role: "Role", company: "Company", rating: 5 }),
      }),
    ],
  },
  defaultProps: {
    headline: "What our customers say",
    subheadline: "Real results from the teams who use us to run their business every day.",
    items: [
      { quote: "Within the first quarter we doubled our qualified leads. The setup took an afternoon, and the results have compounded every month since.", author: "Maya Chen", role: "Head of Growth", company: "Northwind", rating: 5 },
      { quote: "Our clients notice the difference immediately. Everything feels faster, more polished and far easier to manage than what we had before.", author: "Daniel Okafor", role: "Managing Partner", company: "Okafor & Lane", rating: 5 },
      { quote: "The support team treats our problems like their own. We have never waited more than an hour for a thoughtful, complete answer.", author: "Sofia Ramirez", role: "Operations Director", company: "Lumen Health", rating: 5 },
      { quote: "It replaced a patchwork of spreadsheets and tools. Our team finally works from one source of truth, and it shows in our numbers.", author: "James Whitfield", role: "CEO", company: "Harbor & Co", rating: 5 },
    ],
  },
  Component: TestimonialsCards,
})
