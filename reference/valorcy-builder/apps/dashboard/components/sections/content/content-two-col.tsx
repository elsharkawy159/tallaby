"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, propText } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type BulletPoint = { text?: string }

/**
 * Diptych — prose-columns archetype.
 *
 * The introduction (eyebrow, headline, description) on the start side, the
 * detail (body copy and a checked list) on the end side. Two slots, one per
 * column, so either side can take extra elements without disturbing the other.
 */
function ContentTwoCol ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start lg:gap-20">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="intro"
            className="flex flex-col"
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
            slotId="detail"
            className="flex flex-col gap-6"
            align="left"
            bodyClassName={`${TYPE_BODY}`}
            renderItems={({ instance: inst }) => {
              const points = (inst.props.points as BulletPoint[] | undefined) ?? []
              if (points.length === 0) return null
              return (
                <ul className="space-y-3">
                  {points.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
                      >
                        ✓
                      </span>
                      <ItemText
                        instance={inst}
                        collection="points"
                        index={i}
                        field="text"
                        value={p.text}
                        elementId={`point${i}`}
                        isPreview={isPreview}
                        className="text-sm text-foreground"
                      />
                    </li>
                  ))}
                </ul>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentTwoColSection = defineSection({
  id: "content-two-col",
  displayName: "Diptych",
  description: "Two columns of prose — the introduction beside body copy and a checked list.",
  category: "content",
  layoutArchetype: "prose-columns",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "education", "finance"],
  trustWeight: 30,
  conversionWeight: 15,
  funnelStage: "awareness",
  styles: ["modern", "minimal", "corporate", "editorial"],
  goals: ["education", "brand", "trust", "awareness"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "intro", label: "Introduction", isDefault: true },
      { id: "detail", label: "Detail", eject: { direction: "column" } },
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
        field: { key: "description", aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)", maxLength: 280 },
      },
      {
        kind: "body",
        id: "bodyText",
        label: "Body text",
        slot: "detail",
        field: { key: "bodyText", label: "Body text", type: "textarea", maxLength: 600 },
      },
      {
        kind: "items",
        key: "points",
        canonical: "items",
        label: "Bullet points",
        slot: "detail",
        pick: [],
        itemFields: [
          {
            key: "text",
            label: "Point text",
            type: "text",
            canonical: "body",
            aiHint: "Text content (1–3 sentences)",
            maxLength: 300,
            group: "content",
          },
        ],
        minItems: 0,
        maxItems: 8,
        newItem: () => ({ text: "A key point about your offering" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Our approach",
    headline: "Built around how your team already works",
    description:
      "We start with your existing process and remove the friction, rather than asking everyone to learn a new way of working.",
    bodyText:
      "Most tools fail because they ask people to change first and see value later. We flip that: you see the improvement in week one, and adoption follows on its own.",
    points: [
      { text: "Onboarding measured in days, not months" },
      { text: "Works alongside the tools you already pay for" },
      { text: "A named specialist for every account" },
      { text: "Clear pricing with no surprise renewals" },
    ],
  },
  Component: ContentTwoCol,
})
