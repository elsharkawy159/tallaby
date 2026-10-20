"use client"

import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FaqChevron,
  faqHeadlineBlock,
  faqSubheadlineBlock,
  listEntryClass,
  type FaqEntry,
} from "@/components/sections/faq/faq-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type FaqTab = { label?: string; items?: FaqEntry[] }

/**
 * Folio — tabs archetype.
 *
 * Topic pills across the top, the active topic's questions in a single card
 * below as a native `<details>` accordion. The `tabs` collection nests each
 * topic's `{ question, answer }` pairs, exactly as it always has; the tab bar
 * and the card render together as that one collection entry.
 */
function FaqTabs ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="bg-muted/40" style={rootStyle}>
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
          entryClassName={listEntryClass("mt-7 w-full self-stretch")}
          renderItems={({ instance: inst }) => {
            const raw = inst.props.tabs
            const tabs = Array.isArray(raw) ? (raw as FaqTab[]) : []
            const tabIndex = activeTab < tabs.length ? activeTab : 0
            const currentTab = tabs[tabIndex]
            const qa = currentTab?.items ?? []
            const store = useBuilderStore.getState

            /** Nested Q&A lives inside the tab item, so an edit rewrites that tab's list. */
            const writeQa = (i: number, field: "question" | "answer") => (t: string) => {
              const next = qa.map((it, j) => (j === i ? { ...it, [field]: t } : it))
              store().updateItem(inst.id, "tabs", tabIndex, { items: next })
            }

            return (
              <div>
                <div role="tablist" aria-label="FAQ categories" className="mb-10 flex flex-wrap justify-center gap-2">
                  {tabs.map((tab, i) => {
                    const isActive = i === tabIndex
                    return (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(i)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-[13.5px] font-medium transition-all duration-200",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        {/* Edited in the inspector: a contentEditable inside a
                            <button> is unreliable across browsers. */}
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                {currentTab ? (
                  <div className="divide-y divide-border rounded-2xl border border-border bg-card px-6 text-start sm:px-8">
                    {qa.map((it, i) => (
                      <details key={`${tabIndex}-${i}`} className="group py-5" {...(i === 0 ? { open: true } : {})}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-start">
                          <InlineEditableText
                            as="span"
                            className="text-[15.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
                            value={String(it.question ?? "")}
                            isPreview={isPreview}
                            onChange={writeQa(i, "question")}
                            onCommit={writeQa(i, "question")}
                          />
                          <FaqChevron />
                        </summary>
                        <InlineEditableText
                          as="p"
                          className="mt-3 pe-12 text-[14.5px] leading-relaxed text-muted-foreground"
                          value={String(it.answer ?? "")}
                          isPreview={isPreview}
                          onChange={writeQa(i, "answer")}
                          onCommit={writeQa(i, "answer")}
                        />
                      </details>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const faqTabsSection = defineSection({
  id: "faq-tabs",
  displayName: "Folio",
  description: "Topic pills over a card of expandable answers for the active topic.",
  category: "faq",
  layoutArchetype: "tabs",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "ecommerce", "enterprise", "generic"],
  trustWeight: 35,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["modern", "corporate", "minimal"],
  goals: ["support", "education", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 83,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      faqHeadlineBlock(),
      faqSubheadlineBlock(),
      {
        kind: "items",
        key: "tabs",
        canonical: "items",
        label: "Categories",
        pick: [],
        itemFields: [{ key: "label", label: "Tab label", type: "text" }],
        minItems: 1,
        maxItems: 8,
        newItem: () => ({
          label: "Category",
          items: [{ question: "Question?", answer: "Answer." }],
        }),
      },
    ],
  },
  defaultProps: {
    headline: "Everything you might ask",
    subheadline: "Pick a topic to see the questions we hear most about it.",
    tabs: [
      {
        label: "Billing",
        items: [
          { question: "When will I be charged?", answer: "On the day your trial ends, then on the same date each month or year after that." },
          { question: "Can I get a refund?", answer: "If something is not right in your first thirty days, contact us for a full refund." },
          { question: "Do you charge VAT or sales tax?", answer: "Tax is added where required by law and shown clearly on every invoice." },
        ],
      },
      {
        label: "Product",
        items: [
          { question: "Does it work on mobile?", answer: "Yes. Everything you build is responsive, and you can preview each breakpoint before publishing." },
          { question: "Can I export my content?", answer: "Export pages and data at any time. Your content is always yours." },
          { question: "Is there an API?", answer: "A documented REST API is available on every paid plan." },
        ],
      },
      {
        label: "Account",
        items: [
          { question: "How do I add a teammate?", answer: "Invite them from Settings → Members and choose the role they should have." },
          { question: "Can I transfer ownership?", answer: "Owners can hand the account to any admin from the account settings page." },
        ],
      },
      {
        label: "Support",
        items: [
          { question: "What are your support hours?", answer: "Our team is online every weekday from 8am to 8pm, with urgent cover at weekends." },
          { question: "Do you offer setup help?", answer: "Yes. Every plan includes a free onboarding call with one of our specialists." },
        ],
      },
    ],
  },
  Component: FaqTabs,
})
