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
  statusFillClass,
  timelineItemsBlock,
  type TimelineItem,
} from "@/components/sections/timeline/timeline-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

/** One entry's editable copy — rendered on whichever side of the spine it falls. */
function EntryCopy ({
  instance,
  item,
  index,
  isPreview,
}: {
  instance: SectionInstance
  item: TimelineItem
  index: number
  isPreview?: boolean
}) {
  return (
    <>
      <ItemText
        as="div"
        instance={instance}
        collection="items"
        index={index}
        field="year"
        elementId={`year${index}`}
        value={item.year}
        isPreview={isPreview}
        className="text-xs font-semibold text-primary"
      />
      <ItemText
        as="h3"
        instance={instance}
        collection="items"
        index={index}
        field="title"
        elementId={`title${index}`}
        labelProp
        value={item.title}
        isPreview={isPreview}
        className="text-base font-semibold text-foreground mt-1"
      />
      <ItemText
        as="p"
        instance={instance}
        collection="items"
        index={index}
        field="body"
        elementId={`body${index}`}
        value={item.body}
        isPreview={isPreview}
        className="mt-1 text-sm text-muted-foreground"
      />
    </>
  )
}

/**
 * Pendulum — zigzag archetype.
 *
 * Entries swing from one side of a centre spine to the other, a node on the
 * spine between them; on small screens they fall into a single bordered column.
 * Spine and nodes are chrome; the headline and the milestones are slot entries.
 */
function TimelineAlternating ({ instance, isPreview, definition }: SectionComponentProps) {
  return (
    <section className="bg-background" style={SECTION_PADDING_STANDARD}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center"
          align="center"
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
          }
          headingClassName={`${TYPE_H2} text-foreground text-center mb-16`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<TimelineItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="relative">
                <div aria-hidden className="absolute start-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 rtl:translate-x-1/2 hidden md:block" />
                <div className="space-y-12">
                  {items.map((item, i) => {
                    const isStart = i % 2 === 0
                    return (
                      <div key={i} className="relative flex flex-col md:flex-row md:items-center gap-4">
                        <div className={cn("md:w-1/2 md:pe-10", isStart ? "md:text-end" : "md:invisible")}>
                          {isStart && <EntryCopy instance={inst} item={item} index={i} isPreview={isPreview} />}
                        </div>
                        <div
                          aria-hidden
                          className={cn(
                            "relative z-10 hidden md:flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-background",
                            statusFillClass(item.status)
                          )}
                        />
                        <div className={cn("md:w-1/2 md:ps-10", isStart && "md:invisible")}>
                          {!isStart && <EntryCopy instance={inst} item={item} index={i} isPreview={isPreview} />}
                        </div>
                        {/* Small screens: one bordered column */}
                        <div className="md:hidden ps-6 border-s border-border">
                          <p className="text-xs font-semibold text-primary">{item.year}</p>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const timelineAlternatingSection = defineSection({
  id: "timeline-alternating",
  displayName: "Pendulum",
  description: "Milestones swing from side to side of a centre spine; one column on mobile.",
  category: "timeline",
  layoutArchetype: "zigzag",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "creative", "nonprofit"],
  trustWeight: 40,
  conversionWeight: 20,
  funnelStage: 'consideration',
  styles: ["editorial", "modern", "minimal", "corporate"],
  goals: ["brand", "awareness", "trust", "education"],
  complexity: "high",
  density: "medium",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      TIMELINE_HEADING,
      timelineItemsBlock({
        label: "Milestones",
        yearLabel: "Year",
        bodyLabel: "Body",
        minItems: 2,
        maxItems: 8,
        newItem: () => ({ year: "2024", title: "Milestone", body: "What happened.", status: "planned" }),
      }),
    ],
  },
  defaultProps: {
    headline: "Key milestones",
    items: [
      { year: "2018", title: "The idea takes shape", body: "A small studio project grows into a product our clients keep asking for.", status: "done" },
      { year: "2020", title: "Public launch", body: "We open the doors to everyone and welcome our first ten thousand users.", status: "done" },
      { year: "2022", title: "Platform rebuild", body: "A faster, more reliable foundation built to carry the next decade of growth.", status: "done" },
      { year: "2025", title: "Expanding the team", body: "New offices and new specialists, so every customer gets local expertise.", status: "active" },
    ],
  },
  Component: TimelineAlternating,
})
