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
 * Hush — minimal archetype.
 *
 * A small title and a plain stack of questions and answers: no rules, no cards,
 * no chevrons. For a page that only needs a couple of quick clarifications. The
 * title is bound to `title`, the key this section has always stored.
 */
function FaqMinimal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-6"
          align="left"
          headingClassName={`${TYPE_H2_SM}`}
          renderItems={({ instance: inst }) => (
            <div className="flex flex-col gap-4">
              {faqItems(inst).map((it, i) => (
                <div key={i}>
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

export const faqMinimalSection = defineSection({
  id: "faq-minimal",
  displayName: "Hush",
  description: "Small title over a plain stack of questions and answers — no rules, cards or toggles.",
  category: "faq",
  layoutArchetype: "minimal",
  industries: ["saas", "startup", "portfolio", "creative", "generic"],
  styles: ["minimal", "modern"],
  goals: ["support", "education", "trust"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["faq", "minimal", "clean"],
  trustWeight: 50,
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
    title: "Quick answers",
    items: [
      { question: "Do you ship internationally?", answer: "Yes. We ship to over forty countries, with tracking on every order." },
    ],
  },
  Component: FaqMinimal,
})
