"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type LineItem = { text?: string }

/**
 * Forge — storytelling archetype.
 *
 * Signature move: the headline is broken into stacked lines the author controls
 * individually, each set enormous and flush to the start edge, with one accent
 * rule down the side. Every line is the same colour; no line is highlighted. Structure carries the emotion, so it stays intact under any copy the
 * AI writes. Replaces `hero-fitness`.
 *
 * Its headline is an item collection rather than a `heading` block, so the copy
 * slot overrides `lines` to render the stacked `<h1>` itself.
 */
function HeroForge ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { applySectionPadding: false, defaultBackground: false },
  })
  const store = useBuilderStore.getState

  return (
    <section className="relative isolate flex min-h-[clamp(32rem,88svh,52rem)] items-center overflow-hidden" style={rootStyle}>
      <SectionSlot
        instance={instance}
        definition={definition}
        isPreview={isPreview}
        slotId="background"
        overrides={{
          imageUrl: ({ block, instance: inst }) => (
            <SectionMedia
              instanceId={inst.id}
              elementKey={block.id}
              src={inst.props.imageUrl as string | undefined}
              alt={String(inst.props.imageAlt ?? "")}
              ratio="auto"
              placeholder="portrait"
              rounded="none"
              priority
              isPreview={isPreview}
              sizes="100vw"
              className="absolute inset-0 -z-20 h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
          ),
        }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />

      <SectionContainer className="relative z-10 py-20">
        <div className="flex gap-6 sm:gap-8">
          {/* Accent rule running the height of the stacked headline. */}
          <span aria-hidden className="mt-3 w-1 shrink-0 rounded-full bg-primary" />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col gap-7 text-white"
            align="left"
            bodyClassName="max-w-lg text-lg leading-[1.6] text-white/80"
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
            renderItems={({ instance: inst }) => {
              const lines = (inst.props.lines as LineItem[]) ?? []
              return (
                <h1 className="flex flex-col font-heading text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.92] tracking-[-0.045em]">
                  {lines.map((line, i) => (
                    <InlineEditableText
                      key={i}
                      as="span"
                      data-element-id={`${inst.id}::lines.${i}.text`}
                      data-element-type="text"
                      value={String(line.text ?? "")}
                      isPreview={isPreview}
                      onChange={(t) => store().updateItem(inst.id, "lines", i, { text: t })}
                      onCommit={(t) => store().updateItem(inst.id, "lines", i, { text: t })}
                    />
                  ))}
                </h1>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const heroForgeSection = defineSection({
  id: "hero-forge",
  displayName: "Forge",
  description: "Full-height statement hero — stacked oversized lines against a photo.",
  category: "hero",
  layoutArchetype: "storytelling",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  rootStyleOptions: { applySectionPadding: false, defaultBackground: false },
  industries: ["fitness", "nutritionist", "physiotherapy", "event", "creative", "ecommerce", "other"],
  styles: ["bold", "dark", "editorial"],
  goals: ["conversion", "brand", "bookings", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 92,
  editable: true,
  trustWeight: 25,
  conversionWeight: 45,
  funnelStage: "awareness",
  tags: ["statement", "full-height", "bold"],
  defaultOptions: { align: "start", paddingY: "none" },
  schema: {
    slots: [
      {
        id: "background",
        label: "Background image",
        accepts: ["media"],
        max: 1,
        acceptsElements: false,
        eject: { overlay: true },
      },
      { id: "copy", label: "Copy", isDefault: true },
    ],
    blocks: [
      { kind: "eyebrow" },
      {
        kind: "items",
        key: "lines",
        canonical: "items",
        label: "Headline lines",
        // Empty pick = take nothing from the canonical shape; this collection is
        // just ordered headline fragments.
        pick: [],
        itemFields: [{ key: "text", label: "Line", canonical: "headline", maxLength: 24 }],
        minItems: 2,
        maxItems: 4,
      },
      { kind: "body" },
      { kind: "ctaRow", minItems: 1, maxItems: 2 },
      { kind: "media", slot: "background", ratio: "portrait", placeholder: "portrait" },
    ],
  },
  defaultProps: {
    eyebrow: "Train with intent",
    lines: [{ text: "Stronger" }, { text: "every" }, { text: "session" }],
    description:
      "Coaching built around your schedule, your body and the goal you actually care about.",
    buttons: [
      { label: "Claim a free week", href: "#", variant: "primary" },
      { label: "See the programs", href: "#", variant: "ghost" },
    ],
    imageAlt: "Training session",
  },
  Component: HeroForge,
})
