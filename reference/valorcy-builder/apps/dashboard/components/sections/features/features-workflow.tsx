"use client"

import { Upload, Cpu, BarChart, ArrowRight, Zap, Database, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  iconField,
  iconFor,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Upload, Cpu, BarChart, ArrowRight, Zap, Database }

type WorkflowStep = { icon?: string; title?: string; description?: string }

/**
 * Pipeline — stepper archetype.
 *
 * Centered header over a row of icon nodes joined by a connector, each with a
 * numbered pip, title and description. Nodes, pips and connector are chrome;
 * the header lines and the steps collection are slot entries.
 */
function FeaturesWorkflow ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          entryClassName={stretchItems}
          align="center"
          renderItems={({ instance: inst }) => {
            const steps = (inst.props.steps as WorkflowStep[] | undefined) ?? []
            if (steps.length === 0) return null
            return (
              <div className="relative mt-11">
                <div aria-hidden className="absolute start-1/2 top-8 hidden h-full w-px -translate-x-1/2 bg-primary/20 lg:block" />
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                  {steps.map((step, i) => {
                    const Icon = iconFor(ICONS, step.icon, Zap)
                    return (
                      <div key={i} className="relative flex flex-col items-center text-center">
                        <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-primary">
                          <Icon className="size-7" aria-hidden />
                          <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {i + 1}
                          </span>
                        </div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="steps"
                          index={i}
                          field="title"
                          value={step.title}
                          elementId={`title${i}`}
                          isPreview={isPreview}
                          className="mt-5 text-lg font-semibold tracking-tight text-foreground"
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
                          className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground"
                        />
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

export const featuresWorkflowSection = defineSection({
  id: "features-workflow",
  displayName: "Pipeline",
  description: "A row of numbered icon nodes joined by a connector — a product or AI workflow end to end.",
  category: "features",
  layoutArchetype: "stepper",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "ai_startup", "software", "tech", "startup"],
  styles: ["modern", "minimal"],
  goals: ["education", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 65,
  trustWeight: 50,
  tags: ["workflow", "process", "saas", "steps", "how-it-works"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label above headline (2-4 words)" }),
      headingBlock({ headline: { aiHint: "Workflow section headline (6-10 words)", maxLength: 80 } }),
      descriptionBlock({ aiHint: "Brief description of the workflow (1-2 sentences)", maxLength: 160 }),
      {
        kind: "items",
        key: "steps",
        canonical: "steps",
        label: "Workflow steps",
        pick: [],
        itemFields: [
          iconField(ICONS),
          { key: "title", label: "Step title", type: "text", canonical: "headline", aiHint: "Step name (3-6 words)", maxLength: 40 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "What happens at this step (1-2 sentences)", maxLength: 120 },
        ],
        minItems: 2,
        maxItems: 6,
        newItem: () => ({ icon: "Zap", title: "New step", description: "Describe what happens at this step." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "How it works",
    headline: "Automate your entire workflow",
    description: "From raw input to actionable insight in minutes — no code required.",
    steps: [
      { icon: "Upload", title: "Connect your data", description: "Upload files or link the tools you already use in a few clicks." },
      { icon: "Cpu", title: "Let it process", description: "Models clean, classify and enrich every record automatically." },
      { icon: "BarChart", title: "Act on insight", description: "Review clear reports and push results back to your team." },
    ],
  },
  Component: FeaturesWorkflow,
})
