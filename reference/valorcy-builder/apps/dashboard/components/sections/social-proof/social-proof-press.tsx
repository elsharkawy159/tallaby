"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ProofLogoRow, logosBlock, textOverride } from "@/components/sections/social-proof/social-proof-parts"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Spacing each entry has always carried, attached to the entry itself so it
 * travels with the block when the user reorders.
 */
const ENTRY_SPACING: Record<string, string> = {
  logos: "mt-8",
  pullQuote: "mt-10",
  pullQuoteSource: "mt-2",
}

/**
 * Byline — editorial archetype.
 *
 * "As seen in": a row of publication mastheads, then one pull quote set in
 * italics with its source — the press page of a magazine, compressed. The
 * pull quote is still gated by the `showPullQuote` setting it has always had.
 */
function SocialProofPress ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const showPullQuote = instance.props.showPullQuote !== false

  /** Pull-quote blocks render only while the section's switch is on. */
  const gated = (override: BlockOverride): BlockOverride => (ctx) => (showPullQuote ? override(ctx) : null)

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col text-center"
          align="center"
          entryClassName={(entry, index) =>
            entry.kind === "block" ? ENTRY_SPACING[entry.block.id] : index > 0 ? "mt-8" : undefined
          }
          overrides={{
            eyebrow: textOverride({
              key: "eyebrow",
              className: "text-xs font-semibold text-muted-foreground",
              isPreview,
            }),
            pullQuote: gated(
              textOverride({ key: "pullQuote", className: "text-lg font-medium italic text-foreground", isPreview })
            ),
            pullQuoteSource: gated(
              textOverride({ key: "pullQuoteSource", className: "text-sm text-muted-foreground", isPreview })
            ),
          }}
          renderItems={({ instance: inst }) => (
            <ProofLogoRow
              instance={inst}
              isPreview={isPreview}
              className="flex flex-wrap items-center justify-center gap-8"
              itemClassName="flex items-center justify-center grayscale opacity-60 hover:opacity-90 hover:grayscale-0 transition-all"
              imgClassName="h-7 w-auto max-w-[7rem] object-contain"
              barClassName="h-7 w-24"
            />
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const socialProofPressSection = defineSection({
  id: "social-proof-press",
  displayName: "Byline",
  description: "\"As seen in\" publication row with an optional italic pull quote.",
  category: "social-proof",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["photography", "podcast", "app_landing", "saas", "startup", "enterprise", "generic", "creative", "agency", "ecommerce"],
  trustWeight: 85,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["minimal", "modern", "editorial", "corporate"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: {
          key: "eyebrow",
          label: "Eyebrow text",
          canonical: "eyebrow",
          aiHint: "Short label above the headline (1–3 words, sentence case)",
          maxLength: 30,
          group: "content",
        },
      },
      logosBlock({ label: "Publication logos", nameLabel: "Publication name", maxItems: 10, newName: "Publication" }),
      {
        kind: "note",
        id: "pullQuote",
        label: "Pull quote",
        field: { key: "pullQuote", label: "Pull quote", type: "textarea", maxLength: 300 },
      },
      {
        kind: "note",
        id: "pullQuoteSource",
        label: "Pull quote source",
        field: { key: "pullQuoteSource", label: "Pull quote source", type: "text", maxLength: 60 },
      },
    ],
    settings: [{ key: "showPullQuote", label: "Show pull quote", type: "switch", default: true }],
  },
  defaultProps: {
    eyebrow: "As seen in",
    showPullQuote: true,
    pullQuote: "\"The rare tool that makes a small team look like a big one.\"",
    pullQuoteSource: "— The Weekly Ledger",
    logos: [
      { name: "The Weekly Ledger" },
      { name: "Signal Daily" },
      { name: "Northern Review" },
      { name: "Product Journal" },
      { name: "The Builder" },
    ],
  },
  Component: SocialProofPress,
})
