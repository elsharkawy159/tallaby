"use client"

import { Bed, Bath, Maximize, MapPin } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { placeholderFor } from "@/components/sections/placeholders"
import {
  FlatLinkAction,
  PropText,
  descriptionBlock,
  flatActionBlocks,
  headingBlock,
  noteBlock,
  textOr,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Spotlight — banner archetype.
 *
 * One signature property in a rounded photo banner: badge, title, address,
 * description and a facts line over a dark directional scrim, then the price
 * beside a tour action. The scrim and its white type stay dark/light in both
 * themes because they sit on a photograph.
 */
function ListingsBanner ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="group relative min-h-[520px] overflow-hidden rounded-3xl bg-black text-white">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="background"
            overrides={{
              imageUrl: ({ block, instance: inst }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey={block.id}
                  src={inst.props.imageUrl as string | undefined}
                  alt={textOr(inst, "imageAlt", textOr(inst, "title", ""))}
                  ratio="auto"
                  placeholder="wide"
                  rounded="none"
                  isPreview={isPreview}
                  sizes="100vw"
                  className="absolute inset-0 h-full w-full bg-transparent"
                  imgClassName="h-full w-full object-cover opacity-55 transition-transform duration-700"
                />
              ),
            }}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

          <div className="relative flex h-full flex-col justify-end gap-5 p-10 lg:max-w-xl lg:p-14">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="copy"
              className="flex flex-col items-start gap-5"
              align="left"
              headingClassName={`${TYPE_H2} text-white`}
              bodyClassName="text-sm leading-relaxed text-white/75"
              overrides={{
                badge: ({ instance: inst }) => {
                  const v = inst.props.badge
                  if (typeof v !== "string" || v === "") return null
                  return (
                    <span className="self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <PropText instance={inst} propKey="badge" isPreview={isPreview} />
                    </span>
                  )
                },
                address: ({ instance: inst }) => {
                  if (typeof inst.props.address !== "string") return null
                  return (
                    <p className="flex items-center gap-1.5 text-sm text-white/70">
                      <MapPin className="size-4" />
                      <PropText instance={inst} propKey="address" isPreview={isPreview} />
                    </p>
                  )
                },
                beds: ({ instance: inst }) => (
                  <div className="flex flex-wrap items-center gap-5 text-sm text-white/70">
                    <span className="flex items-center gap-1.5"><Bed className="size-4" />{textOr(inst, "beds", "")} bedrooms</span>
                    <span className="flex items-center gap-1.5"><Bath className="size-4" />{textOr(inst, "baths", "")} baths</span>
                    <span className="flex items-center gap-1.5"><Maximize className="size-4" />{textOr(inst, "sqft", "")} sqft</span>
                  </div>
                ),
              }}
            />

            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="action"
              className="flex flex-wrap items-center gap-5"
              overrides={{
                price: ({ instance: inst }) => (
                  <PropText instance={inst} propKey="price" isPreview={isPreview} className="text-2xl font-semibold text-white" />
                ),
                ctaLabel: ({ instance: inst }) => (
                  <FlatLinkAction
                    instance={inst}
                    isPreview={isPreview}
                    labelProp="ctaLabel"
                    hrefProp="ctaHref"
                    fallback=""
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
                  />
                ),
                // Carried by the button above; edited in the inspector.
                ctaHref: () => null,
              }}
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const listingsBannerSection = defineSection({
  id: "listings-banner",
  displayName: "Spotlight",
  description: "A single signature property in a rounded photo banner — facts, price and a tour action over a scrim.",
  category: "listings",
  layoutArchetype: "banner",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker", "hotel", "interior_design"],
  styles: ["bold", "editorial", "dark"],
  goals: ["leads", "bookings", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["listings", "banner", "hero", "featured", "property"],
  funnelStage: "decision",
  conversionWeight: 75,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "background", label: "Background image", accepts: ["media"], max: 1, acceptsElements: false, eject: { overlay: true } },
      { id: "copy", label: "Copy", isDefault: true },
      { id: "action", label: "Price & action", eject: { direction: "row" } },
    ],
    blocks: [
      {
        kind: "media",
        slot: "background",
        ratio: "wide",
        placeholder: "wide",
        fields: {
          src: { key: "imageUrl", label: "Property photo", type: "image", group: "media" },
          alt: { key: "imageAlt" },
        },
      },
      {
        kind: "badge",
        field: { key: "badge", label: "Badge label", type: "text", canonical: "eyebrow", aiHint: "e.g. Featured listing, New to market", maxLength: 30, group: "content" },
      },
      headingBlock({ key: "title", label: "Property title", aiHint: "Property name (5–10 words)", maxLength: 80 }),
      noteBlock({ key: "address", label: "Address", type: "text", canonical: "body", aiHint: "Full street address", maxLength: 100, group: "content" }),
      descriptionBlock({ aiHint: "Property description (2–3 sentences)", maxLength: 280 }),
      noteBlock({ key: "beds", label: "Bedrooms", type: "text", maxLength: 5, group: "content" }),
      noteBlock({ key: "price", label: "Price", type: "text", aiHint: "e.g. $15,900,000", maxLength: 20, group: "content" }, "action"),
      ...flatActionBlocks({ labelKey: "ctaLabel", hrefKey: "ctaHref", aiHint: "CTA text (3–5 words)", maxLength: 30, slot: "action" }),
    ],
    settings: [
      { key: "baths", label: "Bathrooms", type: "text", maxLength: 5, group: "content" },
      { key: "sqft", label: "Sq ft", type: "text", maxLength: 10, group: "content" },
    ],
  },
  defaultProps: {
    imageUrl: placeholderFor("wide"),
    badge: "Featured listing",
    title: "The Cliffside House at Seacliff Point",
    address: "1 Headland Way, Seacliff",
    price: "$4,950,000",
    beds: "4",
    baths: "4.5",
    sqft: "6,240",
    description: "Floor-to-ceiling glass, a cantilevered terrace and uninterrupted ocean views from every principal room.",
    ctaLabel: "Book a private tour",
    ctaHref: "#",
  },
  Component: ListingsBanner,
})
