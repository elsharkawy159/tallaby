"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { PropText } from "@/components/sections/stats/stats-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Monolith — statement archetype.
 *
 * One enormous figure, centred, with a label and a line of context under it. A
 * single claim given the whole width of the page.
 *
 * The figure and its unit are two stored props (`value`, `unit`) drawn on one
 * baseline, so the unit block renders inside the value's override and its own
 * entry renders nothing — the same pairing as a flat label + link action.
 */
function StatsBigNumber ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          align="center"
          overrides={{
            value: ({ instance: inst }) => {
              const unit = inst.props.unit
              return (
                <div className="mt-4 mb-6 flex items-end justify-center gap-2">
                  <PropText
                    as="span"
                    instance={inst}
                    propKey="value"
                    isPreview={isPreview}
                    className="font-heading text-[clamp(6rem,16vw,12rem)] font-semibold tracking-[-0.055em] leading-[0.85] tabular-nums"
                  />
                  {typeof unit === "string" && unit ? (
                    <PropText
                      as="span"
                      instance={inst}
                      propKey="unit"
                      isPreview={isPreview}
                      className="font-heading text-[clamp(2rem,5vw,4rem)] font-semibold text-muted-foreground pb-3"
                    />
                  ) : null}
                </div>
              )
            },
            // Drawn beside the value above; edited inline there or in the inspector.
            unit: () => null,
            label: ({ instance: inst }) => (
              <PropText
                instance={inst}
                propKey="label"
                isPreview={isPreview}
                className="text-[clamp(1.1rem,2.5vw,1.5rem)] font-semibold text-foreground mb-3"
              />
            ),
            sublabel: ({ instance: inst }) => (
              <PropText
                instance={inst}
                propKey="sublabel"
                isPreview={isPreview}
                className="text-[15px] text-muted-foreground leading-[1.6]"
              />
            ),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const statsBigNumberSection = defineSection({
  id: "stats-big-number",
  displayName: "Monolith",
  description: "One enormous centred figure with a label and a line of context — a single dramatic claim.",
  category: "stats",
  layoutArchetype: "statement",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "creative", "nonprofit", "generic", "agency"],
  trustWeight: 70,
  conversionWeight: 35,
  funnelStage: 'consideration',
  styles: ["bold", "minimal", "editorial"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "eyebrow",
        field: { key: "eyebrow", aiHint: "Short label above the headline (1–3 words, sentence case)", maxLength: 30 },
      },
      {
        kind: "note",
        id: "value",
        label: "Value",
        field: {
          key: "value",
          label: "Value",
          canonical: "body",
          aiHint: "Numeric value or metric (e.g. 99.9% or 10k+)",
          maxLength: 20,
        },
      },
      {
        kind: "note",
        id: "unit",
        label: "Unit",
        field: {
          key: "unit",
          label: "Unit (optional)",
          canonical: "eyebrow",
          aiHint: "Unit or suffix (e.g. %, users, ms)",
          maxLength: 15,
        },
      },
      { kind: "note", id: "label", label: "Label", field: { key: "label", label: "Label" } },
      { kind: "note", id: "sublabel", label: "Sub-label", field: { key: "sublabel", label: "Sub-label" } },
    ],
  },
  defaultProps: {
    eyebrow: "Since we launched",
    value: "2.4M",
    unit: "",
    label: "Websites published by our customers",
    sublabel: "From solo founders to global teams — and growing every single day.",
  },
  Component: StatsBigNumber,
})
