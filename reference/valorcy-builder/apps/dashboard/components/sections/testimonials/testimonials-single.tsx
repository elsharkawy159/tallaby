"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { itemsOf, writeItem } from "@/components/sections/testimonials/testimonials-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Verdict — split archetype.
 *
 * One featured pull-quote on the start side, set large in the heading font, and
 * the results it produced on the end side behind a hairline. Signature move: the
 * quote is the headline. Two slots: the quote and its attribution, and the
 * metrics column.
 *
 * The attribution keeps its pre-slot shape — an initials disc beside the name
 * and role — by laying the quote slot out as a two-column grid: the quote spans
 * both columns, the disc spans the name and role rows.
 */

type Metric = { value?: string; label?: string }

const write = (instanceId: string, key: string) => (t: string) =>
  useBuilderStore.getState().updateSectionProps(instanceId, { [key]: t })

/** A flat text prop rendered as a `div` with the section's own type scale. */
function textBlock (key: string, className: string, isPreview?: boolean): BlockOverride {
  return function TextBlock ({ instance }) {
    const raw = instance.props[key]
    if (typeof raw !== "string") return null
    return (
      <InlineEditableText
        as="div"
        data-element-id={`${instance.id}::${key}`}
        data-element-type="text"
        className={className}
        value={raw}
        isPreview={isPreview}
        onChange={write(instance.id, key)}
        onCommit={write(instance.id, key)}
      />
    )
  }
}

/** Grid placement for each entry of the quote slot. */
function quoteEntryClass (entry: SlotEntry): string | undefined {
  if (entry.kind === "node") return "col-span-2"
  if (entry.block.id === "quote") return "col-span-2 mb-8"
  if (entry.block.id === "authorInitial") return "row-span-2"
  if (entry.block.id === "authorRole") return "mt-0.5"
  return undefined
}

