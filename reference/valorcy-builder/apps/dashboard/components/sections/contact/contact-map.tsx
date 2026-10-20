"use client"

import { MapPin, Mail, Phone, Clock, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PropText,
  descriptionBlock,
  drawnElsewhere,
  headingOverride,
  headlineBlock,
  noteBlock,
  textOr,
  textOverride,
} from "@/components/sections/contact/contact-parts"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** What pages saved before the slot migration rendered while a prop was unset. */
const FALLBACK = {
  headline: "Lorem Ipsum Dolor Sit",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  address: "123 Lorem Street, Ipsum City",
  email: "hello@example.com",
  phone: "(555) 000-0000",
  hours: "Lorem ipsum dolor sit amet.",
  mapLabel: "Lorem ipsum dolor sit amet.",
} as const

/**
 * The map: the stored Google Maps embed when there is one, otherwise a pinned
 * placeholder carrying the editable `mapLabel`. Kept as one entry so the embed
 * is never split from its fallback.
 */
function mapOverride (isPreview?: boolean): BlockOverride {
  return function ContactMapFrame ({ instance }) {
    const mapEmbedUrl = textOr(instance, "mapEmbedUrl", "")
    return (
      <div className="relative mt-10 h-[340px] w-full overflow-hidden rounded-3xl border border-border">
        {mapEmbedUrl ? (
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location map"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_5%,var(--muted))_0%,var(--muted)_100%)]">
            <div aria-hidden className="bg-grid absolute inset-0 opacity-40" />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MapPin className="size-7" />
            </span>
            <PropText
              instance={instance}
              propKey="mapLabel"
              fallback={FALLBACK.mapLabel}
              as="p"
              className="relative text-sm font-medium text-muted-foreground"
              isPreview={isPreview}
            />
          </div>
        )}
      </div>
    )
  }
}

/** One contact-detail tile: icon, a fixed label, and the editable value. */
function detailTile (
  key: keyof typeof FALLBACK,
  label: string,
  Icon: LucideIcon,
  isPreview?: boolean,
  valueClassName = ""
): BlockOverride {
  return function ContactDetailTile ({ instance }) {
    return (
      <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-5">
        <span className="mt-0.5 inline-flex shrink-0 text-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <PropText
            instance={instance}
            propKey={key}
            fallback={FALLBACK[key]}
            as="div"
            className={`mt-0.5 text-sm font-medium text-foreground ${valueClassName}`}
            isPreview={isPreview}
          />
        </div>
      </div>
    )
  }
}

/**
 * Landmark — map archetype.
 *
 * Where to find you, literally: a header, a wide map (a live Google Maps embed,
 * or a pinned placeholder until one is pasted in), and a row of four detail
 * tiles — address, email, phone, hours. The tiles are entries of their own slot,
 * so they reorder among themselves and a fifth can be dropped in.
 */
function ContactMap ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          overrides={{
            headline: headingOverride({
              className: "text-[clamp(1.75rem,2vw+1rem,2.75rem)] font-semibold tracking-tight text-foreground",
              isPreview,
              headline: FALLBACK.headline,
            }),
            description: textOverride("description", FALLBACK.description, "mt-3 text-muted-foreground leading-relaxed", isPreview),
            mapEmbedUrl: mapOverride(isPreview),
            mapLabel: drawnElsewhere,
          }}
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="details"
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          overrides={{
            address: detailTile("address", "Address", MapPin, isPreview, "leading-snug"),
            email: detailTile("email", "Email", Mail, isPreview),
            phone: detailTile("phone", "Phone", Phone, isPreview),
            hours: detailTile("hours", "Hours", Clock, isPreview),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const contactMapSection = defineSection({
  id: "contact-map",
  displayName: "Landmark",
  description: "Header over a wide location map, then four tiles for address, email, phone and hours.",
  category: "contact",
  layoutArchetype: "map",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "restaurant", "dentist", "fitness", "real_estate", "generic"],
  trustWeight: 20,
  conversionWeight: 75,
  funnelStage: "decision",
  styles: ["modern", "minimal"],
  goals: ["leads", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Header & map", isDefault: true },
      { id: "details", label: "Contact details", eject: { direction: "row" } },
    ],
    blocks: [
      headlineBlock(),
      descriptionBlock(),
      noteBlock("mapEmbedUrl", "Google Maps embed URL", {
        placeholder: "https://www.google.com/maps/embed?pb=...",
        aiHint: "Paste the src URL from a Google Maps embed iframe",
        group: "content",
        // Embed URLs run to several hundred characters; the old definition had no cap.
        maxLength: 2000,
      }),
      noteBlock("mapLabel", "Map placeholder label"),
      noteBlock("address", "Address", {}, "details"),
      noteBlock("email", "Email", {}, "details"),
      noteBlock("phone", "Phone", {}, "details"),
      noteBlock("hours", "Hours", {}, "details"),
    ],
  },
  defaultProps: {
    headline: "Come and see us",
    description: "Our studio is a short walk from the central station. Drop in during opening hours or book a time that suits you.",
    address: "221 Market Street, Suite 400, San Francisco, CA",
    email: "hello@yourcompany.com",
    phone: "(555) 014-2290",
    hours: "Mon–Fri, 9am–6pm",
    mapLabel: "Paste a Google Maps embed link to show your location",
    mapEmbedUrl: "",
  },
  Component: ContactMap,
})
