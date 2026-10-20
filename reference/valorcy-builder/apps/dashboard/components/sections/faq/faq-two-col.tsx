"use client"

import { Mail } from "lucide-react"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  FaqItemText,
  faqHeadlineBlock,
  faqItems,
  faqItemsBlock,
  faqSubheadlineBlock,
} from "@/components/sections/faq/faq-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** What a page saved before the slot migration rendered when `contactLabel` was never set. */
const CONTACT_LABEL_FALLBACK = "Lorem Ipsum"

/**
 * Margin — split archetype.
 *
 * The header and a "still have questions?" contact link pinned in a narrow
 * start column (sticky on desktop) while the answers scroll past on the end
 * side. Two slots, one per column.
 *
 * The contact link keeps the flat `contactLabel` / `contactHref` props it has
 * always stored; the href block is an inspector field only — the link carries it.
 */
function FaqTwoCol ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="bg-muted/40" style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-12 lg:grid-cols-[300px_1fr] lg:gap-20">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="intro"
            className="flex flex-col items-start gap-4 lg:sticky lg:top-16 lg:self-start"
            align="left"
            headingClassName={`${TYPE_H2} text-foreground`}
            bodyClassName={TYPE_BODY}
            overrides={{
              contactLabel: ({ instance: inst }) => {
                const label = inst.props.contactLabel
                const href = inst.props.contactHref
                const write = (t: string) =>
                  useBuilderStore.getState().updateSectionProps(inst.id, { contactLabel: t })
                return (
                  <a
                    href={isPreview ? (typeof href === "string" ? href : "#") : undefined}
                    data-element-id={`${inst.id}::contactLink`}
                    data-element-type="textLink"
                    data-element-href-prop="contactHref"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline"
                  >
                    <Mail className="size-4" aria-hidden />
                    <InlineEditableText
                      as="span"
                      value={typeof label === "string" ? label : CONTACT_LABEL_FALLBACK}
                      isPreview={isPreview}
                      onChange={write}
                      onCommit={write}
                    />
                  </a>
                )
              },
              // Carried by the link above; edited in the inspector.
              contactHref: () => null,
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="answers"
            className="flex flex-col"
            renderItems={({ instance: inst }) => (
              <div className="divide-y divide-border">
                {faqItems(inst).map((it, i) => (
                  <div key={i} className="py-7 first:pt-0">
                    <FaqItemText
                      instance={inst}
                      isPreview={isPreview}
                      index={i}
                      field="question"
                      value={it.question}
                      as="h3"
                      className="text-[16px] font-semibold leading-snug text-foreground"
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
                ))}
              </div>
            )}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const faqTwoColSection = defineSection({
  id: "faq-two-col",
  displayName: "Margin",
  description: "Sticky header and contact link in a narrow column beside a run of open answers.",
  category: "faq",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return faqTwoColSection.defaultProps
    return oldProps
  },
  industries: ["saas", "startup", "agency", "finance", "enterprise"],
  trustWeight: 35,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "corporate"],
  goals: ["support", "trust", "education"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "intro", label: "Intro", isDefault: true },
      { id: "answers", label: "Answers" },
    ],
    blocks: [
      faqHeadlineBlock(),
      faqSubheadlineBlock(),
      {
        kind: "note",
        id: "contactLabel",
        label: "Contact link label",
        field: { key: "contactLabel", label: "Contact link label", canonical: "ctaPrimary", maxLength: 40, group: "cta" },
      },
      {
        kind: "note",
        id: "contactHref",
        label: "Contact link URL",
        field: { key: "contactHref", label: "Contact link URL", type: "url", canonical: "ctaLink", group: "cta" },
      },
      faqItemsBlock({ slot: "answers", newItem: () => ({ question: "Question?", answer: "Answer." }) }),
    ],
  },
  defaultProps: {
    headline: "Frequently asked",
    subheadline: "Can't find what you are looking for? Our team is one message away.",
    contactLabel: "Contact support",
    contactHref: "#",
    items: [
      { question: "How is billing handled?", answer: "You are billed monthly or annually, by card or invoice. Every invoice is available from your account." },
      { question: "Can I add more seats later?", answer: "Yes. Add or remove seats at any time and the change is reflected on your next invoice." },
      { question: "Is there a minimum contract?", answer: "No. Monthly plans can be cancelled whenever you like; annual plans renew only if you choose to." },
      { question: "Do you offer onboarding?", answer: "Every new account gets a guided setup call, and larger teams get a dedicated onboarding manager." },
      { question: "What integrations are available?", answer: "We connect with the tools most teams already use, and an open API covers everything else." },
    ],
  },
  Component: FaqTwoCol,
})
