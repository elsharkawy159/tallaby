"use client"

import { Bed, Bath, Maximize } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { placeholderFor } from "@/components/sections/placeholders"
import {
  FlatLinkAction,
  ItemText,
  TONE,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  flatActionBlocks,
  headingBlock,
  itemsOf,
  kickerEyebrow,
  textOr,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Unit = { type?: string; beds?: string; baths?: string; sqft?: string; priceFrom?: string; available?: string; status?: string }

const statusTone = (s: unknown) => (s === "Available" ? TONE.positive : s === "Limited" ? TONE.caution : TONE.neutral)

/**
 * Blueprint — split archetype.
 *
 * An off-plan development: the pitch, a building photo and an enquiry action on
 * the start side; a unit-availability table (type, size, price, delivery) on
 * the end side.
 */
function ListingsNewDev ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-start"
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-3`}
            overrides={{
              eyebrow: kickerEyebrow(isPreview, "mb-2"),
              imageUrl: ({ block, instance: inst }) => {
                const src = inst.props.imageUrl
                // A cleared photo hid the frame; an unset one showed a photo.
                if (src === "") return null
                return (
                  <SectionMedia
                    instanceId={inst.id}
                    elementKey={block.id}
                    src={typeof src === "string" ? src : undefined}
                    alt={textOr(inst, "imageAlt", textOr(inst, "headline", ""))}
                    ratio="auto"
                    placeholder="landscape"
                    rounded="lg"
                    isPreview={isPreview}
                    className="mt-6 aspect-[4/3] w-full bg-muted"
                  />
                )
              },
              ctaLabel: ({ instance: inst }) => (
                <FlatLinkAction
                  instance={inst}
                  isPreview={isPreview}
                  labelProp="ctaLabel"
                  hrefProp="ctaHref"
                  fallback=""
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90"
                />
              ),
              // Carried by the button above; edited in the inspector.
              ctaHref: () => null,
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="units"
            className="flex flex-col"
            entryClassName="w-full"
            renderItems={({ instance: inst }) => {
              const units = itemsOf<Unit>(inst, "units")
              return (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="hidden grid-cols-[1fr_5rem_5rem_6rem_6rem_6rem] gap-0 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground sm:grid">
                    <span>Type</span><span className="text-center">Beds</span><span className="text-center">Baths</span><span className="text-center">Sqft</span><span>From</span><span>Avail.</span>
                  </div>
                  <div className="divide-y divide-border">
                    {units.map((u, i) => (
                      <div key={i} className="flex flex-col gap-2 p-4 sm:grid sm:grid-cols-[1fr_5rem_5rem_6rem_6rem_6rem] sm:items-center sm:gap-0">
                        <div className="flex items-center gap-2">
                          <ItemText
                            instance={inst}
                            collection="units"
                            index={i}
                            field="type"
                            value={u.type}
                            isPreview={isPreview}
                            className="font-semibold text-foreground"
                          />
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(u.status)}`}>{txt(u.status)}</span>
                        </div>
                        <span className="flex items-center gap-1 text-center text-sm text-muted-foreground sm:justify-center"><Bed className="size-3.5" />{txt(u.beds)}</span>
                        <span className="flex items-center gap-1 text-center text-sm text-muted-foreground sm:justify-center"><Bath className="size-3.5" />{txt(u.baths)}</span>
                        <span className="flex items-center gap-1 text-center text-sm text-muted-foreground sm:justify-center"><Maximize className="size-3.5" />{txt(u.sqft)}</span>
                        <span className="text-sm font-semibold text-primary">{txt(u.priceFrom)}</span>
                        <span className="text-xs text-muted-foreground">{txt(u.available)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const listingsNewDevSection = defineSection({
  id: "listings-new-dev",
  displayName: "Blueprint",
  description: "Off-plan development pitch with a building photo beside a unit-availability table of type, size, price and delivery.",
  category: "listings",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "architecture", "interior_design"],
  styles: ["corporate", "modern", "minimal"],
  goals: ["leads", "sales", "bookings"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  tags: ["listings", "new-development", "off-plan", "real-estate", "units"],
  funnelStage: "consideration",
  conversionWeight: 68,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "units", label: "Units table", accepts: ["items"] },
    ],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Development name and status", maxLength: 70 }),
      descriptionBlock({ aiHint: "2–3 sentence development description", maxLength: 200 }),
      {
        kind: "media",
        ratio: "auto",
        placeholder: "landscape",
        fields: {
          src: { key: "imageUrl", label: "Building photo", type: "image", group: "media" },
          alt: { key: "imageAlt" },
        },
      },
      ...flatActionBlocks({ labelKey: "ctaLabel", hrefKey: "ctaHref", aiHint: "CTA text (2–4 words)", maxLength: 30 }),
      collectionBlock({
        key: "units",
        label: "Unit types",
        canonical: "items",
        slot: "units",
        minItems: 1,
        maxItems: 10,
        newItem: () => ({ type: "1 Bedroom", beds: "1", baths: "1", sqft: "700", priceFrom: "$500,000", available: "Q3 2025", status: "Available" }),
        fields: [
          { key: "type", label: "Unit type", type: "text", canonical: "headline", aiHint: "e.g. Studio, 1 Bedroom, Penthouse", maxLength: 20, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "sqft", label: "Sq ft", type: "text", maxLength: 10, group: "content" },
          { key: "priceFrom", label: "Price from", type: "text", aiHint: "e.g. $650,000", maxLength: 16, group: "content" },
          { key: "available", label: "Availability", type: "text", aiHint: "e.g. Q3 2025", maxLength: 12, group: "content" },
          { key: "status", label: "Status", type: "text", aiHint: "Available, Limited, or Sold out", maxLength: 12, group: "content" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "New development",
    headline: "The Foundry Residences — now selling",
    description: "Ninety-two homes in a converted ironworks, with a rooftop garden, residents' lounge and completion from late 2026.",
    imageUrl: placeholderFor("landscape"),
    ctaLabel: "Register interest",
    ctaHref: "#",
    units: [
      { type: "Studio", beds: "0", baths: "1", sqft: "520", priceFrom: "$389,000", available: "Q3 2026", status: "Available" },
      { type: "1 Bedroom", beds: "1", baths: "1", sqft: "720", priceFrom: "$495,000", available: "Q3 2026", status: "Available" },
      { type: "2 Bedroom", beds: "2", baths: "2", sqft: "1,100", priceFrom: "$689,000", available: "Q4 2026", status: "Limited" },
      { type: "3 Bedroom", beds: "3", baths: "2", sqft: "1,580", priceFrom: "$915,000", available: "Q1 2027", status: "Limited" },
      { type: "Penthouse", beds: "4", baths: "3.5", sqft: "3,200", priceFrom: "$2,150,000", available: "Q1 2027", status: "Sold out" },
    ],
  },
  Component: ListingsNewDev,
})
