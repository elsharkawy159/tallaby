"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  TIMELINE_HEADING,
  itemsOf,
  timelineItemsBlock,
  type TimelineItem,
  type TimelineStatus,
} from "@/components/sections/timeline/timeline-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const STATUS_STYLES: Record<TimelineStatus, string> = {
  done: "bg-success/15 text-success border-success/30",
  active: "bg-primary/15 text-primary border-primary/30",
  planned: "bg-muted text-muted-foreground border-border",
}
const STATUS_LABELS: Record<TimelineStatus, string> = { done: "Done", active: "In Progress", planned: "Planned" }

function statusOf (s: unknown): TimelineStatus {
  return s === "done" || s === "active" ? s : "planned"
}

/**
 * Horizon — list archetype.
 *
 * A stack of roadmap rows, each led by a status pill (done, in progress,
 * planned) with its title, date and description beside it. Rows and pills are
 * chrome; the headline and the roadmap items are slot entries.
 */
function TimelineRoadmap ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col"
          align="left"
          headingClassName={`${TYPE_H2} text-foreground mb-10`}
          renderItems={({ instance: inst }) => {
            const items = itemsOf<TimelineItem>(inst, "items")
            if (items.length === 0) return null
            return (
              <div className="border-t border-foreground">
                {items.map((item, i) => {
                  const status = statusOf(item.status)
                  return (
                    <div key={i} className="flex items-start gap-4 border-b border-border py-5">
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          STATUS_STYLES[status]
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
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
                            className="text-sm font-semibold text-foreground"
                          />
                          <ItemText
                            as="span"
                            instance={inst}
                            collection="items"
                            index={i}
                            field="year"
                            elementId={`year${i}`}
                            value={item.year}
                            isPreview={isPreview}
                            className="text-xs text-muted-foreground"
                          />
                        </div>
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="body"
                          elementId={`body${i}`}
                          value={item.body}
                          isPreview={isPreview}
                          className="mt-1 text-sm text-muted-foreground"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const timelineRoadmapSection = defineSection({
  id: "timeline-roadmap",
  displayName: "Horizon",
  description: "Roadmap rows, each tagged done, in progress or planned, with its date and summary.",
  category: "timeline",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "generic", "education"],
  trustWeight: 40,
  conversionWeight: 20,
  funnelStage: 'consideration',
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "brand", "engagement", "awareness"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      TIMELINE_HEADING,
      timelineItemsBlock({
        label: "Roadmap items",
        yearLabel: "Quarter / date",
        bodyLabel: "Description",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ year: "Q1 2025", title: "Feature name", body: "What this feature does.", status: "planned" }),
        statusOptions: [
          { label: "Done", value: "done" },
          { label: "In Progress", value: "active" },
          { label: "Planned", value: "planned" },
        ],
      }),
    ],
  },
  defaultProps: {
    headline: "What we're building next",
    items: [
      { year: "Q1 2025", title: "Team workspaces", body: "Shared projects, roles and permissions for teams of any size.", status: "done" },
      { year: "Q2 2025", title: "Native mobile apps", body: "Manage your work on the go with full-featured iOS and Android apps.", status: "done" },
      { year: "Q3 2025", title: "Advanced analytics", body: "Custom dashboards and exportable reports on every metric that matters.", status: "active" },
      { year: "Q4 2025", title: "Public API", body: "Connect your own tools with a documented, versioned REST API.", status: "planned" },
      { year: "Q1 2026", title: "Marketplace", body: "Discover and install integrations built by our partner community.", status: "planned" },
    ],
  },
  Component: TimelineRoadmap,
})
