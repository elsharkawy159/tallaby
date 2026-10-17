"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { actionBlocks, actionOverrides, propText, textOf } from "@/components/sections/content/content-parts"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Signature — storytelling archetype.
 *
 * The chef's story on the start side — name, role, biography, a pull quote on
 * a brand rule and a menu action — beside a tall portrait. On mobile the
 * portrait leads.
 */
function ContentChefStory ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="order-2 flex flex-col items-start lg:order-1"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-5`}
            overrides={{
              eyebrow: propText("eyebrow", {
                className: "mb-3 text-xs font-semibold text-primary",
              }),
              title: propText("title", { className: "mt-1 text-sm font-medium text-muted-foreground" }),
              quote: ({ instance: inst, isPreview: preview }) => {
                const quote = textOf(inst.props, "quote")
                if (!quote) return null
                const write = (t: string) => useBuilderStore.getState().updateSectionProps(inst.id, { quote: t })
                return (
                  <blockquote className="mt-6 border-s-4 border-primary ps-5 italic text-foreground">
                    &ldquo;
                    <InlineEditableText
                      as="span"
                      data-element-id={`${inst.id}::quote`}
                      data-element-type="text"
                      value={quote}
                      isPreview={preview}
                      onChange={write}
                      onCommit={write}
                    />
                    &rdquo;
                  </blockquote>
                )
              },
              ...actionOverrides("mt-8 px-6 py-3"),
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            className="order-1 flex flex-col lg:order-2"
            overrides={{
              imageUrl: ({ instance: inst, isPreview: preview }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey="imageUrl"
                  src={textOf(inst.props, "imageUrl")}
                  alt={textOf(inst.props, "imageAlt") || textOf(inst.props, "name") || ""}
                  ratio="portrait"
                  placeholder="portrait"
                  rounded="lg"
                  className="aspect-[4/5]"
                  isPreview={preview}
                />
              ),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentChefStorySection = defineSection({
  id: "content-chef-story",
  displayName: "Signature",
  description: "The chef's story, pull quote and menu action beside a tall portrait.",
  category: "content",
  layoutArchetype: "storytelling",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "food_delivery", "catering"],
  styles: ["editorial", "modern", "minimal"],
  goals: ["trust", "brand", "engagement"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 95,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 55,
  trustWeight: 80,
  tags: ["chef", "story", "restaurant", "bio", "about"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Story", isDefault: true },
      { id: "media", label: "Portrait", accepts: ["media"], max: 1, acceptsElements: false },
    ],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 40 } },
      {
        kind: "heading",
        id: "name",
        level: 2,
        accent: false,
        fields: { headline: { key: "name", label: "Chef name", canonical: "headline", maxLength: 80 } },
      },
      {
        kind: "note",
        id: "title",
        label: "Title / role",
        field: { key: "title", label: "Title / role", type: "text", canonical: "subheadline", maxLength: 100 },
      },
      {
        kind: "body",
        id: "bio",
        label: "Biography",
        field: { key: "bio", label: "Biography", type: "textarea", canonical: "body", maxLength: 500 },
      },
      {
        kind: "note",
        id: "quote",
        label: "Pull quote",
        field: { key: "quote", label: "Pull quote", type: "textarea", aiHint: "Memorable quote from the chef", maxLength: 200 },
      },
      ...actionBlocks({ maxLength: 40 }),
      {
        kind: "media",
        slot: "media",
        ratio: "portrait",
        placeholder: "portrait",
        fields: {
          src: { key: "imageUrl", label: "Chef photo", canonical: "image", group: "media" },
          alt: { key: "imageAlt", label: "Chef photo alt text" },
        },
      },
    ],
  },
  defaultProps: {
    eyebrow: "Meet the chef",
    name: "Marco Bellini",
    title: "Executive Chef & Founder",
    bio: "Raised in his grandmother's kitchen in Emilia-Romagna, Marco trained in Bologna and Lyon before opening his own dining room. His menu changes with the market, and nothing leaves the pass that he wouldn't serve his own family.",
    quote: "Good cooking starts with good ingredients and the patience to leave them alone.",
    imageAlt: "Portrait of the chef in the kitchen",
    ctaLabel: "View the menu",
    ctaHref: "#",
  },
  Component: ContentChefStory,
})
