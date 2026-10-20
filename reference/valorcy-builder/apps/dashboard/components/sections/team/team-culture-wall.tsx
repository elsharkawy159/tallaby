"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, eyebrowAs, stretchItems } from "@/components/sections/team/team-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type CultureValue = { emoji?: string; title?: string; description?: string }

/**
 * Alt text the culture photo always rendered with before the slot migration.
 * Pages saved then carry no `imageAlt`, so it stays the fallback.
 */
const PHOTO_ALT_FALLBACK = "Team culture"

/**
 * Ethos — split archetype.
 *
 * The case for the culture on the start side — kicker, headline, description
 * and a two-column grid of value cards — beside one large team photo. Two
 * slots, one per column; the value cards and photo frame are chrome.
 */
function TeamCultureWall ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-start"
            align="left"
            entryClassName={stretchItems}
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={`${TYPE_LEAD} mt-4`}
            overrides={{
              eyebrow: eyebrowAs("mb-3 text-xs font-semibold text-primary", isPreview),
            }}
            renderItems={({ instance: inst }) => {
              const raw = inst.props.values
              const values = Array.isArray(raw) ? (raw as CultureValue[]) : []
              if (values.length === 0) return null
              return (
                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {values.map((val, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-5">
                      <ItemText
                        as="span"
                        instance={inst}
                        collection="values"
                        index={i}
                        field="emoji"
                        value={val.emoji}
                        isPreview={isPreview}
                        className="text-2xl"
                      />
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="values"
                        index={i}
                        field="title"
                        value={val.title}
                        isPreview={isPreview}
                        elementId={`vtitle${i}`}
                        className="mt-2 font-semibold text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="values"
                        index={i}
                        field="description"
                        value={val.description}
                        isPreview={isPreview}
                        elementId={`vdesc${i}`}
                        className="mt-1 text-sm text-muted-foreground"
                      />
                    </div>
                  ))}
                </div>
              )
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            className="overflow-hidden rounded-2xl border border-border"
            overrides={{
              imageUrl: ({ instance: inst }) => {
                const src = inst.props.imageUrl
                const alt = inst.props.imageAlt
                return (
                  <SectionMedia
                    instanceId={inst.id}
                    elementKey="imageUrl"
                    src={typeof src === "string" ? src : undefined}
                    alt={typeof alt === "string" ? alt : PHOTO_ALT_FALLBACK}
                    srcProp="imageUrl"
                    altProp="imageAlt"
                    ratio="auto"
                    placeholder="landscape"
                    rounded="none"
                    className="h-full min-h-96 w-full"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    isPreview={isPreview}
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

export const teamCultureWallSection = defineSection({
  id: "team-culture-wall",
  displayName: "Ethos",
  description: "Culture values in a card grid beside one large team photo.",
  category: "team",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "startup", "creative", "tech", "enterprise"],
  styles: ["modern", "bold", "editorial"],
  goals: ["brand", "trust", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 40,
  trustWeight: 70,
  tags: ["culture", "team", "values", "agency", "about"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "media", label: "Photo", accepts: ["media"], max: 1, acceptsElements: false },
    ],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", maxLength: 40 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 240 } },
      {
        kind: "items",
        key: "values",
        canonical: "items",
        label: "Culture values",
        pick: [],
        itemFields: [
          { key: "emoji", label: "Emoji", type: "text", aiHint: "Single emoji representing this value", maxLength: 4 },
          { key: "title", label: "Value title", type: "text", canonical: "headline", maxLength: 40 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 120 },
        ],
        minItems: 2,
        maxItems: 6,
        newItem: () => ({ emoji: "✨", title: "Value", description: "What this value means in practice." }),
      },
      {
        kind: "media",
        slot: "media",
        ratio: "auto",
        placeholder: "landscape",
        fields: { src: { key: "imageUrl", label: "Culture photo" }, alt: { key: "imageAlt" } },
      },
    ],
  },
  defaultProps: {
    eyebrow: "Culture",
    headline: "How we work, and why it works",
    description:
      "We hire curious people, give them real ownership and get out of their way. These are the principles we hold each other to.",
    imageAlt: PHOTO_ALT_FALLBACK,
    values: [
      { emoji: "🔥", title: "Ship with urgency", description: "Small releases, every week, measured by real use." },
      { emoji: "🤝", title: "Own the outcome", description: "We finish what we start and say so when we can't." },
      { emoji: "🧠", title: "Stay curious", description: "Every assumption is a question until the data answers it." },
      { emoji: "🌍", title: "Work from anywhere", description: "Async by default, together when it matters." },
    ],
  },
  Component: TeamCultureWall,
})
