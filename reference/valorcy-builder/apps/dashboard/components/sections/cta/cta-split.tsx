"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CtaChecklist, CtaEmailField, trustItemsBlock } from "@/components/sections/cta/cta-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Card copy that pages saved before the slot migration rendered as hardcoded
 * text. Those pages carry no prop for it, so the fallback keeps them unchanged
 * while new instances store (and can edit) the value.
 */
const FORM_TITLE_FALLBACK = "Create your free account"
const FORM_NOTE_FALLBACK = "No credit card required. Free forever plan available."

/** A note block that renders a fallback when its prop has never been set. */
function noteWithFallback (key: string, fallback: string, className: string, isPreview?: boolean): BlockOverride {
  return function NoteWithFallback ({ instance }) {
    const raw = instance.props[key]
    if (raw === "") return null
    const write = (t: string) => useBuilderStore.getState().updateSectionProps(instance.id, { [key]: t })
    return (
      <InlineEditableText
        as="p"
        data-element-id={`${instance.id}::${key}`}
        data-element-type="text"
        className={className}
        value={typeof raw === "string" ? raw : fallback}
        isPreview={isPreview}
        onChange={write}
        onCommit={write}
      />
    )
  }
}

/**
 * Ledger — split archetype.
 *
 * The argument on the start side (headline, description, trust bullets), the
 * sign-up on the end side, in its own card. Splitting persuasion from action is
 * what makes this the highest-intent CTA in the catalog. Two slots, one per
 * column; the card's surface is chrome, its contents are entries.
 */
function CtaSplit ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative overflow-x-clip" style={rootStyle}>
      <SectionContainer className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start gap-5"
          align="left"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={TYPE_LEAD}
          renderItems={({ instance: inst }) => (
            <CtaChecklist
              instance={inst}
              isPreview={isPreview}
              className="mt-2 flex flex-col gap-3"
              itemClassName="gap-3 text-foreground"
            />
          )}
        />

        <div className="rounded-2xl bg-muted/50 p-7 sm:p-9">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="form"
            className="flex flex-col gap-3"
            align="left"
            ctaClassName="w-full [&>*]:w-full"
            overrides={{
              formTitle: noteWithFallback(
                "formTitle",
                FORM_TITLE_FALLBACK,
                "mb-2 font-heading text-lg font-semibold text-foreground",
                isPreview
              ),
              emailPlaceholder: ({ instance: inst }) => (
                <CtaEmailField instance={inst} isPreview={isPreview} />
              ),
              formNote: noteWithFallback(
                "formNote",
                FORM_NOTE_FALLBACK,
                "mt-1 text-sm text-muted-foreground",
                isPreview
              ),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const ctaSplitSection = defineSection({
  id: "cta-split",
  displayName: "Ledger",
  description: "Split closer — the argument and trust bullets beside a sign-up card.",
  category: "cta",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "startup", "agency", "generic", "enterprise", "finance"],
  trustWeight: 15,
  conversionWeight: 85,
  funnelStage: "decision",
  styles: ["modern", "corporate", "minimal"],
  goals: ["leads", "conversion", "sales"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["split", "email-capture", "lead-gen"],
  recommendedNeighbors: { before: ["features-grid", "pricing-table"], after: ["footer-minimal"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "form", label: "Sign-up card" },
    ],
    blocks: [
      { kind: "heading", level: 2, accent: false },
      { kind: "body" },
      trustItemsBlock(["Set up in under five minutes", "Cancel anytime, no lock-in", "Support from real humans"]),
      {
        kind: "note",
        id: "formTitle",
        label: "Card title",
        slot: "form",
        field: { key: "formTitle", canonical: "subheadline", maxLength: 50 },
      },
      {
        kind: "note",
        id: "emailPlaceholder",
        label: "Email placeholder",
        slot: "form",
        field: { key: "emailPlaceholder", maxLength: 40 },
      },
      { kind: "ctaRow", slot: "form", minItems: 1, maxItems: 2 },
      {
        kind: "note",
        id: "formNote",
        label: "Card small print",
        slot: "form",
        field: { key: "formNote", maxLength: 100 },
      },
    ],
  },
  defaultProps: {
    headline: "Start shipping faster today",
    description: "Everything you need to build and launch a professional website — without writing a line of code.",
    formTitle: FORM_TITLE_FALLBACK,
    emailPlaceholder: "Enter your work email",
    buttons: [{ label: "Get started free", href: "#", variant: "primary" }],
    formNote: FORM_NOTE_FALLBACK,
  },
  Component: CtaSplit,
})
