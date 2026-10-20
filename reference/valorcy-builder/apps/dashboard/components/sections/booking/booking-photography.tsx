"use client"

import { Camera, Clock, MapPin } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  iconNote,
  kickerEyebrow,
  listOf,
  noteBlock,
  s,
  textOr,
} from "@/components/sections/booking/booking-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type SessionType = { name?: string; duration?: string; price?: string; description?: string; includes?: string }

/**
 * Studio — asymmetric archetype.
 *
 * A tall portrait pinned in a narrow start column while the session packages
 * scroll beside it: each with duration, price, who it suits, the deliverables
 * and a book action. Two slots — the portrait and the copy column.
 */
function BookingPhotography ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:items-start">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            className="sticky top-24"
            overrides={{
              imageUrl: ({ instance: inst }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey="photo-img"
                  src={textOr(inst, "imageUrl", undefined)}
                  alt={textOr(inst, "imageAlt", textOr(inst, "headline", ""))}
                  ratio="portrait"
                  placeholder="portrait"
                  rounded="xl"
                  className="bg-muted"
                  sizes="(max-width: 1024px) 100vw, 340px"
                  isPreview={isPreview}
                />
              ),
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col"
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-2`}
            overrides={{
              eyebrow: kickerEyebrow("mb-1", isPreview),
              location: iconNote("location", MapPin, "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground", "size-3.5 text-primary", isPreview),
            }}
            renderItems={({ instance: inst }) => {
              const sessions = listOf<SessionType>(inst, "sessions")
              const ctaLabel = textOr(inst, "ctaLabel", "Book this package")
              if (sessions.length === 0) return null
              return (
                <div className="mt-7 space-y-4">
                  {sessions.map((ses, i) => {
                    const featured = i === 1
                    return (
                      <div
                        key={i}
                        className={cn(
                          "rounded-2xl border p-5 transition hover:border-primary/40",
                          featured ? "border-primary/50 bg-[color-mix(in_oklch,var(--primary)_4%,var(--card))]" : "border-border/60 bg-card"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <ItemText as="h3" instance={inst} collection="sessions" index={i} field="name" value={ses?.name} className="font-semibold text-foreground" isPreview={isPreview} />
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" aria-hidden />{s(ses?.duration)}</p>
                          </div>
                          <span className="shrink-0 text-xl font-semibold text-primary">{s(ses?.price)}</span>
                        </div>
                        <ItemText as="p" instance={inst} collection="sessions" index={i} field="description" value={ses?.description} className="mt-2 text-sm text-muted-foreground" isPreview={isPreview} />
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground"><Camera className="size-3.5" aria-hidden />{s(ses?.includes)}</p>
                        <button
                          type="button"
                          className={cn("mt-3 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold", featured ? PRIMARY_BUTTON : OUTLINE_BUTTON)}
                        >
                          {ctaLabel}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const bookingPhotographySection = defineSection({
  id: "booking-photography",
  displayName: "Studio",
  description: "Pinned portrait beside photography packages — duration, price, deliverables and a book action each.",
  category: "booking",
  layoutArchetype: "asymmetric",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["photography", "creative", "portfolio", "wedding_planner", "other"],
  styles: ["editorial", "minimal", "modern"],
  goals: ["bookings", "sales", "leads"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["booking", "photography", "session", "packages", "creative"],
  funnelStage: "decision",
  conversionWeight: 78,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "media", label: "Portrait", accepts: ["media"], max: 1, acceptsElements: false },
      { id: "copy", label: "Packages", isDefault: true },
    ],
    blocks: [
      {
        kind: "media",
        slot: "media",
        ratio: "portrait",
        placeholder: "portrait",
        fields: { src: { key: "imageUrl", label: "Portfolio photo", type: "image", group: "media" } },
      },
      eyebrowBlock({ aiHint: "Short label (1–3 words)", maxLength: 24 }),
      headingBlock({ aiHint: "Booking headline (2–5 words)", maxLength: 50 }),
      descriptionBlock({ aiHint: "What's included note (1–2 sentences)", maxLength: 180 }),
      noteBlock({ key: "location", label: "Location note", type: "text", canonical: "body", aiHint: "e.g. London & surrounding areas", maxLength: 60, group: "content" }),
      collectionBlock({
        key: "sessions",
        label: "Packages",
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ name: "Package name", duration: "60 min", price: "$0", description: "Description.", includes: "Files · Edits" }),
        itemFields: [
          { key: "name", label: "Package name", type: "text", canonical: "headline", maxLength: 40, group: "content" },
          { key: "duration", label: "Duration", type: "text", aiHint: "e.g. 90 min", maxLength: 12, group: "content" },
          { key: "price", label: "Price", type: "text", maxLength: 12, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "Who this package suits", maxLength: 120, group: "content" },
          { key: "includes", label: "Includes", type: "text", aiHint: "e.g. 80 edited images · 2 locations", maxLength: 80, group: "content" },
        ],
      }),
    ],
    settings: [
      { key: "ctaLabel", label: "Book button label", type: "text", canonical: "ctaPrimary", aiHint: "e.g. Book this package", maxLength: 24, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "Sessions",
    headline: "Portraits that feel like you",
    description: "Every session includes a planning call, location scouting and a private online gallery.",
    location: "London & surrounding areas",
    ctaLabel: "Book this package",
    sessions: [
      { name: "Mini session", duration: "30 min", price: "$180", description: "Headshots or a quick refresh for your profile.", includes: "15 edited images · 1 location" },
      { name: "Signature session", duration: "90 min", price: "$420", description: "Couples, families or personal branding.", includes: "60 edited images · 2 locations" },
      { name: "Full story", duration: "2 hrs", price: "$650", description: "An unhurried shoot for milestones and big announcements.", includes: "100 edited images · 3 locations" },
    ],
  },
  Component: BookingPhotography,
})
