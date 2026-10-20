"use client"

import { ArrowRight, Zap, MousePointerClick, BarChart2, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  CENTERED_HEADER,
  ItemText,
  actionBlocks,
  actionOverrides,
  stretchItems,
} from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Zap, MousePointerClick, BarChart2, ArrowRight }

type Step = { icon?: string; number?: string; title?: string; description?: string }

/**
 * Sequence — stepper archetype.
 *
 * A centered header, three numbered icon tiles joined by arrows, and one
 * action underneath. The explainer every landing page needs between the hero
 * and the proof.
 */
function ContentHowItWorks ({ instance, isPreview, definition }: SectionComponentProps) {
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
          overrides={actionOverrides("mt-7 px-7 py-3.5", { arrow: true })}
          renderItems={({ instance: inst }) => {
            const steps = (inst.props.steps as Step[] | undefined) ?? []
            if (steps.length === 0) return null
            return (
              <div className="relative mt-11 grid grid-cols-1 gap-8 md:grid-cols-3">
                {steps.map((step, i) => {
                  const Icon = ICONS[step.icon ?? ""] ?? Zap
                  const isLast = i === steps.length - 1
                  return (
                    <div key={i} className="relative flex flex-col items-center text-center">
                      {!isLast && (
                        <ArrowRight
                          className="absolute -right-4 top-8 z-10 hidden size-6 text-muted-foreground/40 md:block rtl:rotate-180"
                          aria-hidden
                        />
                      )}
                      <div className="relative flex size-20 items-center justify-center rounded-2xl bg-primary/[0.12]">
                        <Icon className="size-8 text-primary" aria-hidden />
                        <div className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {step.number || i + 1}
                        </div>
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
                        className="mt-5 text-lg font-semibold text-foreground"
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

export const contentHowItWorksSection = defineSection({
  id: "content-how-it-works",
  displayName: "Sequence",
  description: "Three numbered icon steps joined by arrows, with one action underneath.",
  category: "content",
  layoutArchetype: "stepper",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "app_landing", "ai_startup", "software", "ecommerce"],
  styles: ["modern", "minimal"],
  goals: ["education", "conversion", "engagement"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 70,
  trustWeight: 55,
  tags: ["how-it-works", "steps", "process", "landing-page", "explainer"],
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
        label: "Steps",
        pick: [],
        itemFields: [
          { key: "icon", label: "Icon", type: "select", options: Object.keys(ICONS).map((k) => ({ label: k, value: k })) },
          { key: "number", label: "Step number (optional)", type: "text", aiHint: "e.g. 1, 2, 3", maxLength: 4 },
          { key: "title", label: "Step title", type: "text", canonical: "headline", maxLength: 50 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 160 },
        ],
        minItems: 2,
        maxItems: 5,
        newItem: () => ({ icon: "Zap", number: "", title: "Step", description: "Describe this step." }),
      },
      ...actionBlocks({ maxLength: 40 }),
    ],
  },
  defaultProps: {
    eyebrow: "How it works",
    headline: "Up and running in three steps",
    description: "No setup calls, no migration project. Most teams are live the same afternoon.",
    steps: [
      { icon: "MousePointerClick", number: "1", title: "Connect your tools", description: "Link the apps you already use in a couple of clicks." },
      { icon: "Zap", number: "2", title: "Automate the busywork", description: "Turn repetitive tasks into workflows that run on their own." },
      { icon: "BarChart2", number: "3", title: "Watch the results", description: "Track time saved and output gained on a live dashboard." },
    ],
    ctaLabel: "Get started free",
    ctaHref: "#",
  },
  Component: ContentHowItWorks,
})
