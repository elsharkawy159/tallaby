"use client"

import { Zap, Shield, Globe, Star, Layers, Rocket, MousePointer2, type LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionImageSlot } from "@/components/sections/_primitives/section-image-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  iconField,
  iconFor,
  standardHeader,
  stretchItems,
} from "@/components/sections/features/features-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Zap, Shield, Globe, Star, Layers, Rocket, MousePointer2 }

type Tile = {
  variant?: "plain" | "image" | "accent"
  span?: "sm" | "md" | "lg" | "xl"
  icon?: string
  title?: string
  body?: string
  imageUrl?: string
  ctaText?: string
  ctaHref?: string
}

function spanClass (s: Tile["span"]) {
  switch (s) {
    case "xl": return "md:col-span-6 lg:col-span-7 row-span-2"
    case "lg": return "md:col-span-6 lg:col-span-7"
    case "md": return "md:col-span-3 lg:col-span-5"
    default:   return "md:col-span-3 lg:col-span-4"
  }
}

/**
 * Tessera — bento archetype.
 *
 * Start-aligned header over a twelve-column bento of mixed tiles: plain cards,
 * image tiles and one brand-filled accent tile with its own action. Tile spans,
 * variants and the two glow orbs are chrome; the header lines and the tile
 * collection are slot entries.
 */
function FeaturesBento ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })
  const store = useBuilderStore.getState

  return (
    <section className="relative isolate overflow-x-clip border-y border-border bg-muted/30" style={rootStyle}>

      <SectionContainer className="relative">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start gap-5 text-start"
          entryClassName={stretchItems}
          align="left"
          renderItems={({ instance: inst }) => {
            const tiles = (inst.props.tiles as Tile[] | undefined) ?? []
            if (tiles.length === 0) return null
            return (
              <div className="mt-9 grid grid-cols-1 auto-rows-[minmax(180px,auto)] gap-5 md:grid-cols-6 lg:grid-cols-12">
                {tiles.map((t, i) => {
                  const Icon = iconFor(ICONS, t.icon, Zap)
                  const isAccent = t.variant === "accent"
                  const isImage = t.variant === "image"
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative flex flex-col rounded-2xl border p-7 transition-all",
                        spanClass(t.span),
                        isAccent
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-card hover:border-primary/30 hover:shadow-lg"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-10 flex-shrink-0 items-center justify-center rounded-lg",
                          isAccent ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/12 text-primary"
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </div>

                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="tiles"
                        index={i}
                        field="title"
                        value={t.title}
                        elementId={`title${i}`}
                        isPreview={isPreview}
                        className={cn(
                          "mt-4 text-lg font-semibold tracking-tight",
                          isAccent ? "text-primary-foreground" : "text-foreground"
                        )}
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="tiles"
                        index={i}
                        field="body"
                        value={t.body}
                        elementId={`body${i}`}
                        isPreview={isPreview}
                        className={cn(
                          "mt-2 text-sm leading-relaxed",
                          isAccent ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      />

                      {isImage && (
                        <div className="mt-6 min-h-[160px] flex-1">
                          <SectionImageSlot
                            instanceId={inst.id}
                            elementKey={`tileImage${i}`}
                            src={t.imageUrl}
                            alt={t.title ?? ""}
                            collectionKey="tiles"
                            collectionIndex={i}
                            itemSrcProp="imageUrl"
                            itemAltProp="title"
                            aspect="video"
                          />
                        </div>
                      )}

                      {isAccent && t.ctaText && (
                        <div className="mt-5">
                          <a
                            href={isPreview ? t.ctaHref : undefined}
                            data-element-id={`${inst.id}::cta${i}`}
                            data-element-type="textLink"
                            data-element-collection="tiles"
                            data-element-index={String(i)}
                            data-element-item-href-prop="ctaHref"
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary-foreground px-4 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
                          >
                            <InlineEditableText
                              as="span"
                              value={t.ctaText}
                              isPreview={isPreview}
                              onChange={(v) => store().updateItem(inst.id, "tiles", i, { ctaText: v })}
                              onCommit={(v) => store().updateItem(inst.id, "tiles", i, { ctaText: v })}
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const featuresBentoSection = defineSection({
  id: "features-bento",
  displayName: "Tessera",
  description: "Twelve-column bento of mixed tiles — plain, image and a brand-filled accent tile with its own action.",
  category: "features",
  layoutArchetype: "bento",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "creative", "enterprise"],
  trustWeight: 40,
  conversionWeight: 30,
  funnelStage: 'consideration',
  styles: ["modern", "bold"],
  goals: ["education", "awareness", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  recommendedNeighbors: { before: ["hero-centered", "hero-gradient"], after: ["cta-banner", "testimonials-grid"] },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader({ accent: true }),
      {
        kind: "items",
        key: "tiles",
        canonical: "cards",
        label: "Bento tiles",
        pick: [],
        itemFields: [
          { key: "variant", label: "Variant", type: "select", options: [{ value: "plain", label: "Plain" }, { value: "image", label: "Image" }, { value: "accent", label: "Accent" }] },
          { key: "span", label: "Span", type: "select", options: [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "XL (2 rows)" }] },
          iconField(ICONS),
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
          { key: "imageUrl", label: "Image URL", type: "image" },
          { key: "ctaText", label: "CTA label (accent)", type: "text", canonical: "ctaPrimary", aiHint: "CTA button text (1–4 words)", maxLength: 30, group: "cta" },
          { key: "ctaHref", label: "CTA link (accent)", type: "url", group: "cta" },
        ],
        minItems: 2,
        maxItems: 9,
        newItem: () => ({ variant: "plain", span: "sm", icon: "Zap", title: "Tile", body: "Describe this tile." }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "The platform",
    headline: "One canvas for",
    accentWord: "everything",
    description: "Design, content, publishing and analytics on one integrated surface — no tab-switching required.",
    tiles: [
      { variant: "image", span: "xl", icon: "MousePointer2", title: "Visual editing", body: "Click any element on the page and change it in place." },
      { variant: "plain", span: "md", icon: "Zap", title: "Instant previews", body: "See every change on desktop, tablet and mobile as you make it." },
      { variant: "plain", span: "md", icon: "Shield", title: "Safe publishing", body: "Every release is versioned, so rolling back takes one click." },
      { variant: "plain", span: "lg", icon: "Layers", title: "Reusable blocks", body: "Save any section once and drop it into every page that needs it." },
      { variant: "plain", span: "sm", icon: "Globe", title: "Multilingual", body: "Translate pages without duplicating them." },
      { variant: "accent", span: "sm", icon: "Rocket", title: "Ready to launch?", body: "Your first site can be live today.", ctaText: "Start free", ctaHref: "#" },
    ],
  },
  Component: FeaturesBento,
})
