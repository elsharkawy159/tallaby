"use client"

import type { CSSProperties } from "react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD, SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { propText } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Epigraph — centered archetype.
 *
 * One pull quote under an oversized, faded quotation mark, with the author's
 * name and title beneath. The mark is decoration; the quote and both lines of
 * attribution are slot entries.
 */
function ContentQuote ({ instance, isPreview, definition }: SectionComponentProps) {
  return (
    <section className="bg-background" style={SECTION_PADDING_STANDARD as CSSProperties}>
      <SectionContainer>
        <div className="text-center">
          <div aria-hidden className="select-none font-serif text-8xl leading-none text-primary opacity-20">
            &ldquo;
          </div>
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="-mt-4 flex flex-col items-center gap-1"
            align="center"
            overrides={{
              quote: propText("quote", {
                as: "blockquote",
                className: "mb-7 text-2xl font-medium leading-relaxed text-foreground md:text-3xl",
              }),
              author: propText("author", { as: "span", className: "text-base font-semibold text-foreground" }),
              authorTitle: propText("authorTitle", { as: "span", className: "text-sm text-muted-foreground" }),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentQuoteSection = defineSection({
  id: "content-quote",
  displayName: "Epigraph",
  description: "One large pull quote under an oversized quotation mark, with the author's name and title.",
  category: "content",
  layoutArchetype: "centered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["generic", "creative", "portfolio", "agency", "nonprofit", "education", "startup", "enterprise"],
  trustWeight: 30,
  conversionWeight: 15,
  funnelStage: "awareness",
  styles: ["editorial", "minimal", "modern", "bold", "corporate"],
  goals: ["brand", "trust", "awareness"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Quote", isDefault: true }],
    blocks: [
      {
        kind: "body",
        id: "quote",
        label: "Quote",
        field: {
          key: "quote",
          label: "Quote text",
          type: "textarea",
          canonical: "body",
          aiHint: "Pull quote (1–3 sentences, 20–60 words)",
          maxLength: 300,
          group: "content",
        },
      },
      {
        kind: "note",
        id: "author",
        label: "Author",
        field: { key: "author", label: "Author name", type: "text", canonical: "subheadline", aiHint: "Author name", maxLength: 60, group: "content" },
      },
      {
        kind: "note",
        id: "authorTitle",
        label: "Author title",
        field: { key: "authorTitle", label: "Author title", type: "text", canonical: "body", aiHint: "Author title or role", maxLength: 60, group: "content" },
      },
    ],
  },
  defaultProps: {
    quote: "The best teams don't move faster by working harder. They move faster by removing everything that slows them down.",
    author: "Maya Okafor",
    authorTitle: "Head of Operations",
  },
  Component: ContentQuote,
})
