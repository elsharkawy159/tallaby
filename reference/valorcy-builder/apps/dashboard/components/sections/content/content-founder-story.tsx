"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { PropText, propText, textOf } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Origin — overlap archetype.
 *
 * A founder portrait with a name card overlapping its corner, beside the
 * story and a pull quote signed by the founder. The founder's name and role
 * are section fields drawn in two places (the overlapping card and the quote's
 * signature), so they are settings rendered inside those blocks rather than
 * entries of their own.
 */
function ContentFounderStory ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const founderName = textOf(instance.props, "founderName") ?? ""
  const founderRole = textOf(instance.props, "founderRole") ?? ""

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="media"
              className="flex flex-col"
              overrides={{
                founderImageUrl: ({ instance: inst, isPreview: preview }) => (
                  <SectionMedia
                    instanceId={inst.id}
                    elementKey="founderImageUrl"
                    src={textOf(inst.props, "founderImageUrl")}
                    alt={textOf(inst.props, "founderImageAlt") || founderName}
                    srcProp="founderImageUrl"
                    altProp="founderImageAlt"
                    ratio="square"
                    placeholder="portrait"
                    rounded="lg"
                    isPreview={preview}
                  />
                ),
              }}
            />
            {founderName || founderRole ? (
              <div className="absolute -bottom-6 -end-6 hidden max-w-[220px] rounded-2xl border border-border bg-background p-6 lg:block">
                <p className="text-sm font-semibold text-foreground">{founderName}</p>
                <p className="text-xs text-muted-foreground">{founderRole}</p>
              </div>
            ) : null}
          </div>

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-5`}
            overrides={{
              eyebrow: propText("eyebrow", {
                className: "mb-3 text-xs font-semibold text-primary",
              }),
              quote: ({ instance: inst, isPreview: preview }) => {
                if (!textOf(inst.props, "quote")) return null
                return (
                  <blockquote className="mt-8 border-s-4 border-primary ps-5 italic text-foreground">
                    <PropText instance={inst} propKey="quote" isPreview={preview} className="text-xl font-medium leading-snug" />
                    <footer className="mt-3 text-sm not-italic text-muted-foreground">
                      <PropText as="span" instance={inst} propKey="founderName" isPreview={preview} className="font-semibold text-foreground" />
                      {founderName && founderRole ? " · " : null}
                      <PropText as="span" instance={inst} propKey="founderRole" isPreview={preview} />
                    </footer>
                  </blockquote>
                )
              },
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentFounderStorySection = defineSection({
  id: "content-founder-story",
  displayName: "Origin",
  description: "Founder portrait with an overlapping name card, beside the story and a signed pull quote.",
  category: "content",
  layoutArchetype: "overlap",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "startup", "creative", "portfolio", "saas"],
  styles: ["modern", "editorial", "minimal"],
  goals: ["trust", "brand", "engagement"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 45,
  trustWeight: 80,
  tags: ["founder", "story", "about", "agency", "biography"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "media", label: "Portrait", accepts: ["media"], max: 1, acceptsElements: false },
      { id: "copy", label: "Story", isDefault: true },
    ],
    blocks: [
      {
        kind: "media",
        id: "founderImageUrl",
        slot: "media",
        ratio: "square",
        placeholder: "portrait",
        fields: {
          src: { key: "founderImageUrl", label: "Founder photo", canonical: "image", group: "media" },
          alt: { key: "founderImageAlt", label: "Founder photo alt text" },
        },
      },
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      {
        kind: "body",
        id: "story",
        label: "Story",
        field: {
          key: "story",
          label: "Story body",
          type: "textarea",
          canonical: "body",
          aiHint: "Founder narrative (2-4 sentences, personal and genuine)",
          maxLength: 600,
        },
      },
      {
        kind: "body",
        id: "quote",
        label: "Pull quote",
        field: {
          key: "quote",
          label: "Pull quote",
          type: "textarea",
          canonical: "body",
          aiHint: "A memorable founder quote (1-2 sentences)",
          maxLength: 200,
        },
      },
    ],
    settings: [
      { key: "founderName", label: "Founder name", type: "text", canonical: "brandName", maxLength: 60, group: "content" },
      { key: "founderRole", label: "Founder role", type: "text", aiHint: "Job title (e.g. Founder & CEO)", maxLength: 60, group: "content" },
    ],
  },
  defaultProps: {
    eyebrow: "Our story",
    headline: "It started with one frustrating Tuesday",
    story:
      "After a decade of stitching together tools that never quite talked to each other, I wanted one place where the work actually lived. We built the first version for our own team — and then our clients started asking for it.",
    quote: "We build the product we always wished someone else had made.",
    founderName: "Daniel Reyes",
    founderRole: "Founder & CEO",
    founderImageAlt: "Portrait of the founder",
  },
  Component: ContentFounderStory,
})
