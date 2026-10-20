"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H1, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Spotlight — centered archetype.
 *
 * Signature move: the product shot is cut off by the bottom of the section, so it
 * reads as a peek rather than a full screenshot. No backdrop decoration. Replaces `hero-centered`
 * and `hero-gradient`, which differed only by background treatment — now a single
 * section whose `background` option covers both.
 */
function HeroSpotlight ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative overflow-hidden" style={rootStyle}>
      <SectionContainer className="relative flex flex-col items-center gap-10 text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-center gap-6 text-center"
          headingLevel={1}
          align="center"
          headingClassName={`${TYPE_H1} max-w-3xl text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-2xl`}
          ctaClassName="mt-2"
        />

        {/* Cropped peek: the image is clipped by the section, not letterboxed. */}
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="media"
          className="relative mt-6 w-full max-w-5xl"
          overrides={{
            imageUrl: ({ block, instance: inst }) => (
              <>
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
                  sizes="(max-width: 1024px) 100vw, 64rem"
                  className="border border-border"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent"
                />
              </>
            ),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const heroSpotlightSection = defineSection({
  id: "hero-spotlight",
  displayName: "Spotlight",
  description: "Centered statement hero with the product shot cropped at the fold.",
  category: "hero",
  layoutArchetype: "centered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_XL,
  industries: ["saas", "startup", "app_landing", "ai_startup", "software", "generic"],
  styles: ["modern", "bold"],
  goals: ["leads", "conversion", "awareness", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 97,
  editable: true,
  trustWeight: 25,
  conversionWeight: 40,
  funnelStage: "awareness",
  tags: ["centered", "grid", "product"],
  recommendedNeighbors: { after: ["logo-cloud-strip", "features-grid"] },
  defaultOptions: { align: "center", paddingY: "xl" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "media", label: "Media", accepts: ["media"], max: 1, acceptsElements: false },
    ],
    blocks: [
      { kind: "badge" },
      { kind: "heading", level: 1, accent: true },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 2 },
      { kind: "media", slot: "media", ratio: "video", placeholder: "screenshot" },
    ],
  },
  defaultProps: {
    badge: "Now in open beta",
    headline: "The workspace your whole team actually opens",
    description:
      "Plans, docs and tasks sit side by side, so nobody has to ask where the latest version is.",
    buttons: [
      { label: "Get started", href: "#", variant: "primary" },
      { label: "See how it works", href: "#", variant: "ghost" },
    ],
    imageAlt: "Application dashboard",
  },
  Component: HeroSpotlight,
})
