"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { PropText, actionBlocks, actionOverrides, propText } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Unveil — product-first archetype.
 *
 * Centered copy and one action over a full-width product screenshot, with a
 * pill label riding the screenshot's top edge. A faint brand wash behind the
 * copy is the only decoration. Two slots: the copy column and the screenshot
 * stage.
 */
function ContentDashboardPreview ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-primary/[0.06]" />
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="mx-auto flex max-w-2xl flex-col items-center text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_LEAD} mt-4`}
          overrides={{
            eyebrow: propText("eyebrow", {
              className: "mb-3 text-xs font-semibold text-primary",
            }),
            ...actionOverrides("mt-6 px-6 py-3 font-semibold"),
          }}
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="stage"
          className="relative mt-16 flex flex-col"
          mediaProps={{
            ratio: "video",
            rounded: "lg",
            placeholder: "screenshot",
            className: "border border-border",
            sizes: "(max-width: 1280px) 100vw, 1200px",
          }}
          overrides={{
            badge: ({ instance: inst, isPreview: preview }) => (
              <div className="absolute -top-4 start-1/2 z-10 -translate-x-1/2 rtl:translate-x-1/2">
                <PropText
                  as="span"
                  instance={inst}
                  propKey="badge"
                  isPreview={preview}
                  className="inline-block rounded-full border border-primary bg-background px-4 py-1.5 text-xs font-semibold text-primary"
                />
              </div>
            ),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const contentDashboardPreviewSection = defineSection({
  id: "content-dashboard-preview",
  displayName: "Unveil",
  description: "Product reveal — centered copy and one action over a full-width screenshot.",
  category: "content",
  layoutArchetype: "product-first",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "software", "ai_startup", "tech", "app_landing"],
  styles: ["modern", "minimal"],
  goals: ["conversion", "trust", "education"],
  complexity: "low",
  density: "low",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 85,
  trustWeight: 75,
  tags: ["dashboard", "screenshot", "preview", "product", "saas"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "stage", label: "Screenshot", accepts: ["badge", "media"], acceptsElements: false },
    ],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      ...actionBlocks({ maxLength: 40 }),
      {
        kind: "badge",
        slot: "stage",
        label: "Badge",
        field: { key: "badge", label: "Badge label", aiHint: "Short pill label above the screenshot", maxLength: 30 },
      },
      {
        kind: "media",
        slot: "stage",
        ratio: "video",
        placeholder: "screenshot",
        fields: {
          src: { key: "imageUrl", label: "Dashboard image" },
          alt: { key: "imageAlt", label: "Image alt text", maxLength: 120 },
        },
      },
    ],
  },
  defaultProps: {
    eyebrow: "The workspace",
    headline: "Everything your team ships, in one view",
    description: "Plan, track and report on every project without switching tabs — the dashboard updates the moment work moves.",
    imageAlt: "Product dashboard screenshot",
    badge: "Live preview",
    ctaLabel: "Start free trial",
    ctaHref: "#",
  },
  Component: ContentDashboardPreview,
})
