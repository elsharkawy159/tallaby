"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { HINTS, ItemText, standardHeader, stretchItems } from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Step = { title?: string; body?: string }

/**
 * Cadence — timeline archetype.
 *
 * Centered header over a vertical rail of numbered bubbles, each step's title
 * and body beside its number. The rail and bubbles are chrome (numbers derive
 * from position); the header lines and the steps are slot entries.
 */
function FeaturesTimeline ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const steps = (inst.props.steps as Step[] | undefined) ?? []
            if (steps.length === 0) return null
            return (
              <div className="relative mt-11 text-start">
                <div aria-hidden className="absolute start-[26px] top-0 bottom-0 w-px bg-primary/20" />
                <ol className="relative space-y-12">
                  {steps.map((step, i) => (
                    <li key={i} className="relative flex gap-8">
                      <div className="relative z-10 flex size-[52px] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-[color-mix(in_oklch,var(--primary)_12%,var(--background))] text-lg font-semibold tabular-nums text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 pb-2 pt-2">
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="steps"
                          index={i}
                          field="title"
                          value={step.title}
                          elementId={`title${i}`}
                          isPreview={isPreview}
                          className="text-xl font-semibold tracking-tight text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="steps"
                          index={i}
                          field="body"
                          value={step.body}
                          elementId={`body${i}`}
                          isPreview={isPreview}
                          className="mt-2 text-base leading-relaxed text-muted-foreground"
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const featuresTimelineSection = defineSection({
  id: "features-timeline",
  displayName: "Cadence",
  description: "Vertical rail of numbered steps — title and body beside each number. Built for how-it-works flows.",
  category: "features",
  layoutArchetype: "timeline",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "education", "generic"],
  trustWeight: 40,
  conversionWeight: 30,
  funnelStage: 'consideration',
  styles: ["modern", "minimal", "editorial"],
  goals: ["education", "trust", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 98,
  editable: true,
  recommendedNeighbors: { before: ["hero-center", "hero-gradient"], after: ["cta-simple", "features-grid"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader({ accent: true }),
      {
        kind: "items",
        key: "steps",
        canonical: "steps",
        label: "Steps",
        pick: [],
        itemFields: [
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
        ],
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ title: "Step", body: "Describe this step." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "How it works",
    headline: "Three steps to",
    accentWord: "launch",
    description: "From sign-up to a live site in minutes — no technical setup required.",
    steps: [
      { title: "Create your account", body: "Sign up in seconds and tell us a little about your business." },
      { title: "Shape your site", body: "Pick a starting point, then edit copy, images and colours in place." },
      { title: "Publish and grow", body: "Go live on your own domain and track what visitors do next." },
    ],
  },
  Component: FeaturesTimeline,
})
