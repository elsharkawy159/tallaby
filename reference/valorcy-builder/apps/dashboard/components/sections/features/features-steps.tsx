"use client"

import { Check } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import {
  SECTION_THUMB_PLACEHOLDER,
  SectionEditableImage,
  useSectionSurface,
} from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  pillEyebrow,
  standardHeader,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Step = {
  label?: string
  title?: string
  body?: string
  checks?: { text?: string }[]
  imageUrl?: string
  imageAlt?: string
}

/**
 * Pathway — captioned-grid archetype.
 *
 * Centered header over three image-led steps: an image, then a numbered badge,
 * title, body and check bullets captioned beneath it, with a dashed connector
 * running between the badges on desktop. The connector and badges are chrome;
 * the header lines and the steps collection are slot entries.
 */
function FeaturesSteps ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="relative overflow-x-clip border-y border-border bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-4`}
          overrides={{ eyebrow: pillEyebrow(isPreview, "mb-5") }}
          renderItems={({ instance: inst }) => {
            const steps = (inst.props.steps as Step[] | undefined) ?? []
            if (steps.length === 0) return null
            return (
              <div className="relative mt-16 grid grid-cols-1 gap-8 text-start md:grid-cols-3 md:gap-10">
                {steps.length > 1 && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute start-[16.6%] end-[16.6%] top-[calc(200px+28px+14px)] hidden h-0.5 bg-[repeating-linear-gradient(90deg,color-mix(in_oklch,var(--primary)_35%,transparent)_0_6px,transparent_6px_12px)] md:block"
                  />
                )}

                {steps.map((step, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="relative mb-7 aspect-[1.1/1] overflow-hidden rounded-2xl border border-border bg-card">
                      {step.imageUrl ? (
                        <SectionEditableImage
                          instanceId={inst.id}
                          elementKey={`step${i}Image`}
                          src={step.imageUrl}
                          alt={step.imageAlt || step.title || ""}
                          collectionKey="steps"
                          collectionIndex={i}
                          itemSrcProp="imageUrl"
                          itemAltProp="imageAlt"
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : (
                        <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
                      )}
                    </div>

                    <div className="relative z-10 mb-4 inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-card px-3.5 py-1.5">
                      <span className="grid size-6 place-items-center rounded-full bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_80%,var(--primary-foreground)),var(--primary))] text-xs font-semibold text-primary-foreground">
                        {i + 1}
                      </span>
                      <ItemText
                        instance={inst}
                        collection="steps"
                        index={i}
                        field="label"
                        value={step.label}
                        isPreview={isPreview}
                        className="text-xs font-semibold text-muted-foreground"
                      />
                    </div>

                    <ItemText
                      as="h3"
                      instance={inst}
                      collection="steps"
                      index={i}
                      field="title"
                      value={step.title}
                      isPreview={isPreview}
                      className="mb-3 text-2xl font-semibold leading-[1.15] tracking-tight text-foreground"
                    />
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="steps"
                      index={i}
                      field="body"
                      value={step.body}
                      isPreview={isPreview}
                      className="mb-5 text-[15px] leading-relaxed text-muted-foreground"
                    />

                    <ul className="mt-auto space-y-2.5">
                      {(step.checks ?? []).map((c, ci) => (
                        <li key={ci} className="flex items-start gap-2.5 text-[13.5px] text-foreground/90">
                          <span className="mt-0.5 grid size-4 flex-shrink-0 place-items-center text-muted-foreground">
                            <Check className="size-2.5" strokeWidth={2.5} aria-hidden />
                          </span>
                          {c.text}
                        </li>
                      ))}
                    </ul>
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

const CHECKS = (a: string, b: string, c: string) => [{ text: a }, { text: b }, { text: c }]

export const featuresStepsSection = defineSection({
  id: "features-steps",
  displayName: "Pathway",
  description: "Three image-led steps, each captioned with a numbered badge, title, body and check bullets.",
  category: "features",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "education", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["education", "trust", "conversion"],
  complexity: 'medium',
  density: 'medium',
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["features", "steps", "process", "how-it-works"],
  funnelStage: 'consideration',
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader(),
      {
        kind: "items",
        key: "steps",
        canonical: "steps",
        label: "Steps",
        pick: [],
        itemFields: [
          { key: "label", label: "Step label", type: "text" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
          { key: "imageUrl", label: "Image", type: "image" },
          { key: "imageAlt", label: "Image alt", type: "text", canonical: "imageAlt", aiHint: "Accessible alt text for the image (describe what is shown)", maxLength: 120, group: "media" },
        ],
        minItems: 1,
        maxItems: 5,
        newItem: () => ({
          label: "Step",
          title: "Step title",
          body: "Describe this step.",
          checks: [{ text: "Benefit" }, { text: "Benefit" }],
          imageUrl: "",
          imageAlt: "",
        }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "How it works",
    headline: "From idea to live site in three steps",
    description: "No design experience and no developer required. Most people publish their first site in under fifteen minutes.",
    steps: [
      {
        label: "Choose",
        title: "Pick a starting point",
        body: "Browse layouts built for your industry and choose the one closest to your vision.",
        checks: CHECKS("Industry-ready layouts", "Mobile-first by default", "Swap sections any time"),
        imageUrl: "",
        imageAlt: "Gallery of website layouts",
      },
      {
        label: "Customise",
        title: "Make it your own",
        body: "Edit text in place, drop in your images and set your brand colours once.",
        checks: CHECKS("Inline editing", "Brand colours and fonts", "Undo every change"),
        imageUrl: "",
        imageAlt: "Editor with a page being customised",
      },
      {
        label: "Publish",
        title: "Go live with confidence",
        body: "Connect your domain and publish — SSL, hosting and backups are included.",
        checks: CHECKS("Custom domain and SSL", "Global hosting", "One-click rollback"),
        imageUrl: "",
        imageAlt: "Published website on a phone and laptop",
      },
    ],
  },
  Component: FeaturesSteps,
})
