"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD, SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PropSpan,
  ProofLogoRow,
  StarGlyphs,
  isBlockHidden,
  logosBlock,
  propText,
  textOverride,
} from "@/components/sections/social-proof/social-proof-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Ensemble — stacked archetype.
 *
 * Three kinds of proof stacked in one narrow column: a star score, a strip of
 * small logos, and one featured quote in a card. The score and the review count
 * read as one sentence ("4.9 — 2,400 reviews"), so the count is drawn by the
 * score's block and edited in place there; hiding the count block still drops
 * it from the line. The quote card is its own slot — its surface is chrome.
 */
function SocialProofMixed ({ instance, isPreview, definition }: SectionComponentProps) {
  const { ds } = useSectionSurface({ instanceId: instance.id })

  return (
    // Padding is applied directly rather than through the section surface, as it
    // always has been — saved pages keep their exact spacing.
    <section className="bg-background" style={SECTION_PADDING_STANDARD}>
      <SectionContainer className="flex flex-col items-center gap-8 text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="proof"
          className="flex flex-col items-center gap-8"
          align="center"
          overrides={{
            rating: ({ instance: inst }) => {
              const showCount = !isBlockHidden(inst, "proof", "reviewCount") && propText(inst, "reviewCount") !== undefined
              if (propText(inst, "rating") === undefined && !showCount) return null
              return (
                <div className="flex flex-col items-center gap-1">
                  <StarGlyphs className="text-xl" style={{ color: ds?.colors?.primary }} />
                  <p className="text-sm text-muted-foreground">
                    <PropSpan instance={inst} propKey="rating" isPreview={isPreview} className="font-semibold text-foreground" />
                    {showCount && (
                      <>
                        {" — "}
                        <PropSpan instance={inst} propKey="reviewCount" isPreview={isPreview} />
                      </>
                    )}
                  </p>
                </div>
              )
            },
            // Drawn inside the score line above.
            reviewCount: () => null,
          }}
          renderItems={({ instance: inst }) => (
            <ProofLogoRow
              instance={inst}
              isPreview={isPreview}
              className="flex flex-wrap items-center justify-center gap-6"
              itemClassName="grayscale opacity-50 hover:opacity-80 hover:grayscale-0 transition-all"
              imgClassName="h-6 w-auto max-w-[5rem] object-contain"
              barClassName="h-6 w-20"
            />
          )}
        />

        <div className="rounded-xl border border-border bg-card p-6">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="quote"
            className="flex flex-col gap-3"
            align="center"
            overrides={{
              quote: textOverride({ key: "quote", className: "text-base italic text-foreground", isPreview }),
              quoteAuthor: textOverride({ key: "quoteAuthor", className: "text-sm text-muted-foreground", isPreview }),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const socialProofMixedSection = defineSection({
  id: "social-proof-mixed",
  displayName: "Ensemble",
  description: "Star score, a strip of logos and one featured quote, stacked in a single column.",
  category: "social-proof",
  layoutArchetype: "stacked",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "generic", "ecommerce", "agency"],
  trustWeight: 85,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "conversion", "leads", "sales"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "proof", label: "Proof", isDefault: true },
      { id: "quote", label: "Quote card" },
    ],
    blocks: [
      {
        kind: "note",
        id: "rating",
        label: "Rating",
        field: { key: "rating", label: "Rating", type: "text", canonical: "body", aiHint: "Rating value (e.g. 4.9)", maxLength: 5, group: "content" },
      },
      {
        kind: "note",
        id: "reviewCount",
        label: "Review count",
        field: { key: "reviewCount", label: "Review count label", type: "text", canonical: "body", aiHint: "Review count (e.g. 2,400 reviews)", maxLength: 30, group: "content" },
      },
      logosBlock({ maxItems: 10, newName: "Company" }),
      {
        kind: "note",
        id: "quote",
        label: "Featured quote",
        slot: "quote",
        field: { key: "quote", label: "Featured quote", type: "textarea", canonical: "body", aiHint: "Pull quote (1–3 sentences, 20–60 words)", maxLength: 300, group: "content" },
      },
      {
        kind: "note",
        id: "quoteAuthor",
        label: "Quote author",
        slot: "quote",
        field: { key: "quoteAuthor", label: "Quote author", type: "text", maxLength: 80 },
      },
    ],
  },
  defaultProps: {
    rating: "4.9",
    reviewCount: "2,400+ reviews",
    quote: "\"We replaced three tools in our first week and haven't looked back.\"",
    quoteAuthor: "Maya Okafor, Head of Operations at Brightline",
    logos: [
      { name: "Northwind" },
      { name: "Lumen Labs" },
      { name: "Halcyon" },
      { name: "Brightline" },
      { name: "Fieldstone" },
    ],
  },
  Component: SocialProofMixed,
})
