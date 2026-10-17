"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Reel — product-first archetype.
 *
 * The media leads and the copy is inset over its lower-start corner, so the visual
 * is the hero and the words annotate it. Inverts Momentum's hierarchy on purpose.
 * Replaces `hero-video`, which stacked copy above a video the same way every other
 * centered hero did.
 */
function HeroReel ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section className="relative overflow-hidden" style={rootStyle}>
      <SectionContainer>
        <div className="relative isolate overflow-hidden rounded-2xl">
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
                  ratio="wide"
                  placeholder="screenshot"
                  rounded="none"
                  priority
                  isPreview={isPreview}
                  sizes="(max-width: 1280px) 100vw, 80rem"
                  className="border-0"
                />
              ),
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
          />

          {/* Copy inset over the media rather than stacked above it. */}
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="overlay"
            className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 text-white sm:p-10 lg:max-w-2xl"
            headingLevel={1}
            align="left"
            headingClassName={TYPE_H2}
            bodyClassName="max-w-xl text-base leading-[1.6] text-white/85"
            ctaClassName="mt-1"
            overrides={{
              eyebrow: ({ instance: inst }) => {
                const eyebrow = inst.props.eyebrow as string | undefined
                if (!eyebrow) return null
                return (
                  <InlineEditableText
                    as="span"
                    data-element-id={`${inst.id}::eyebrow`}
                    data-element-type="text"
                    className="text-sm font-medium text-white/80"
                    value={eyebrow}
                    isPreview={isPreview}
                    onChange={(t) => store().updateSectionProps(inst.id, { eyebrow: t })}
                    onCommit={(t) => store().updateSectionProps(inst.id, { eyebrow: t })}
                  />
                )
              },
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const heroReelSection = defineSection({
  id: "hero-reel",
  displayName: "Reel",
  description: "Media-led hero with the copy inset over the lower corner of the visual.",
  category: "hero",
  layoutArchetype: "product-first",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_MEDIUM,
  industries: ["saas", "ecommerce", "creative", "agency", "app_landing", "podcast", "generic"],
  styles: ["modern", "dark", "bold"],
  goals: ["engagement", "brand", "sales", "awareness"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 91,
  editable: true,
  trustWeight: 25,
  conversionWeight: 30,
  funnelStage: "awareness",
  tags: ["video", "media-led", "overlay"],
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      {
        id: "media",
        label: "Media",
        accepts: ["media"],
        max: 1,
        acceptsElements: false,
        eject: { overlay: true },
      },
      { id: "overlay", label: "Copy overlay", isDefault: true },
    ],
    blocks: [
      { kind: "eyebrow", slot: "overlay" },
      { kind: "heading", slot: "overlay", level: 1, accent: false },
      { kind: "body", slot: "overlay" },
      { kind: "ctaRow", slot: "overlay", minItems: 1, maxItems: 2 },
      { kind: "media", slot: "media", ratio: "wide", placeholder: "screenshot" },
    ],
  },
  defaultProps: {
    eyebrow: "Watch the two-minute tour",
    headline: "See it work before you commit",
    description:
      "A short walkthrough of the parts people actually use every day.",
    buttons: [
      { label: "Play the tour", href: "#", variant: "primary" },
      { label: "Read the docs", href: "#", variant: "ghost" },
    ],
    imageAlt: "Product walkthrough",
  },
  Component: HeroReel,
})
