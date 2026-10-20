"use client"

import { cn } from "@workspace/ui/lib/utils"
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
 * Chronicle — timeline archetype.
 *
 * The classic rail: one hairline down the start edge, a node per entry, and the
 * date, title and body flowing beside it. The rail and nodes are chrome; the
 * headline and the entries are slot entries.
 */
function TimelineVertical ({ instance, isPreview, definition }: SectionComponentProps) {
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
              <div className="relative ms-4">
                <div aria-hidden className="absolute start-0 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-10">
                  {items.map((item, i) => (
                    <div key={i} className="relative ps-8">
                      <div
                        aria-hidden
                        className={cn(
                          "absolute -start-[5px] top-1 h-3 w-3 rounded-full border-2 border-background",
                          item.status === "done" || item.status === "active" ? "bg-primary" : "bg-muted-foreground"
                        )}
                      />
                      <ItemText
                        as="div"
                        instance={inst}
                        collection="items"
                        index={i}
                        field="year"
                        elementId={`year${i}`}
                        value={item.year}
                        isPreview={isPreview}
                        className="text-xs font-semibold text-primary mb-1"
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
                        className="text-base font-semibold text-foreground"
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
                        className="mt-1 text-sm leading-6 text-muted-foreground"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const timelineVerticalSection = defineSection({
  id: "timeline-vertical",
  displayName: "Chronicle",
  description: "Classic rail — a hairline down the start edge with a dated entry beside each node.",
  category: "timeline",
  layoutArchetype: "timeline",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "nonprofit", "enterprise", "generic", "education", "creative"],
  trustWeight: 40,
  conversionWeight: 20,
  funnelStage: 'consideration',
  styles: ["minimal", "modern", "editorial", "corporate"],
  goals: ["brand", "trust", "awareness", "education"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      TIMELINE_HEADING,
      timelineItemsBlock({
        label: "Timeline items",
        yearLabel: "Year / date",
        bodyLabel: "Body",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ year: "2024", title: "Milestone", body: "Describe this milestone.", status: "planned" }),
      }),
    ],
  },
  defaultProps: {
    headline: "How we got here",
    items: [
      { year: "2019", title: "Founded in a spare bedroom", body: "Two engineers set out to make professional websites possible without a development team.", status: "done" },
      { year: "2021", title: "First thousand customers", body: "Word of mouth carried us past our first major milestone without a single paid campaign.", status: "done" },
      { year: "2023", title: "Series A and a new office", body: "We raised our first round and grew the team to forty people across three time zones.", status: "done" },
      { year: "2025", title: "Going global", body: "Localized products and regional support teams now serve customers in over thirty countries.", status: "active" },
    ],
  },
  Component: TimelineVertical,
})
