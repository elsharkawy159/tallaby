"use client"

import { useState } from "react"
import { Search } from "lucide-react"
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
  type FaqEntry,
} from "@/components/sections/faq/faq-parts"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** What a page saved before the slot migration rendered when `placeholder` was never set. */
const PLACEHOLDER_FALLBACK = "Lorem ipsum dolor sit amet…"

/** The search field and the results fill the row and sit further down than the header lines. */
function entryClass (entry: SlotEntry): string | undefined {
  if (entry.kind !== "block") return undefined
  if (entry.block.id === "placeholder") return "mt-7 w-full self-stretch text-start"
  if (entry.block.kind === "items") return "mt-9 w-full self-stretch text-start"
  return undefined
}

/**
 * Lookup — directory archetype.
 *
 * A help-centre page in one section: header, a search field, and every answer
 * grouped under its category. The field filters live on the published site and
 * in preview; on the canvas it stays read-only so the full list remains
 * editable. The field and the grouped results are separate slot entries; the
 * filter state is the section's, so they keep working wherever the user moves
 * them.
 */
function FaqSearch ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const [query, setQuery] = useState("")

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
          entryClassName={entryClass}
          overrides={{
            placeholder: ({ instance: inst }) => {
              const placeholder = inst.props.placeholder
              return (
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    placeholder={typeof placeholder === "string" ? placeholder : PLACEHOLDER_FALLBACK}
                    value={isPreview ? query : ""}
                    onChange={isPreview ? (e) => setQuery(e.target.value) : undefined}
                    readOnly={!isPreview}
                    className="h-12 w-full rounded-xl border border-border bg-card pe-4 ps-11 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )
            },
          }}
          renderItems={({ instance: inst }) => {
            const items = faqItems(inst)
            const q = query.trim().toLowerCase()
            const filtered = q
              ? items.filter(
                  (it) =>
                    String(it.question ?? "").toLowerCase().includes(q) ||
                    String(it.answer ?? "").toLowerCase().includes(q)
                )
              : items

            const groups = filtered.reduce<Record<string, FaqEntry[]>>((acc, it) => {
              const cat = it.category || "General"
              ;(acc[cat] ??= []).push(it)
              return acc
            }, {})
            const entries = Object.entries(groups)

            return (
              <div className="space-y-10">
                {entries.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
                )}
                {entries.map(([category, groupItems]) => (
                  <div key={category}>
                    <h3 className="mb-5 text-xs font-semibold text-primary">
                      {category}
                    </h3>
                    <div className="divide-y divide-border">
                      {groupItems.map((it, i) => {
                        const globalIdx = items.indexOf(it)
                        return (
                          <div key={i} className="py-5">
                            <FaqItemText
                              instance={inst}
                              isPreview={isPreview}
                              index={globalIdx}
                              field="question"
                              value={it.question}
                              as="h4"
                              className="text-[15.5px] font-semibold text-foreground"
                            />
                            <FaqItemText
                              instance={inst}
                              isPreview={isPreview}
                              index={globalIdx}
                              field="answer"
                              value={it.answer}
                              className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground"
                            />
                          </div>
                        )
                      })}
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

export const faqSearchSection = defineSection({
  id: "faq-search",
  displayName: "Lookup",
  description: "Help-centre layout — a live search field over answers grouped by category.",
  category: "faq",
  layoutArchetype: "directory",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "enterprise", "ecommerce", "education", "generic"],
  trustWeight: 35,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "corporate"],
  goals: ["support", "education", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      faqHeadlineBlock(),
      faqSubheadlineBlock(),
      {
        kind: "note",
        id: "placeholder",
        label: "Search field",
        field: { key: "placeholder", label: "Search placeholder", type: "text", maxLength: 60 },
      },
      faqItemsBlock({
        maxItems: 40,
        extraFields: [{ key: "category", label: "Category", type: "text" }],
        newItem: () => ({ question: "Question?", answer: "Answer.", category: "General" }),
      }),
    ],
  },
  defaultProps: {
    headline: "How can we help?",
    subheadline: "Search the help centre or browse answers by topic.",
    placeholder: "Search for an answer…",
    items: [
      { question: "How do I create an account?", answer: "Click Sign up, enter your email and choose a password. You will be in your dashboard in under a minute.", category: "Getting started" },
      { question: "How do I invite my team?", answer: "Open Settings, then Members, and send invitations by email. Each person can be given their own role.", category: "Getting started" },
      { question: "Which payment methods do you accept?", answer: "All major credit and debit cards. Annual plans can also be paid by bank transfer.", category: "Billing" },
      { question: "Where can I download invoices?", answer: "Every invoice is stored under Billing in your account settings and can be downloaded as a PDF.", category: "Billing" },
      { question: "How do I reset my password?", answer: "Use the Forgot password link on the sign-in page and follow the link we email you.", category: "Account" },
      { question: "Can I change the email on my account?", answer: "Yes. Update it under Profile; we will ask you to confirm the new address before it takes effect.", category: "Account" },
      { question: "How do I contact support?", answer: "Start a chat from any page, or email our team. We respond every weekday, usually within a few hours.", category: "Support" },
      { question: "Do you have a status page?", answer: "Yes. Live system status and incident history are published on our public status page.", category: "Support" },
    ],
  },
  Component: FaqSearch,
})
