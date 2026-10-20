"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import {
  ItemText,
  TIMELINE_HEADING,
  itemsOf,
  timelineItemsBlock,
  type TimelineItem,
} from "@/components/sections/timeline/timeline-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Landmarks — grid archetype.
 *
 * Each milestone is its own card in a three-column grid, its year repeated as
 * an oversized tinted watermark in the corner. Cards and watermark are chrome;
 * the headline and the milestones are slot entries.
 */
function TimelineMilestone ({ instance, isPreview, definition }: SectionComponentProps) {
  return (
    <section className="bg-background" style={SECTION_PADDING_STANDARD}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col"
          align="left"
          headingClassName={`${TYPE_H2} text-foreground mb-12`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<TimelineItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
                    <div
                      aria-hidden
                      className="absolute -bottom-4 -end-2 font-heading text-8xl font-semibold leading-none select-none pointer-events-none text-foreground/[0.06]"
                    >
                      {item.year}
                    </div>
                    <ItemText
                      as="div"
                      instance={inst}
                      collection="items"
                      index={i}
                      field="year"
                      elementId={`year${i}`}
                      value={item.year}
                      isPreview={isPreview}
                      className="text-xs font-semibold text-primary mb-3"
                    />
                    <ItemText
                      as="h3"
                      instance={inst}
                      collection="items"
                      index={i}
                      field="title"
                      elementId={`title${i}`}
                      labelProp
                      value={item.title}
                      isPreview={isPreview}
                      className="text-lg font-semibold text-foreground"
                    />
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="items"
                      index={i}
                      field="body"
                      elementId={`body${i}`}
                      value={item.body}
                      isPreview={isPreview}
                      className="mt-2 text-sm leading-6 text-muted-foreground relative z-10"
                    />
                  </div>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const timelineMilestoneSection = defineSection({
  id: "timeline-milestone",
  displayName: "Landmarks",
  description: "Milestone cards in a grid, each carrying its year as an oversized watermark.",
  category: "timeline",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "nonprofit", "enterprise", "generic", "creative"],
  trustWeight: 40,
  conversionWeight: 20,
  funnelStage: 'consideration',
  styles: ["bold", "modern", "editorial", "corporate"],
  goals: ["brand", "trust", "awareness"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      TIMELINE_HEADING,
      timelineItemsBlock({
        label: "Milestones",
        yearLabel: "Year",
        bodyLabel: "Description",
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ year: "2024", title: "Milestone", body: "Describe this milestone.", status: "planned" }),
      }),
    ],
  },
  defaultProps: {
    headline: "Milestones that shaped us",
    items: [
      { year: "2016", title: "Opened our first studio", body: "A team of four, one client and a commitment to doing the work properly.", status: "done" },
      { year: "2018", title: "Award-winning work", body: "Our campaign for a regional nonprofit earned national recognition.", status: "done" },
      { year: "2020", title: "Fully remote", body: "We rebuilt how we work and hired the best people wherever they live.", status: "done" },
      { year: "2023", title: "Five hundred projects", body: "Half a millennium of launches for clients across a dozen industries.", status: "active" },
      { year: "2026", title: "A new chapter", body: "Expanding into product design with a dedicated research practice.", status: "planned" },
    ],
  },
  Component: TimelineMilestone,
})
