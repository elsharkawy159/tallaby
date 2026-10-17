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
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** Number badge colours — planned steps recede to the muted tone. */
function badgeClass (status: string | undefined): string {
  return cn(statusFillClass(status), status === "planned" ? "text-background" : "text-primary-foreground")
}

/**
 * Waypoints — stepper archetype.
 *
 * Numbered nodes across one row, joined by a connector, each with its label,
 * title and body underneath; on small screens the row folds into a numbered
 * list. Nodes and connector are chrome; the headline and the steps are slot
 * entries.
 */
function TimelineHorizontal ({ instance, isPreview, definition }: SectionComponentProps) {
  return (
    <section className="bg-background" style={SECTION_PADDING_STANDARD}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center text-center"
          align="center"
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
          }
          headingClassName={`${TYPE_H2} text-foreground text-center mb-12`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<TimelineItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <>
                {/* Desktop: one row */}
                <div className="hidden md:flex items-start gap-0">
                  {items.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center text-center relative">
                      {i < items.length - 1 && (
                        <div
                          aria-hidden
                          className="absolute top-5 h-px bg-border start-[calc(50%+20px)] end-0"
                        />
                      )}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shrink-0",
                          badgeClass(item.status)
                        )}
                      >
                        {i + 1}
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
                        className="mt-3 text-xs font-semibold text-primary"
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
                        className="mt-1 text-sm font-semibold text-foreground px-2"
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
                        className="mt-1 text-xs leading-5 text-muted-foreground px-2"
                      />
                    </div>
                  ))}
                </div>
                {/* Mobile: numbered list */}
                <div className="flex flex-col gap-8 text-start md:hidden">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          badgeClass(item.status)
                        )}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary">{item.year}</p>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const timelineHorizontalSection = defineSection({
  id: "timeline-horizontal",
  displayName: "Waypoints",
  description: "Numbered steps across one row joined by a connector; folds into a list on mobile.",
  category: "timeline",
  layoutArchetype: "stepper",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "education"],
  trustWeight: 40,
  conversionWeight: 20,
  funnelStage: 'consideration',
  styles: ["modern", "minimal", "corporate", "bold"],
  goals: ["education", "brand", "awareness", "trust"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      TIMELINE_HEADING,
      timelineItemsBlock({
        label: "Steps",
        yearLabel: "Label / date",
        bodyLabel: "Body",
        minItems: 2,
        maxItems: 6,
        newItem: () => ({ year: "Step", title: "New step", body: "Describe this step.", status: "planned" }),
      }),
    ],
  },
  defaultProps: {
    headline: "From kickoff to launch",
    items: [
      { year: "Week 1", title: "Discovery", body: "We map your goals, audience and the outcomes that define success.", status: "done" },
      { year: "Week 2", title: "Design", body: "Wireframes and visual direction, reviewed together before anything is built.", status: "done" },
      { year: "Week 3–4", title: "Build", body: "Pages, content and integrations come together on a live staging site.", status: "active" },
      { year: "Week 5", title: "Launch", body: "Final checks, go-live and a handover so your team can run it with confidence.", status: "planned" },
    ],
  },
  Component: TimelineHorizontal,
})
