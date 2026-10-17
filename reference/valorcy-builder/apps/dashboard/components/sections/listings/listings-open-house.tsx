"use client"

import { Calendar, Clock, MapPin } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemPhoto,
  ItemText,
  PHOTO,
  collectionBlock,
  eyebrowBlock,
  headingBlock,
  itemsOf,
  kickerEyebrow,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type OpenHouse = { title?: string; address?: string; date?: string; time?: string; price?: string; beds?: string; baths?: string; image?: string; href?: string }

/**
 * Viewing — linked-cards archetype.
 *
 * Open-house cards with the date and time over a dark scrim on the photo, then
 * the property details, closing on an "Add to calendar" link. The scrim stays
 * dark in both themes because it sits on a photograph.
 */
function ListingsOpenHouse ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-start"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          overrides={{ eyebrow: kickerEyebrow(isPreview) }}
          renderItems={({ instance: inst }) => {
            const events = itemsOf<OpenHouse>(inst, "events")
            if (events.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e, i) => (
                  <a
                    key={i}
                    href={e.href || "#"}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <ItemPhoto
                        instance={inst}
                        collection="events"
                        index={i}
                        src={e.image}
                        alt={e.title}
                        elementKey={`img-${i}`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 end-0 start-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <div className="flex items-center gap-2 text-white">
                          <span className="flex items-center gap-1 text-xs font-semibold"><Calendar className="size-3.5" />{txt(e.date)}</span>
                          <span className="text-white/50">·</span>
                          <span className="flex items-center gap-1 text-xs"><Clock className="size-3.5" />{txt(e.time)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="events"
                        index={i}
                        field="title"
                        value={e.title}
                        isPreview={isPreview}
                        className="font-semibold text-foreground"
                      />
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{txt(e.address)}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">{txt(e.beds)} bd · {txt(e.baths)} ba</div>
                        <span className="font-semibold text-primary">{txt(e.price)}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                        Add to calendar
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const listingsOpenHouseSection = defineSection({
  id: "listings-open-house",
  displayName: "Viewing",
  description: "Open-house cards with the date and time over the photo, each closing on an add-to-calendar link.",
  category: "listings",
  layoutArchetype: "linked-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["real_estate", "property_broker"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["bookings", "leads", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  tags: ["listings", "open-house", "schedule", "real-estate"],
  funnelStage: "decision",
  conversionWeight: 72,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Open house headline (3–6 words)", maxLength: 60 }),
      collectionBlock({
        key: "events",
        label: "Open houses",
        canonical: "events",
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ title: "Property name", address: "Address", date: "Sat Jan 4", time: "11 AM – 1 PM", price: "$0", beds: "3", baths: "2", image: "", href: "#" }),
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Property name", maxLength: 60, group: "content" },
          { key: "address", label: "Address", type: "text", canonical: "body", aiHint: "Full address", maxLength: 80, group: "content" },
          { key: "date", label: "Date", type: "text", aiHint: "e.g. Sat Jun 7", maxLength: 20, group: "content" },
          { key: "time", label: "Time", type: "text", aiHint: "e.g. 11:00 AM – 1:00 PM", maxLength: 30, group: "content" },
          { key: "price", label: "Price", type: "text", aiHint: "e.g. $1,200,000", maxLength: 20, group: "content" },
          { key: "beds", label: "Beds", type: "text", maxLength: 4, group: "content" },
          { key: "baths", label: "Baths", type: "text", maxLength: 4, group: "content" },
          { key: "href", label: "Link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Open houses",
    headline: "Come see it in person",
    events: [
      { title: "Family home with a sunny garden", address: "14 Elm Grove, Riverside", date: "Sat Jun 7", time: "11:00 AM – 1:00 PM", price: "$845,000", beds: "3", baths: "2", image: PHOTO, href: "#" },
      { title: "Victorian townhouse, fully restored", address: "8 Linden Row, Old Town", date: "Sun Jun 8", time: "2:00 PM – 4:00 PM", price: "$1,190,000", beds: "5", baths: "4", image: PHOTO, href: "#" },
      { title: "Two-bed apartment by the river", address: "52 Quayside, Unit 5", date: "Sat Jun 7", time: "1:00 PM – 3:00 PM", price: "$540,000", beds: "2", baths: "2", image: PHOTO, href: "#" },
    ],
  },
  Component: ListingsOpenHouse,
})
