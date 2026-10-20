"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FaqChevron,
  FaqItemText,
  faqHeadlineBlock,
  faqItems,
  faqItemsBlock,
  faqSubheadlineBlock,
  listEntryClass,
} from "@/components/sections/faq/faq-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Concertina — accordion archetype.
 *
 * A centered header over hairline-divided rows that open in place, built on
 * native `<details>`/`<summary>` so it needs no client state. The first row
 * starts open. Header lines and the row list share one slot, so a user can put
 * the questions first or drop a button under them.
 */
function FaqAccordion ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center gap-3 text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={TYPE_BODY}
          entryClassName={listEntryClass("mt-9 w-full self-stretch text-start")}
          renderItems={({ instance: inst }) => (
            <div className="divide-y divide-border">
              {faqItems(inst).map((it, i) => (
                <details key={i} className="group py-5" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-start">
                    <FaqItemText
                      instance={inst}
                      isPreview={isPreview}
                      index={i}
                      field="question"
                      value={it.question}
                      as="span"
                      className="text-[16px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
                    />
                    <FaqChevron />
                  </summary>
                  <FaqItemText
                    instance={inst}
                    isPreview={isPreview}
                    index={i}
                    field="answer"
                    value={it.answer}
                    className="mt-3 pe-12 text-[15px] leading-relaxed text-muted-foreground"
                  />
                </details>
              ))}
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const faqAccordionSection = defineSection({
  id: "faq-accordion",
  displayName: "Concertina",
  description: "Centered header over hairline rows that expand in place — the first one open.",
  category: "faq",
  layoutArchetype: "accordion",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return faqAccordionSection.defaultProps
    return oldProps
  },
  industries: ["app_landing", "saas", "startup", "agency", "ecommerce", "generic", "dentist", "fitness", "real_estate", "law", "travel", "event", "restaurant"],
  trustWeight: 35,
  conversionWeight: 45,
  funnelStage: "consideration",
  styles: ["minimal", "modern", "corporate"],
  goals: ["support", "education", "trust"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      faqHeadlineBlock(),
      faqSubheadlineBlock(),
      faqItemsBlock({ newItem: () => ({ question: "Question?", answer: "Answer." }) }),
    ],
  },
  defaultProps: {
    headline: "Questions, answered",
    subheadline: "Everything you need to know before you get started.",
    items: [
      { question: "How long does setup take?", answer: "Most teams are up and running in under ten minutes. Import your content, pick a layout and publish." },
      { question: "Can I cancel at any time?", answer: "Yes. Plans are month to month, and you can cancel from your account settings in two clicks." },
      { question: "Do you offer a free trial?", answer: "Every plan starts with a 14-day free trial. No credit card is required to begin." },
      { question: "Is my data secure?", answer: "All data is encrypted in transit and at rest, and we run regular third-party security audits." },
      { question: "How do I reach support?", answer: "Our team answers by chat and email every weekday, usually within a couple of hours." },
    ],
  },
  Component: FaqAccordion,
})
