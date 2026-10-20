"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H1 } from "@/components/sections/_primitives/type-scale"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Momentum — split archetype.
 *
 * Signature move: a staggered split. The media column starts well below the copy
 * on desktop, so the eye reads diagonally from headline to image instead of across
 * two tidy boxes. Everything else is plain.
 * Replaces the old `hero-split` and `hero-center`, which were the same layout
 * twice.
 *
 * The grid and the hanging media are this section's identity and stay in JSX. Everything inside the two columns is a
 * slot, so a user can reorder, hide and add to them.
 */
function HeroMomentum ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative overflow-hidden" style={rootStyle}>
      <SectionContainer className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:gap-20">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start gap-6"
          headingLevel={1}
          align="left"
          badgeVariant="outline"
          headingClassName={`${TYPE_H1} text-foreground`}
          ctaClassName="mt-2"
        />

        {/* Media starts lower than the copy on desktop: the one bold move. */}
        <div className="relative lg:mt-28">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            overrides={{
              imageUrl: ({ block, instance: inst }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey={block.id}
                  src={inst.props.imageUrl as string | undefined}
                  alt={String(inst.props.imageAlt ?? "")}
                  ratio="video"
                  placeholder="screenshot"
                  rounded="xl"
                  priority
                  isPreview={isPreview}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="relative border border-border"
                />
              ),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const heroMomentumSection = defineSection({
  id: "hero-momentum",
  displayName: "Momentum",
  description: "Staggered split hero: copy first, product image set lower beside it.",
  category: "hero",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_XL,
  industries: ["saas", "startup", "agency", "ecommerce", "software", "generic"],
  styles: ["modern", "bold", "corporate"],
  goals: ["leads", "sales", "conversion", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 96,
  editable: true,
  trustWeight: 30,
  conversionWeight: 35,
  funnelStage: "awareness",
  tags: ["split", "product", "start-aligned"],
  recommendedNeighbors: {
    after: ["logo-cloud-strip", "features-grid", "testimonials-grid"],
  },
  defaultOptions: { align: "start", paddingY: "xl", containerWidth: "default" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "media", label: "Media", accepts: ["media"], max: 1, acceptsElements: false, eject: { gridColumn: "span 1" } },
    ],
    blocks: [
      { kind: "badge" },
      { kind: "heading", level: 1, accent: true },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 3 },
      { kind: "note", label: "Small note (below buttons)" },
      { kind: "media", slot: "media", ratio: "video", placeholder: "screenshot" },
    ],
  },
  defaultProps: {
    headline: "Your projects, clients and invoices in one place",
    description:
      "Stop copying numbers between spreadsheets. Track the work, bill the client and see what is due this week from one screen.",
    note: "Free for 14 days. No card needed.",
    buttons: [
      { label: "Start free trial", href: "#", variant: "primary" },
      { label: "Book a demo", href: "#", variant: "outline" },
    ],
    imageAlt: "Product interface",
  },
  Component: HeroMomentum,
})
