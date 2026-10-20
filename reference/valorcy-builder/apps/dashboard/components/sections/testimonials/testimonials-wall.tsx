"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  Attribution,
  InitialsAvatar,
  ItemQuote,
  headerBlocks,
  itemsOf,
  testimonialItemsBlock,
} from "@/components/sections/testimonials/testimonials-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Mural — masonry archetype.
 *
 * Signature move: volume. A wall of mixed-height quote tiles flowed through CSS
 * columns (no JS layout), so short and long quotes pack tightly. Tiles are flat
 * muted surfaces: no borders, shadows or stars. Built for volume: a dozen-plus quotes
 * read as overwhelming proof rather than a list.
 */
function TestimonialsWall ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
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
            <div className="mt-12 text-start [column-count:1] sm:[column-count:2] lg:[column-count:3] [column-gap:1rem]">
              {itemsOf(inst).map((it, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-4 rounded-xl bg-muted/50 p-6"
                >
                  <ItemQuote
                    instanceId={inst.id}
                    item={it}
                    index={i}
                    isPreview={isPreview}
                    className="text-[15px] leading-relaxed text-foreground"
                  />
                  <div className="mt-5 flex items-center gap-3">
                    <InitialsAvatar name={it.author} className="size-8 bg-background text-xs" />
                    <Attribution
                      instanceId={inst.id}
                      item={it}
                      index={i}
                      isPreview={isPreview}
                      className="min-w-0"
                      nameClassName="text-sm font-semibold text-foreground truncate"
                      metaClassName="text-[13px] text-muted-foreground truncate"
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

export const testimonialsWallSection = defineSection({
  id: "testimonials-wall",
  displayName: "Mural",
  description: "Masonry wall of mixed-height quote cards, three columns on desktop.",
  category: "testimonials",
  layoutArchetype: "masonry",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "ecommerce", "agency", "startup", "creative", "generic"],
  trustWeight: 90,
  conversionWeight: 45,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "editorial"],
  goals: ["trust", "awareness", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...headerBlocks(),
      testimonialItemsBlock({
        minItems: 3,
        maxItems: 30,
        newItem: () => ({ quote: "This product exceeded our expectations.", author: "Name", role: "Role", company: "Company", rating: 5 }),
      }),
    ],
  },
  defaultProps: {
    headline: "A wall of happy customers",
    subheadline: "Don't take our word for it — here is what people say after switching.",
    items: [
      { quote: "We moved our entire operation over in a weekend. Nothing broke, nobody needed training, and our customers noticed the faster experience right away.", author: "Maya Chen", role: "Head of Product", company: "Northwind", rating: 5 },
      { quote: "Simple, fast and beautifully made.", author: "Daniel Okafor", role: "Designer", company: "Brightline", rating: 5 },
      { quote: "The analytics alone paid for the subscription in the first month. We finally know which campaigns actually bring in revenue.", author: "Sofia Ramirez", role: "Marketing Lead", company: "Lumen", rating: 5 },
      { quote: "I have recommended it to every founder I know. It removes a whole category of problems so you can focus on the product.", author: "James Whitfield", role: "Founder", company: "Harbor & Co", rating: 5 },
      { quote: "Setup took ten minutes. Genuinely.", author: "Aisha Rahman", role: "Operations Manager", company: "Atelier", rating: 5 },
      { quote: "Our support tickets dropped by a third after the switch. The product explains itself, which means our team gets to do more meaningful work.", author: "Lukas Berger", role: "Support Director", company: "Fieldnote", rating: 5 },
      { quote: "Best purchase we made this year.", author: "Priya Nair", role: "CFO", company: "Meridian", rating: 5 },
      { quote: "Everything just works — and when we had a question, a real person answered within the hour.", author: "Tom Delacroix", role: "Engineering Manager", company: "Quarry", rating: 5 },
      { quote: "We evaluated six alternatives. This was the only one our whole team agreed on, from engineering to finance.", author: "Elena Petrova", role: "VP Engineering", company: "Solace", rating: 5 },
    ],
  },
  Component: TestimonialsWall,
})
