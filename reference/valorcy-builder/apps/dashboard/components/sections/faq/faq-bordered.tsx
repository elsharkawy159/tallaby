"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FaqItemText,
  faqItems,
  faqItemsBlock,
  faqTitleBlock,
} from "@/components/sections/faq/faq-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Frame — contained archetype.
 *
 * A compact title over one bordered panel, the questions divided by hairlines
 * inside it. The panel is the section's identity; its rows are the `items`
 * collection. The title is bound to `title`, the key this section has always
 * stored.
 */
function FaqBordered ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-8"
          align="left"
          headingClassName={`${TYPE_H2_SM}`}
          renderItems={({ instance: inst }) => (
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {faqItems(inst).map((it, i) => (
                <div key={i} className="p-4">
                  <FaqItemText
                    instance={inst}
                    isPreview={isPreview}
                    index={i}
                    field="question"
                    value={it.question}
                    as="h3"
                    className="font-medium"
                  />
                  <FaqItemText
                    instance={inst}
                    isPreview={isPreview}
                    index={i}
                    field="answer"
                    value={it.answer}
                    className="mt-1 text-sm text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const faqBorderedSection = defineSection({
  id: "faq-bordered",
  displayName: "Frame",
  description: "Compact title over a single bordered panel of hairline-divided questions.",
  category: "faq",
  layoutArchetype: "contained",
  industries: ["saas", "startup", "agency", "ecommerce", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["support", "education", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["faq", "bordered", "support"],
  trustWeight: 55,
  funnelStage: "consideration",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      faqTitleBlock(),
      faqItemsBlock({ label: "Items", newItem: () => ({ question: "Q", answer: "A" }) }),
    ],
  },
  defaultProps: {
    title: "Common questions",
    items: [
      { question: "How quickly will I hear back?", answer: "We reply to every message within one business day, usually much sooner." },
      { question: "Can I change my order after placing it?", answer: "Yes — get in touch before it ships and we will update it for you at no cost." },
    ],
  },
  Component: FaqBordered,
})
