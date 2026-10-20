"use client"

import { Boxes, Check, Palette, Rocket, type LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import {
  SECTION_THUMB_PLACEHOLDER,
  SectionEditableImage,
  useSectionSurface,
} from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  iconField,
  pillEyebrow,
  standardHeader,
  stretchItems,
} from "@/components/sections/features/features-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Boxes, Palette, Rocket }

type Row = {
  eyebrow?: string
  stepLabel?: string
  icon?: string
  titlePrefix?: string
  accentWord?: string
  titleSuffix?: string
  body?: string
  bullets?: { text?: string }[]
  primaryCtaText?: string
  primaryCtaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  imageUrl?: string
  imageAlt?: string
  flip?: boolean
}

function RowImage ({ instanceId, rowIndex, src, alt }: { instanceId: string; rowIndex: number; src?: string; alt?: string }) {
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-card">
        {src ? (
          <SectionEditableImage
            instanceId={instanceId}
            elementKey={`row${rowIndex}Image`}
            src={src}
            alt={alt ?? ""}
            collectionKey="rows"
            collectionIndex={rowIndex}
            itemSrcProp="imageUrl"
            itemAltProp="imageAlt"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
        )}
      </div>
    </div>
  )
}

/** One alternating row — copy (step, title, body, checklist, actions) beside its image. */
function ChecklistRow ({ instance, row, i, isPreview }: { instance: SectionInstance; row: Row; i: number; isPreview?: boolean }) {
  const store = useBuilderStore.getState
  const Icon = ICONS[row.icon ?? ""] ?? Boxes
  const text = (field: keyof Row, as: "span" | "p", elementId: string, className?: string) => (
    <ItemText
      as={as}
      instance={instance}
      collection="rows"
      index={i}
      field={field}
      value={row[field]}
      elementId={elementId}
      isPreview={isPreview}
      className={className}
    />
  )
  const ctaText = (field: "primaryCtaText" | "secondaryCtaText") => (
    <InlineEditableText
      as="span"
      value={String(row[field] ?? "")}
      isPreview={isPreview}
      onChange={(t) => store().updateItem(instance.id, "rows", i, { [field]: t })}
      onCommit={(t) => store().updateItem(instance.id, "rows", i, { [field]: t })}
    />
  )

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div className={cn("order-1", row.flip ? "lg:order-2" : "lg:order-1")}>
        <div className="mb-5 flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <Icon className="size-5 text-foreground" aria-hidden />
          {text("eyebrow", "span", `eyebrow${i}`)}
        </div>

        <h3 className="font-heading text-3xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance md:text-4xl">
          {text("titlePrefix", "span", `titlePrefix${i}`)}
          {row.titlePrefix ? " " : ""}
          {text("accentWord", "span", `accent${i}`)}
          {row.titleSuffix ? " " : ""}
          {text("titleSuffix", "span", `titleSuffix${i}`)}
        </h3>

        {text("body", "p", `body${i}`, "mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg")}

        <ul className="mt-7 space-y-3">
          {(row.bullets ?? []).map((b, bi) => (
            <li key={bi} className="flex items-start gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
              <span className="text-sm leading-relaxed text-foreground/90 md:text-[0.9375rem]">{b.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center gap-3">
          <a
            href={isPreview ? row.primaryCtaHref : undefined}
            data-element-id={`${instance.id}::primaryCta${i}`}
            data-element-type="textLink"
            data-element-collection="rows"
            data-element-index={String(i)}
            data-element-item-href-prop="primaryCtaHref"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ctaText("primaryCtaText")}
          </a>
          <a
            href={isPreview ? row.secondaryCtaHref : undefined}
            data-element-id={`${instance.id}::secondaryCta${i}`}
            data-element-type="textLink"
            data-element-collection="rows"
            data-element-index={String(i)}
            data-element-item-href-prop="secondaryCtaHref"
            className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            {ctaText("secondaryCtaText")}
          </a>
        </div>
      </div>

      <div className={cn("order-2", row.flip ? "lg:order-1" : "lg:order-2")}>
        <RowImage instanceId={instance.id} rowIndex={i} src={row.imageUrl} alt={row.imageAlt} />
      </div>
    </div>
  )
}

/**
 * Narrative — storytelling archetype.
 *
 * Centered header over alternating rows: each row pairs a numbered step (icon,
 * split-accent title, body, checklist, two actions) with an image, flipping
 * sides per row. Row chrome is JSX; the header lines and the rows collection are
 * slot entries.
 */
function FeaturesChecklist ({ instance, isPreview, definition }: SectionComponentProps) {
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
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} mt-5 text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-5`}
          overrides={{ eyebrow: pillEyebrow(isPreview) }}
          renderItems={({ instance: inst }) => {
            const rows = (inst.props.rows as Row[] | undefined) ?? []
            if (rows.length === 0) return null
            return (
              <div className="mt-20 space-y-24 text-start md:space-y-32">
                {rows.map((row, i) => (
                  <ChecklistRow key={i} instance={inst} row={row} i={i} isPreview={isPreview} />
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

const ROW_BULLETS = (a: string, b: string, c: string) => [{ text: a }, { text: b }, { text: c }]

export const featuresChecklistSection = defineSection({
  id: "features-checklist",
  displayName: "Narrative",
  description: "Alternating rows — a numbered step with title, checklist and actions beside an image.",
  category: "features",
  layoutArchetype: "storytelling",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["app_landing", "saas", "startup", "agency", "ecommerce", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["sales", "trust", "education"],
  complexity: 'low',
  density: 'medium',
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["features", "checklist", "benefits"],
  trustWeight: 60,
  funnelStage: 'consideration',
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) {
      return featuresChecklistSection.defaultProps
    }
    return oldProps
  },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader({ accent: true, suffix: true }),
      {
        kind: "items",
        key: "rows",
        canonical: "items",
        label: "Rows",
        pick: [],
        itemFields: [
          { key: "eyebrow", label: "Eyebrow", type: "text", canonical: "eyebrow", aiHint: HINTS.eyebrow, maxLength: 30, group: "content" },
          { ...iconField(ICONS) },
          { key: "titlePrefix", label: "Title prefix", type: "text" },
          { key: "accentWord", label: "Accent word", type: "text", canonical: "headline", aiHint: HINTS.accentWord, maxLength: 30, group: "content" },
          { key: "titleSuffix", label: "Title suffix", type: "text" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
          { key: "primaryCtaText", label: "Primary CTA label", type: "text", canonical: "ctaPrimary", aiHint: "Primary button label (1–4 words, action verb)", maxLength: 30, group: "cta" },
          { key: "primaryCtaHref", label: "Primary CTA link", type: "url", group: "cta" },
          { key: "secondaryCtaText", label: "Secondary CTA label", type: "text", canonical: "ctaSecondary", aiHint: "Secondary button label (1–4 words)", maxLength: 30, group: "cta" },
          { key: "secondaryCtaHref", label: "Secondary CTA link", type: "url", group: "cta" },
          { key: "imageUrl", label: "Image", type: "image" },
          { key: "imageAlt", label: "Image alt text", type: "text", canonical: "imageAlt", aiHint: "Accessible alt text for the image (describe what is shown)", maxLength: 120, group: "media" },
          { key: "flip", label: "Flip layout", type: "switch" },
        ],
        minItems: 1,
        maxItems: 8,
        newItem: () => ({
          eyebrow: "Step",
          stepLabel: "Step",
          icon: "Boxes",
          titlePrefix: "Title",
          accentWord: "accent",
          titleSuffix: "",
          body: "Describe this step.",
          bullets: [{ text: "Benefit" }, { text: "Benefit" }, { text: "Benefit" }],
          primaryCtaText: "Learn more",
          primaryCtaHref: "#",
          secondaryCtaText: "Details",
          secondaryCtaHref: "#",
          imageUrl: "",
          imageAlt: "",
          flip: false,
        }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "How it works",
    headline: "A workflow shaped around",
    accentWord: "your team",
    headlineSuffix: "",
    description: "Three steps from a blank canvas to a live site — and the tools that keep each step short.",
    rows: [
      {
        eyebrow: "Structure",
        stepLabel: "Step 01",
        icon: "Boxes",
        titlePrefix: "Start from a",
        accentWord: "solid",
        titleSuffix: "foundation",
        body: "Pick a layout built for your industry, then add, remove and reorder sections until the page tells your story.",
        bullets: ROW_BULLETS("Industry-specific starting points", "Drag-and-drop sections", "Responsive on every screen"),
        primaryCtaText: "Browse layouts",
        primaryCtaHref: "#",
        secondaryCtaText: "See examples",
        secondaryCtaHref: "#",
        imageUrl: "",
        imageAlt: "Page layout being assembled in the editor",
        flip: false,
      },
      {
        eyebrow: "Design",
        stepLabel: "Step 02",
        icon: "Palette",
        titlePrefix: "Make it",
        accentWord: "unmistakably",
        titleSuffix: "yours",
        body: "Set your colours, fonts and spacing once — every page follows, so your brand stays consistent as you grow.",
        bullets: ROW_BULLETS("Brand colours and fonts", "Shared design tokens", "Light and dark themes"),
        primaryCtaText: "Explore styling",
        primaryCtaHref: "#",
        secondaryCtaText: "Learn more",
        secondaryCtaHref: "#",
        imageUrl: "",
        imageAlt: "Design settings panel with brand colours",
        flip: true,
      },
      {
        eyebrow: "Launch",
        stepLabel: "Step 03",
        icon: "Rocket",
        titlePrefix: "Go",
        accentWord: "live",
        titleSuffix: "in one click",
        body: "Publish to your own domain with SSL included, then track visits and conversions from the same dashboard.",
        bullets: ROW_BULLETS("Custom domains with SSL", "Instant rollbacks", "Built-in analytics"),
        primaryCtaText: "Start publishing",
        primaryCtaHref: "#",
        secondaryCtaText: "View pricing",
        secondaryCtaHref: "#",
        imageUrl: "",
        imageAlt: "Live website on a laptop screen",
        flip: false,
      },
    ],
  },
  Component: FeaturesChecklist,
})
