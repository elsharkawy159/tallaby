"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  InitialsAvatar,
  headerBlocks,
  itemsOf,
  testimonialItemsBlock,
  type TestimonialItem,
} from "@/components/sections/testimonials/testimonials-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Ticker — marquee archetype.
 *
 * Signature move: motion. Two rows of quote cards drifting in opposite directions
 * under an edge fade; the only testimonials layout that moves, and it stops for
 * people who ask for reduced motion. Pure CSS animation. The cards are duplicated to make the loop
 * seamless, so they are read-only on the canvas; their copy is edited in the
 * inspector.
 */

function Card ({ it }: { it: TestimonialItem }) {
  return (
    <div className="mx-2 w-80 flex-shrink-0 rounded-xl bg-muted/50 p-6">
      <p className="line-clamp-4 text-[15px] leading-relaxed text-foreground">
        &quot;{it.quote}&quot;
      </p>
      <div className="mt-5 flex items-center gap-3">
        <InitialsAvatar name={it.author} className="size-8 bg-background text-xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{it.author}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {[it.role, it.company].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>
    </div>
  )
}

function MarqueeRow ({ items, direction }: { items: TestimonialItem[]; direction: "left" | "right" }) {
  const doubled = [...items, ...items]
  return (
    <div className="w-full max-w-full overflow-x-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        data-marquee-track
        style={{
          display: "flex",
          animation: `marquee-${direction} 40s linear infinite`,
          width: "max-content",
        }}
      >
        {doubled.map((it, i) => (
          <Card key={i} it={it} />
        ))}
      </div>
    </div>
  )
}

function TestimonialsMarquee ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section
      className="relative isolate w-full max-w-full overflow-x-clip bg-background"
      style={rootStyle}
    >
      <style>{`
        @keyframes marquee-left { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes marquee-right { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        @media (prefers-reduced-motion: reduce) { [data-marquee-track] { animation: none !important } }
      `}</style>

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
          renderItems={({ instance: inst }) => {
            const items = itemsOf(inst)
            const half = Math.ceil(items.length / 2)
            const row1 = items.slice(0, half)
            const row2 = items.slice(half)
            return (
              <div className="mx-auto mt-12 flex w-full flex-col gap-4 text-start">
                <MarqueeRow items={row1.length ? row1 : items} direction="left" />
                {row2.length > 0 && <MarqueeRow items={row2} direction="right" />}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const testimonialsMarqueeSection = defineSection({
  id: "testimonials-marquee",
  displayName: "Ticker",
  description: "Two rows of auto-scrolling quote cards moving in opposite directions.",
  category: "testimonials",
  layoutArchetype: "marquee",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "ecommerce", "generic"],
  trustWeight: 88,
  conversionWeight: 45,
  funnelStage: "consideration",
  styles: ["modern", "playful", "bold"],
  goals: ["trust", "awareness", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 78,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...headerBlocks(),
      testimonialItemsBlock({
        minItems: 4,
        maxItems: 20,
        newItem: () => ({ quote: "This product is exceptional.", author: "Name", role: "Role", company: "Company", rating: 5 }),
      }),
    ],
  },
  defaultProps: {
    headline: "Trusted by teams everywhere",
    subheadline: "A constant stream of feedback from the people who build with us.",
    items: [
      { quote: "We launched our new site in a single afternoon. The results speak for themselves.", author: "Maya Chen", role: "Head of Product", company: "Northwind", rating: 5 },
      { quote: "The fastest, most intuitive tool our team has adopted in years.", author: "Daniel Okafor", role: "CTO", company: "Brightline", rating: 5 },
      { quote: "Conversions are up forty percent since we switched. I only wish we had done it sooner.", author: "Sofia Ramirez", role: "Growth Lead", company: "Lumen", rating: 5 },
      { quote: "Support is outstanding — quick, friendly and genuinely helpful every time.", author: "James Whitfield", role: "Founder", company: "Harbor & Co", rating: 5 },
      { quote: "It gave our small team the polish of a much bigger company.", author: "Aisha Rahman", role: "Creative Director", company: "Atelier", rating: 5 },
      { quote: "Reliable, secure and easy to roll out across every department.", author: "Lukas Berger", role: "IT Director", company: "Fieldnote", rating: 5 },
      { quote: "Our customers keep complimenting the experience. That never happened before.", author: "Priya Nair", role: "COO", company: "Meridian", rating: 5 },
      { quote: "Clear pricing, no surprises, and a product that keeps getting better.", author: "Tom Delacroix", role: "Finance Lead", company: "Quarry", rating: 5 },
    ],
  },
  Component: TestimonialsMarquee,
})
