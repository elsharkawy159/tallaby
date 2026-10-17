"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type QAItem = { question?: string; answer?: string }

/**
 * Primer — list archetype.
 *
 * A headline over a static, numbered list of questions and answers divided by
 * hairlines. No accordion: every answer is visible, which reads as an article
 * rather than a help widget. The numbering is derived, never stored.
 */
function ContentFaqStyle ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-10"
          align="left"
          headingClassName={`${TYPE_H2} text-foreground`}
          renderItems={({ instance: inst }) => {
            const items = (inst.props.items as QAItem[] | undefined) ?? []
            if (items.length === 0) return null
            return (
              <div className="divide-y divide-border">
                {items.map((item, i) => (
                  <div key={i} className="py-8">
                    <div className="flex gap-6">
                      <span aria-hidden className="mt-0.5 shrink-0 text-sm font-semibold tabular-nums text-primary/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="question"
                          value={item.question}
                          elementId={`q${i}`}
                          isPreview={isPreview}
                          className="text-base font-semibold text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="items"
                          index={i}
                          field="answer"
                          value={item.answer}
                          elementId={`a${i}`}
                          isPreview={isPreview}
                          className="mt-3 text-sm leading-7 text-muted-foreground"
                        />
                      </div>
                    </div>
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

export const contentFaqStyleSection = defineSection({
  id: "content-faq-style",
  displayName: "Primer",
  description: "Numbered questions and answers, all visible, divided by hairlines — no accordion.",
  category: "content",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "education", "finance", "real_estate"],
  trustWeight: 30,
  conversionWeight: 15,
  funnelStage: "awareness",
  styles: ["editorial", "minimal", "modern", "corporate"],
  goals: ["education", "trust", "support", "awareness"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: { headline: { key: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80 } },
      },
      {
        kind: "items",
        key: "items",
        canonical: "faqs",
        label: "Q&A items",
        pick: [],
        itemFields: [
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
        ],
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ question: "Your question here?", answer: "Your answer here." }),
      },
    ],
  },
  defaultProps: {
    headline: "Questions we hear before every project",
    items: [
      {
        question: "How long does a typical engagement take?",
        answer: "Most projects run six to ten weeks from kickoff to launch, depending on scope and how quickly feedback comes back.",
      },
      {
        question: "Do you work with in-house teams?",
        answer: "Yes. We often pair with internal designers and engineers, and hand over documentation so your team owns the result.",
      },
      {
        question: "What does it cost?",
        answer: "Every proposal is fixed-price and itemised, so you know the full cost before any work begins.",
      },
      {
        question: "What happens after launch?",
        answer: "You get thirty days of support included, and optional monthly retainers for ongoing improvements.",
      },
    ],
  },
  Component: ContentFaqStyle,
})
