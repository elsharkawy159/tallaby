"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { propText } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Tandem — split archetype.
 *
 * A feature narrative beside one image. The `imagePosition` setting flips the
 * columns with CSS order rather than re-rendering, so the slot hosts (and any
 * elements dropped into them) keep their identity when it changes.
 */
function ContentMixedMedia ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const imageLeft = instance.props.imagePosition === "left"

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col justify-center"
            align="left"
            headingClassName={`${TYPE_H2} mt-3 text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-5`}
            overrides={{
              eyebrow: propText("eyebrow", {
                as: "div",
                className: "text-xs font-semibold text-primary",
              }),
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            className={cn("flex flex-col", imageLeft && "lg:order-first")}
            mediaProps={{
              ratio: "video",
              rounded: "lg",
              placeholder: "screenshot",
              className: "border border-border bg-muted/30",
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentMixedMediaSection = defineSection({
  id: "content-mixed-media",
  displayName: "Tandem",
  description: "Feature narrative beside one image — the image can sit on either side.",
  category: "content",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "ecommerce", "education"],
  trustWeight: 30,
  conversionWeight: 15,
  funnelStage: "awareness",
  styles: ["modern", "minimal", "corporate", "editorial"],
  goals: ["education", "brand", "trust", "awareness", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "media", label: "Media", accepts: ["media"], max: 1, acceptsElements: false },
    ],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", aiHint: "Short label above the headline (1–3 words, sentence case)", maxLength: 30 },
      },
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: { headline: { key: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80 } },
      },
      {
        kind: "body",
        id: "body",
        label: "Body text",
        field: { key: "body", label: "Body text", type: "textarea", canonical: "body", aiHint: "Body copy (1–3 sentences)", maxLength: 300 },
      },
      {
        kind: "media",
        slot: "media",
        ratio: "video",
        placeholder: "screenshot",
        fields: {
          src: { key: "imageUrl", label: "Image URL" },
          alt: { key: "imageAlt", label: "Image alt text", aiHint: "Accessible alt text for the image (describe what is shown)", maxLength: 120 },
        },
      },
    ],
    settings: [
      {
        key: "imagePosition",
        label: "Image position",
        type: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        default: "right",
      },
    ],
  },
  defaultProps: {
    imagePosition: "right",
    eyebrow: "Reporting",
    headline: "See every number that matters on one screen",
    body: "Live dashboards pull from every tool your team uses, so the weekly report writes itself and nobody waits on a spreadsheet.",
    imageAlt: "Product dashboard showing weekly metrics",
  },
  Component: ContentMixedMedia,
})
