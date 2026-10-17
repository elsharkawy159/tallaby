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
 * Quadrant — grid archetype.
 *
 * Every answer visible at once: a two-column grid of flat cards, each with an
 * optional topic label above the question. Scannable rather than collapsible —
 * for short answers a visitor should not have to click to read.
 */
function FaqGrid ({ instance, isPreview, definition }: SectionComponentProps) {
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
            <div className="grid gap-4 sm:grid-cols-2">
              {faqItems(inst).map((it, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  {it.category ? (
                    <span className="mb-3 inline-block text-xs font-semibold text-primary">
                      {it.category}
                    </span>
                  ) : null}
                  <FaqItemText
                    instance={inst}
                    isPreview={isPreview}
                    index={i}
                    field="question"
                    value={it.question}
                    as="h3"
                    className="text-[15.5px] font-semibold leading-snug text-foreground"
                  />
                  <FaqItemText
                    instance={inst}
                    isPreview={isPreview}
                    index={i}
                    field="answer"
                    value={it.answer}
                    className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground"
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

export const faqGridSection = defineSection({
  id: "faq-grid",
  displayName: "Quadrant",
  description: "Two-column grid of answer cards, each with an optional topic label — nothing to expand.",
  category: "faq",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return faqGridSection.defaultProps
    return oldProps
  },
  industries: ["saas", "startup", "ecommerce", "education", "generic"],
  trustWeight: 35,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "corporate"],
  goals: ["support", "education", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      faqHeadlineBlock(),
      faqSubheadlineBlock(),
      faqItemsBlock({
        extraFields: [{ key: "category", label: "Category label (optional)", type: "text" }],
        newItem: () => ({ question: "Question?", answer: "Answer.", category: "" }),
      }),
    ],
  },
  defaultProps: {
    headline: "Good questions, straight answers",
    subheadline: "The things people ask us most, all in one place.",
    items: [
      { question: "Which plan is right for me?", answer: "Start on Starter if you run one site. Teams that manage several brands usually move to Pro.", category: "Plans" },
      { question: "Can I switch plans later?", answer: "Upgrade or downgrade whenever you like. Changes are prorated to the day.", category: "Plans" },
      { question: "Do I need to know how to code?", answer: "No. Everything is visual, though developers can add custom code where they need it.", category: "Product" },
      { question: "Can I use my own domain?", answer: "Yes. Connect any domain you own and we handle the SSL certificate automatically.", category: "Product" },
      { question: "Where is my data stored?", answer: "In secure, encrypted data centres with daily backups kept for thirty days.", category: "Security" },
      { question: "Who can see my drafts?", answer: "Only the people you invite. Drafts stay private until you choose to publish.", category: "Security" },
    ],
  },
  Component: FaqGrid,
})
