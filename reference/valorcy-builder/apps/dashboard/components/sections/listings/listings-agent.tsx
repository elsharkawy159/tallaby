"use client"

import { Phone, Mail, Star, Bed, Bath, MapPin } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import { placeholderFor, resolveMediaSrc } from "@/components/sections/placeholders"
import {
  ItemPhoto,
  ItemText,
  PHOTO,
  PropText,
  collectionBlock,
  descriptionBlock,
  headingBlock,
  itemsOf,
  noteBlock,
  stretchItems,
  textOr,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Listing = { title?: string; address?: string; price?: string; beds?: string; baths?: string; image?: string; href?: string }

/**
 * Broker — asymmetric archetype.
 *
 * A narrow agent card (photo, name, licence, rating, bio, contact) beside the
 * agent's active listings. Card and listings column are separate regions, so
 * each is its own slot.
 */
function ListingsAgent ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-border bg-card p-7 text-center lg:text-start">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="profile"
              className="flex flex-col items-center lg:items-start"
              align="left"
              headingClassName={`${TYPE_H2_SM} text-foreground`}
              bodyClassName={`${TYPE_BODY} mb-5 mt-5`}
              overrides={{
                agentAvatar: ({ instance: inst }) => {
                  const raw = inst.props.agentAvatar
                  const name = textOr(inst, "agentName", "")
                  // A cleared photo always drew the initial; an unset one drew a photo.
                  if (raw === "") {
                    return (
                      <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-muted text-3xl font-semibold text-foreground">
                        {name[0] ?? ""}
                      </div>
                    )
                  }
                  return (
                    <SectionEditableImage
                      instanceId={inst.id}
                      elementKey="avatar"
                      srcProp="agentAvatar"
                      altProp="agentAvatarAlt"
                      src={resolveMediaSrc(typeof raw === "string" ? raw : undefined, "avatar")}
                      alt={textOr(inst, "agentAvatarAlt", name)}
                      className="mb-4 size-24 rounded-full border-4 border-border object-cover"
                    />
                  )
                },
                agentTitle: ({ instance: inst }) => (
                  <PropText instance={inst} propKey="agentTitle" as="p" isPreview={isPreview} className="text-sm text-muted-foreground" />
                ),
                agentRating: ({ instance: inst }) => {
                  const rating = inst.props.agentRating
                  if (typeof rating !== "string") return null
                  return (
                    <div className="mt-2 flex items-center gap-1.5 text-sm">
                      <Star className="size-4 fill-current text-accent" />
                      <PropText instance={inst} propKey="agentRating" isPreview={isPreview} className="font-semibold" />
                      <span className="text-muted-foreground">· {textOr(inst, "agentReviews", "")}</span>
                    </div>
                  )
                },
                // Shown on the rating line above; edited there and in the inspector.
                agentReviews: () => null,
                agentPhone: ({ instance: inst }) => {
                  const phone = inst.props.agentPhone
                  if (typeof phone !== "string") return null
                  return (
                    <a href={`tel:${phone}`} className="flex items-center gap-2 text-sm text-foreground hover:underline">
                      <Phone className="size-4 text-primary" />
                      <PropText instance={inst} propKey="agentPhone" isPreview={isPreview} />
                    </a>
                  )
                },
                agentEmail: ({ instance: inst }) => {
                  if (typeof inst.props.agentEmail !== "string") return null
                  return (
                    <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                      <Mail className="size-4 text-primary" />
                      <PropText instance={inst} propKey="agentEmail" isPreview={isPreview} />
                    </div>
                  )
                },
              }}
            />
          </div>

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="listings"
            className="flex flex-col"
            entryClassName={stretchItems}
            overrides={{
              listingsHeadline: ({ instance: inst }) => (
                <PropText instance={inst} propKey="listingsHeadline" as="h3" isPreview={isPreview} className="mb-5 block text-lg font-semibold text-foreground" />
              ),
            }}
            renderItems={({ instance: inst }) => {
              const listings = itemsOf<Listing>(inst, "listings")
              if (listings.length === 0) return null
              return (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((l, i) => (
                    <a
                      key={i}
                      href={l.href || "#"}
                      className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        <ItemPhoto
                          instance={inst}
                          collection="listings"
                          index={i}
                          src={l.image}
                          alt={l.title}
                          elementKey={`lst-${i}`}
                          className="absolute inset-0 size-full object-cover transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <ItemText
                          as="h4"
                          instance={inst}
                          collection="listings"
                          index={i}
                          field="title"
                          value={l.title}
                          isPreview={isPreview}
                          className="text-sm font-semibold leading-snug text-foreground"
                        />
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{txt(l.address)}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Bed className="size-3" />{txt(l.beds)}</span>
                            <span className="flex items-center gap-1"><Bath className="size-3" />{txt(l.baths)}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">{txt(l.price)}</span>
                        </div>
                      </div>
                    </a>
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

export const listingsAgentSection = defineSection({
  id: "listings-agent",
  displayName: "Broker",
  description: "Agent card with photo, rating, bio and contact beside a grid of the agent's active properties.",
  category: "listings",
  layoutArchetype: "asymmetric",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "trust", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 87,
  editable: true,
  tags: ["listings", "agent", "profile", "real-estate", "contact"],
  trustWeight: 72,
  funnelStage: "decision",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "profile", label: "Agent card", isDefault: true },
      { id: "listings", label: "Listings" },
    ],
    blocks: [
      {
        kind: "media",
        id: "agentAvatar",
        label: "Agent photo",
        ratio: "square",
        placeholder: "avatar",
        fields: {
          src: { key: "agentAvatar", label: "Agent photo", type: "image", group: "media" },
          alt: { key: "agentAvatarAlt", label: "Agent photo alt", group: "media" },
        },
      },
      headingBlock({ key: "agentName", label: "Agent name", aiHint: "Full name", maxLength: 50 }),
      noteBlock({ key: "agentTitle", label: "Title / licence", type: "text", canonical: "subheadline", aiHint: "Job title", maxLength: 60, group: "content" }),
      noteBlock({ key: "agentRating", label: "Rating", type: "text", maxLength: 6, group: "content" }),
      noteBlock({ key: "agentReviews", label: "Reviews", type: "text", maxLength: 20, group: "content" }),
      descriptionBlock({ key: "agentBio", label: "Bio", aiHint: "2–3 sentence agent bio", maxLength: 280 }),
      noteBlock({ key: "agentPhone", label: "Phone", type: "text", maxLength: 20, group: "cta" }),
      noteBlock({ key: "agentEmail", label: "Email", type: "text", maxLength: 60, group: "cta" }),
      noteBlock(
        { key: "listingsHeadline", label: "Listings label", type: "text", canonical: "eyebrow", aiHint: "Short label above the listings", maxLength: 30, group: "content" },
        "listings"
      ),
      collectionBlock({
        key: "listings",
        label: "Properties",
        slot: "listings",
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ title: "Property", address: "Address", price: "$0", beds: "3", baths: "2", image: "", href: "#" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", maxLength: 60, group: "content" },
          { key: "price", label: "Price", type: "text", maxLength: 20, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    agentAvatar: placeholderFor("avatar"),
    agentName: "Sarah Mitchell",
    agentTitle: "Senior Agent · Licence #0192837",
    agentBio: "Fifteen years helping families buy and sell across the city. Sarah pairs deep neighbourhood knowledge with sharp negotiation, so her clients move with confidence.",
    agentPhone: "(555) 014-2290",
    agentEmail: "sarah@example.com",
    agentRating: "4.98",
    agentReviews: "120 reviews",
    listingsHeadline: "Active listings",
    listings: [
      { title: "Sunlit family home", address: "14 Elm Grove, Riverside", price: "$845,000", beds: "3", baths: "2", image: PHOTO, href: "#" },
      { title: "Restored Victorian", address: "8 Linden Row, Old Town", price: "$1,190,000", beds: "5", baths: "4", image: PHOTO, href: "#" },
      { title: "Two-bed by the river", address: "52 Quayside, Unit 5", price: "$540,000", beds: "2", baths: "2", image: PHOTO, href: "#" },
    ],
  },
  Component: ListingsAgent,
})
