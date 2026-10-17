"use client"

import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, itemsOf } from "@/components/sections/timeline/timeline-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Milestone = {
  phase?: string
  title?: string
  description?: string
  duration?: string
  status?: "done" | "active" | "upcoming"
}

/** Node and phase-pill treatment per status — semantic tokens only. */
function statusClasses (status: Milestone["status"]): { node: string; pill: string } {
  if (status === "done") return { node: "border-success bg-success", pill: "bg-success/10 text-success" }
  if (status === "active") return { node: "border-primary bg-primary", pill: "bg-primary/10 text-primary" }
  return { node: "border-border bg-background", pill: "bg-muted text-muted-foreground" }
}

/**
 * Blueprint — tracker archetype.
 *
 * A project plan on a centre rail: each phase's node reports its state (done,
 * in progress, upcoming) and its card alternates sides, led by a phase pill and
 * an optional duration. Rail, nodes and pills are chrome; the eyebrow,
 * headline, description and the milestones are slot entries.
 */
function TimelineProject ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-5 w-full items-center text-center"
          align="center"
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch text-start" : undefined
          }
          renderItems={({ instance: inst }) => {
            const milestones = itemsOf<Milestone>(inst, "milestones")
            if (milestones.length === 0) return null
            // mt-9 + the slot's gap-5 = the 56px the header used to leave.
            return (
              <div className="relative mt-9">
                <div aria-hidden className="absolute start-8 top-0 h-full w-px bg-primary/20 md:start-1/2" />
                <div className="space-y-10">
                  {milestones.map((ms, i) => {
                    const flip = i % 2 !== 0
                    const tone = statusClasses(ms.status)
                    return (
                      <div key={i} className={cn("relative flex gap-8", flip ? "md:flex-row-reverse" : "md:flex-row")}>
                        <div className="flex flex-col items-center md:w-1/2">
                          <div
                            aria-hidden
                            className={cn("relative z-10 flex size-6 items-center justify-center rounded-full border-2", tone.node)}
                          >
                            {ms.status === "done" && <span className="text-[9px] text-primary-foreground">✓</span>}
                            {ms.status === "active" && <span className="size-2 rounded-full bg-primary-foreground" />}
                          </div>
                        </div>

                        <div className={cn("flex-1 pb-2 md:w-1/2", flip && "md:text-end")}>
                          <div className={cn("flex items-center gap-2", flip && "md:justify-end")}>
                            <ItemText
                              as="span"
                              instance={inst}
                              collection="milestones"
                              index={i}
                              field="phase"
                              value={ms.phase}
                              isPreview={isPreview}
                              className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", tone.pill)}
                            />
                            {ms.duration ? (
                              <ItemText
                                as="span"
                                instance={inst}
                                collection="milestones"
                                index={i}
                                field="duration"
                                value={ms.duration}
                                isPreview={isPreview}
                                className="text-xs text-muted-foreground"
                              />
                            ) : null}
                          </div>
                          <ItemText
                            as="h3"
                            instance={inst}
                            collection="milestones"
                            index={i}
                            field="title"
                            elementId={`title${i}`}
                            labelProp
                            value={ms.title}
                            isPreview={isPreview}
                            className="mt-1.5 text-base font-semibold text-foreground"
                          />
                          <ItemText
                            as="p"
                            instance={inst}
                            collection="milestones"
                            index={i}
                            field="description"
                            elementId={`desc${i}`}
                            labelProp
                            value={ms.description}
                            isPreview={isPreview}
                            className="mt-1 text-sm text-muted-foreground"
                          />
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

export const timelineProjectSection = defineSection({
  id: "timeline-project",
  displayName: "Blueprint",
  description: "Project plan on a centre rail — phases alternate sides, each node showing done, active or upcoming.",
  category: "timeline",
  layoutArchetype: "tracker",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "web_dev_service", "creative", "it_support", "architecture"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["trust", "education", "leads"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 55,
  trustWeight: 75,
  tags: ["timeline", "project", "phases", "agency", "milestones"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", label: "Eyebrow", type: "text", canonical: "eyebrow", maxLength: 30, group: "content" },
      },
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: {
          headline: { key: "headline", label: "Headline", type: "text", canonical: "headline", maxLength: 70, group: "content" },
        },
      },
      {
        kind: "body",
        field: { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 200, group: "content" },
      },
      {
        kind: "items",
        key: "milestones",
        canonical: "items",
        label: "Milestones",
        pick: [],
        itemFields: [
          { key: "phase", label: "Phase label", type: "text", aiHint: "e.g. Week 1-2 or Phase 1", maxLength: 30 },
          { key: "title", label: "Milestone title", type: "text", canonical: "headline", maxLength: 60 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 200 },
          { key: "duration", label: "Duration (optional)", type: "text", aiHint: "e.g. 2 weeks", maxLength: 20 },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Done ✓", value: "done" },
              { label: "In progress", value: "active" },
              { label: "Upcoming", value: "upcoming" },
            ],
          },
        ],
        minItems: 2,
        maxItems: 8,
        newItem: () => ({ phase: "Phase", title: "Milestone", description: "What happens here.", duration: "", status: "upcoming" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "How we work",
    headline: "A clear plan from first call to launch",
    description: "Every engagement follows the same proven path, so you always know what is happening, what comes next and when it will be done.",
    milestones: [
      { phase: "Phase 1", title: "Discovery and strategy", description: "Workshops with your team to define goals, audiences and the measures of success.", duration: "1 week", status: "done" },
      { phase: "Phase 2", title: "Design and prototyping", description: "Wireframes and visual design, refined with you through two rounds of review.", duration: "2 weeks", status: "done" },
      { phase: "Phase 3", title: "Development", description: "We build, integrate and test every page on a live staging environment.", duration: "3 weeks", status: "active" },
      { phase: "Phase 4", title: "Launch and handover", description: "Go-live, performance checks and training so your team owns it from day one.", duration: "1 week", status: "upcoming" },
    ],
  },
  Component: TimelineProject,
})
