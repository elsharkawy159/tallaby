"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, stretchItems } from "@/components/sections/about/about-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Milestone = { year?: string; text?: string }

/**
 * Milestones — timeline archetype.
 *
 * The company's history as a vertical rail: a dot per milestone, the year in
 * mono above what happened. The rail is chrome; the title and the milestones
 * are slot entries. Item keys (`items` → `{ year, text }`) and the per-item
 * element ids (`timelineYear<i>` / `timelineText<i>`) are what this section has
 * always stored and emitted.
 */
function AboutTimeline ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          align="left"
          headingClassName={`${TYPE_H2_SM} mb-8`}
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const items = (inst.props.items as Milestone[] | undefined) ?? []
            if (items.length === 0) return null
            return (
              <ol className="space-y-4 border-s-2 border-border ps-6">
                {items.map((it, i) => (
                  <li key={i} className="relative">
                    <span aria-hidden className="absolute -start-[1.4rem] top-1 size-2 rounded-full bg-primary" />
                    <ItemText
                      instance={inst}
                      collection="items"
                      index={i}
                      field="year"
                      value={it.year}
                      elementId={`timelineYear${i}`}
                      isPreview={isPreview}
                      className="font-heading text-sm font-semibold tabular-nums text-muted-foreground"
                    />
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="items"
                      index={i}
                      field="text"
                      value={it.text}
                      elementId={`timelineText${i}`}
                      isPreview={isPreview}
                      className="mt-1"
                    />
                  </li>
                ))}
              </ol>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const aboutTimelineSection = defineSection({
  id: "about-timeline",
  displayName: "Milestones",
  description: "The company's history on a vertical rail — one dated milestone per step.",
  category: "about",
  layoutArchetype: "timeline",
  industries: ["saas", "startup", "agency", "portfolio", "generic"],
  styles: ["modern", "minimal", "editorial"],
  goals: ["brand", "trust", "awareness"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  tags: ["about", "history", "timeline"],
  funnelStage: "awareness",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        id: "title",
        level: 2,
        accent: false,
        fields: {
          headline: { key: "title", label: "Title", aiHint: "Section title (4–8 words)", maxLength: 60 },
        },
      },
      {
        kind: "items",
        key: "items",
        canonical: "events",
        label: "Events",
        pick: [],
        itemFields: [
          { key: "year", label: "Year", type: "text" },
          {
            key: "text",
            label: "Text",
            type: "textarea",
            canonical: "body",
            aiHint: "Text content (1–3 sentences)",
            maxLength: 300,
            group: "content",
          },
        ],
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ year: "YYYY", text: "Event" }),
      },
    ],
  },
  defaultProps: {
    title: "How we got here",
    items: [
      { year: "2016", text: "Founded in a shared studio with two clients and one big idea." },
      { year: "2019", text: "Grew to a team of twenty and opened our second office." },
      { year: "2022", text: "Launched our product practice and shipped our 100th project." },
      { year: "2025", text: "Partnering with teams in twelve countries — and still hiring." },
    ],
  },
  Component: AboutTimeline,
})
