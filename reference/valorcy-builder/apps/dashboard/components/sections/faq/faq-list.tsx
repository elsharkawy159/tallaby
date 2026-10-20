"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FaqItemText,
  faqHeadlineBlock,
  faqItems,
  faqItemsBlock,
  faqSubheadlineBlock,
  listEntryClass,
} from "@/components/sections/faq/faq-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Index — list archetype.
 *
 * Editorial and start-aligned: a large header ruled off from a numbered run of
 * questions, each answer always open beneath its question. The rule rides on
 * the list entry, so it stays between the header and the questions in the
 * default order and travels with the list if the user moves it.
 */
function FaqList ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-3"
          align="left"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={TYPE_BODY}
          entryClassName={listEntryClass("mt-5 border-t border-border/60 pt-14")}
          renderItems={({ instance: inst }) => (
            <ol className="space-y-10">
              {faqItems(inst).map((it, i) => (
                <li key={i} className="grid grid-cols-[48px_1fr] items-start gap-4">
                  <span className="pt-1 font-heading text-sm font-semibold tabular-nums text-muted-foreground" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <FaqItemText
                      instance={inst}
                      isPreview={isPreview}
                      index={i}
                      field="question"
                      value={it.question}
                      as="h3"
                      className="text-[17px] font-semibold leading-snug text-foreground"
                    />
                    <FaqItemText
                      instance={inst}
                      isPreview={isPreview}
                      index={i}
                      field="answer"
                      value={it.answer}
                      className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground"
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const faqListSection = defineSection({
  id: "faq-list",
  displayName: "Index",
  description: "Editorial numbered run of questions under a ruled header, every answer open.",
  category: "faq",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["portfolio", "creative", "agency", "startup", "nonprofit", "generic"],
  trustWeight: 35,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["editorial", "minimal", "modern"],
  goals: ["education", "support", "trust"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      faqHeadlineBlock(),
      faqSubheadlineBlock(),
      faqItemsBlock({ newItem: () => ({ question: "Question?", answer: "Answer." }) }),
    ],
  },
  defaultProps: {
    headline: "Before we work together",
    subheadline: "What clients usually want to know at the start of a project.",
    items: [
      { question: "What does a typical project look like?", answer: "A short discovery call, a written proposal, then focused work in two-week rounds with a review at the end of each." },
      { question: "How do you price your work?", answer: "Fixed price per phase, agreed up front. You always know the cost before any work begins." },
      { question: "How long does a project take?", answer: "Most engagements run between four and ten weeks, depending on scope and how quickly feedback comes back." },
      { question: "Who will I be working with?", answer: "The same small team from the first call to launch — no hand-offs to people you have never met." },
      { question: "What happens after launch?", answer: "Thirty days of support are included. After that, an optional monthly retainer covers updates and fixes." },
      { question: "Do you work with teams abroad?", answer: "Yes. We work remotely with clients across time zones and schedule calls in your working hours." },
    ],
  },
  Component: FaqList,
})