function TestimonialsSingle ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState
  const hasMetrics = itemsOf<Metric>(instance, "metrics").length > 0

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 lg:gap-16 items-center">
          {/* Quote side */}
          <div>
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="quote"
              className="grid grid-cols-[auto_1fr] items-center gap-x-3"
              entryClassName={quoteEntryClass}
              overrides={{
                quote: textBlock(
                  "quote",
                  "font-heading text-[clamp(1.5rem,1.4vw+1rem,2.25rem)] leading-[1.3] tracking-[-0.018em] text-foreground text-balance",
                  isPreview
                ),
                authorInitial: ({ instance: inst }) => {
                  const raw = inst.props.authorInitial
                  if (typeof raw !== "string") return null
                  return (
                    <div
                      className="size-12 shrink-0 rounded-full bg-muted grid place-items-center text-[15px] font-semibold text-foreground"
                    >
                      <InlineEditableText
                        as="span"
                        data-element-id={`${inst.id}::authorInitial`}
                        data-element-type="text"
                        value={raw}
                        isPreview={isPreview}
                        onChange={write(inst.id, "authorInitial")}
                        onCommit={write(inst.id, "authorInitial")}
                      />
                    </div>
                  )
                },
                authorName: textBlock("authorName", "text-base font-semibold text-foreground", isPreview),
                authorRole: textBlock("authorRole", "text-sm text-muted-foreground", isPreview),
              }}
            />
          </div>

          {/* Metrics side */}
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="metrics"
            className={cn(
              "flex flex-col gap-6",
              hasMetrics && "border-t lg:border-t-0 lg:border-s border-border pt-8 lg:pt-0 lg:ps-14"
            )}
            renderItems={({ instance: inst }) => {
              const metrics = itemsOf<Metric>(inst, "metrics")
              if (metrics.length === 0) return null
              return (
                <div className="flex flex-col gap-6">
                  {metrics.map((m, i) => (
                    <div key={i}>
                      <InlineEditableText
                        as="div"
                        data-element-collection="metrics"
                        data-element-index={String(i)}
                        data-element-item-label-prop="value"
                        className="font-heading text-[40px] font-semibold tracking-[-0.03em] leading-none text-foreground"
                        value={String(m.value ?? "")}
                        isPreview={isPreview}
                        onChange={(t) => store().updateItem(inst.id, "metrics", i, { value: t })}
                        onCommit={(t) => store().updateItem(inst.id, "metrics", i, { value: t })}
                      />
                      <InlineEditableText
                        as="div"
                        data-element-collection="metrics"
                        data-element-index={String(i)}
                        data-element-item-label-prop="label"
                        className="mt-2 text-sm text-muted-foreground leading-snug"
                        value={String(m.label ?? "")}
                        isPreview={isPreview}
                        onChange={writeItem(inst.id, "metrics", i, "label")}
                        onCommit={writeItem(inst.id, "metrics", i, "label")}
                      />
                    </div>
                  ))}
                </div>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const testimonialsSingleSection = defineSection({
  id: "testimonials-single",
  displayName: "Verdict",
  description: "One featured pull-quote with attribution beside a column of result metrics.",
  category: "testimonials",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return testimonialsSingleSection.defaultProps
    return oldProps
  },
  industries: ["photography", "podcast", "saas", "agency", "enterprise", "finance", "startup", "law", "dentist", "real_estate", "travel"],
  trustWeight: 90,
  conversionWeight: 45,
  funnelStage: "consideration",
  styles: ["modern", "editorial", "bold"],
  goals: ["trust", "conversion", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "quote", label: "Quote", isDefault: true },
      { id: "metrics", label: "Result metrics", eject: { direction: "column" } },
    ],
    blocks: [
      {
        kind: "body",
        id: "quote",
        label: "Quote",
        field: {
          key: "quote",
          label: "Quote",
          type: "textarea",
          canonical: "body",
          aiHint: "Pull quote (1–3 sentences, 20–60 words)",
          maxLength: 300,
          group: "content",
        },
      },
      {
        kind: "note",
        id: "authorInitial",
        label: "Author initials",
        field: {
          key: "authorInitial",
          label: "Author initials",
          type: "text",
          canonical: "body",
          aiHint: "Author initial (single letter)",
          maxLength: 2,
          group: "content",
        },
      },
      {
        kind: "note",
        id: "authorName",
        label: "Author name",
        field: {
          key: "authorName",
          label: "Author name",
          type: "text",
          canonical: "subheadline",
          aiHint: "Author full name",
          maxLength: 60,
          group: "content",
        },
      },
      {
        kind: "note",
        id: "authorRole",
        label: "Author role",
        field: {
          key: "authorRole",
          label: "Author role",
          type: "text",
          canonical: "body",
          aiHint: "Author role or title",
          maxLength: 60,
          group: "content",
        },
      },
      {
        kind: "items",
        slot: "metrics",
        key: "metrics",
        canonical: "stats",
        label: "Result metrics",
        pick: ["value", "label"],
        itemFields: [
          {
            key: "value",
            label: "Value",
            type: "text",
            canonical: "body",
            aiHint: "Numeric value or metric (e.g. 99.9% or 10k+)",
            maxLength: 20,
            group: "content",
          },
          { key: "label", label: "Label", type: "text" },
        ],
        minItems: 0,
        maxItems: 5,
        newItem: () => ({ value: "10×", label: "improvement in metric" }),
      },
    ],
  },
  defaultProps: {
    quote: "We rebuilt our entire customer journey in six weeks. Revenue from the site has tripled, and our team finally spends its time on customers instead of tooling.",
    authorName: "Maya Chen",
    authorRole: "VP of Growth · Northwind",
    authorInitial: "MC",
    metrics: [
      { value: "3×", label: "Revenue from the website" },
      { value: "42%", label: "Lift in qualified leads" },
      { value: "6 wks", label: "From kickoff to launch" },
    ],
  },
  Component: TestimonialsSingle,
})
