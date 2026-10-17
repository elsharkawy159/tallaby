"use client"

import { Zap, Search, PenTool, Rocket, CheckCircle, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CENTERED_HEADER, ItemText, labelSetting, stretchItems, textOf } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Zap, Search, PenTool, Rocket, CheckCircle }

type ProcessStep = { icon?: string; number?: string; title?: string; description?: string }

/**
 * Waypoints — ladder archetype.
 *
 * A centered header over four (or more) equal steps in one row, each a solid
 * brand icon tile, a "Step N" kicker, title and description, joined by a thin
 * connector line on desktop.
 */
function ContentProcessRoadmap ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className={CENTERED_HEADER}
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const steps = (inst.props.steps as ProcessStep[] | undefined) ?? []
            if (steps.length === 0) return null
            const prefix = textOf(inst.props, "stepLabel", "Step")
            return (
              <div className="mt-11 grid grid-cols-1 gap-8 text-start md:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, i) => {
                  const Icon = ICONS[step.icon ?? ""] ?? Zap
                  const isLast = i === steps.length - 1
                  return (
                    <div key={i} className="relative flex flex-col">
                      {!isLast && (
                        <div aria-hidden className="absolute start-8 top-8 hidden h-px w-full bg-primary/25 lg:block" />
                      )}
                      <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                        <Icon className="size-7" aria-hidden />
                      </div>
                      <div className="mt-5">
                        <span className="text-xs font-semibold text-primary">
                          {prefix} {step.number || i + 1}
                        </span>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="steps"
                          index={i}
                          field="title"
                          value={step.title}
                          elementId={`title${i}`}
                          isPreview={isPreview}
                          className="mt-1 text-lg font-semibold text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="steps"
                          index={i}
                          field="description"
                          value={step.description}
                          elementId={`desc${i}`}
                          isPreview={isPreview}
                          className="mt-2 text-sm leading-relaxed text-muted-foreground"
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

export const contentProcessRoadmapSection = defineSection({
  id: "content-process-roadmap",
  displayName: "Waypoints",
  description: "How we work — numbered steps in one row, each with a solid icon tile, joined by a connector.",
  category: "content",
  layoutArchetype: "ladder",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "web_dev_service", "creative", "it_support", "home_services"],
  styles: ["modern", "bold", "corporate"],
  goals: ["trust", "education", "leads"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 60,
  trustWeight: 70,
  tags: ["process", "steps", "agency", "how-we-work", "roadmap"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "items",
        key: "steps",
        canonical: "steps",
        label: "Process steps",
        pick: [],
        itemFields: [
          { key: "icon", label: "Icon", type: "select", options: Object.keys(ICONS).map((k) => ({ label: k, value: k })) },
          { key: "number", label: "Step number (optional)", type: "text", aiHint: "e.g. 01, 02", maxLength: 4 },
          { key: "title", label: "Step title", type: "text", canonical: "headline", maxLength: 50 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 160 },
        ],
        minItems: 2,
        maxItems: 6,
        newItem: () => ({ icon: "CheckCircle", number: "", title: "Step", description: "Describe what happens at this step." }),
      },
    ],
    settings: [labelSetting("stepLabel", "Step label (before the number)", 20)],
  },
  defaultProps: {
    eyebrow: "How we work",
    headline: "From first call to launch in four steps",
    description: "A clear, repeatable process so you always know what happens next and who is responsible.",
    stepLabel: "Step",
    steps: [
      { icon: "Search", number: "01", title: "Discovery", description: "We learn your goals, your audience and what success looks like." },
      { icon: "PenTool", number: "02", title: "Design", description: "Wireframes and visual direction, reviewed with you at every stage." },
      { icon: "Zap", number: "03", title: "Build", description: "Development in weekly increments you can click through and test." },
      { icon: "Rocket", number: "04", title: "Launch", description: "Go live with monitoring, training and a support window included." },
    ],
  },
  Component: ContentProcessRoadmap,
})
