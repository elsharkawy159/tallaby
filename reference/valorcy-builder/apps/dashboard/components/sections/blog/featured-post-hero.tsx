"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import { COVER, PropText, noteBlock, textBlock } from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Cover Story — full-bleed archetype.
 *
 * A tall band with the cover photograph edge to edge under a dark scrim and the
 * story's headline, standfirst and button anchored to the bottom. With no
 * photograph it falls back to a deep brand gradient. The scrim and fallback stay
 * dark in both themes, so the copy is white rather than a theme token.
 *
 * The background is its own slot holding one media block bound to the stored
 * `heroImageUrl`; an empty value (how pre-migration pages without a photo were
 * saved) still renders the gradient.
 */
function FeaturedPostHero ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })

  return (
    <section className="relative isolate flex min-h-[480px] flex-col justify-end overflow-hidden" style={rootStyle}>
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,color-mix(in_oklch,black_85%,var(--primary)),color-mix(in_oklch,var(--primary)_70%,black))]"
      />
      <SectionSlot
        instance={instance}
        definition={definition}
        isPreview={isPreview}
        slotId="background"
        className="absolute inset-0 -z-10"
        entryClassName="absolute inset-0"
        overrides={{
          heroImageUrl: ({ instance: inst }) => {
            const src = inst.props.heroImageUrl
            if (typeof src !== "string" || src === "") return null
            const alt = inst.props.heroImageAlt
            return (
              <div className="absolute inset-0">
                <SectionEditableImage
                  instanceId={inst.id}
                  elementKey="heroImageUrl"
                  src={src}
                  alt={typeof alt === "string" ? alt : ""}
                  srcProp="heroImageUrl"
                  altProp="heroImageAlt"
                  isPreview={isPreview}
                  className="absolute inset-0 size-full object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/35 to-black/70" />
              </div>
            )
          },
        }}
      />
      <SectionContainer className="flex flex-col justify-end">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          align="left"
          headingLevel={1}
          headingClassName={`${TYPE_H2} text-white`}
          overrides={{
            subheadline: textBlock("subheadline", "mt-3 text-white/80", isPreview),
            ctaLabel: ({ instance: inst }) => {
              const v = inst.props.ctaLabel
              if (typeof v !== "string" || v === "") return null
              return (
                <div className="mt-6">
                  <PropText
                    instance={inst}
                    propKey="ctaLabel"
                    elementType="button"
                    isPreview={isPreview}
                    className="inline-flex rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground"
                  />
                </div>
              )
            },
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const featuredPostHeroSection = defineSection({
  id: "blog-featured-hero",
  displayName: "Cover Story",
  description: "Full-bleed cover photograph under a dark scrim, with the story's headline and button at the foot.",
  category: "blog",
  layoutArchetype: "full-bleed",
  industries: ["saas", "agency", "portfolio", "creative", "education", "generic"],
  styles: ["editorial", "bold", "modern"],
  goals: ["awareness", "brand", "engagement"],
  complexity: "low",
  density: "low",
  imageRequired: true,
  mobileScore: 92,
  editable: true,
  tags: ["blog", "featured", "hero"],
  funnelStage: "awareness",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "start", paddingY: "lg" },
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
      {
        kind: "heading",
        level: 1,
        accent: false,
        fields: {
          headline: { key: "headline", label: "Headline", type: "text", canonical: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80, group: "content" },
        },
      },
      {
        kind: "body",
        id: "subheadline",
        label: "Subheadline",
        field: { key: "subheadline", label: "Subheadline", type: "textarea", canonical: "subheadline", aiHint: "Supporting subheadline (8–14 words)", maxLength: 120, group: "content" },
      },
      noteBlock({
        key: "ctaLabel",
        label: "Button label",
        type: "text",
        canonical: "ctaPrimary",
        aiHint: "CTA button label (1–4 words)",
        maxLength: 30,
        group: "cta",
      }),
      {
        kind: "media",
        id: "heroImageUrl",
        label: "Background image",
        slot: "background",
        ratio: "wide",
        placeholder: "landscape",
        fields: {
          src: { key: "heroImageUrl", label: "Background image URL", type: "image" },
          alt: { key: "heroImageAlt", label: "Background image alt" },
        },
      },
    ],
  },
  defaultProps: {
    headline: "How we rebuilt our onboarding in six weeks",
    subheadline: "The research, the trade-offs and the results of our biggest product change this year.",
    heroImageUrl: COVER,
    heroImageAlt: "",
    ctaLabel: "Read the story",
  },
  Component: FeaturedPostHero,
})
