"use client"

import { Star } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemImage, ItemText, PropSpan, isBlockHidden, propText } from "@/components/sections/social-proof/social-proof-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Review = { author?: string; rating?: number | string; date?: string; text?: string; source?: string; avatarUrl?: string }

/** Spacing each entry has always carried, on top of the header's gap. */
const ENTRY_CLASS: Record<string, string> = {
  overallRating: "mt-1",
  reviews: "mt-5 w-full text-start",
}

/**
 * Chorus — wall archetype.
 *
 * A centred header and an aggregate score over a dense wall of review cards,
 * each with its stars, platform source, quote and reviewer. The score and the
 * review total read as one unit, so the total is drawn by the score's block
 * (hiding the total block still drops it).
 */
function SocialProofReviews ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          align="center"
          entryClassName={(entry) => (entry.kind === "block" ? ENTRY_CLASS[entry.block.id] : undefined)}
          overrides={{
            overallRating: ({ instance: inst }) => {
              if (!propText(inst, "overallRating")) return null
              const showTotal = Boolean(propText(inst, "totalReviews")) && !isBlockHidden(inst, "copy", "totalReviews")
              return (
                <div className="flex items-center justify-center gap-3">
                  <PropSpan instance={inst} propKey="overallRating" isPreview={isPreview} className="text-4xl font-semibold text-foreground" />
                  <div className="text-start">
                    <div className="flex gap-0.5" aria-hidden>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="size-5 fill-primary text-primary" />
                      ))}
                    </div>
                    {showTotal && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <PropSpan instance={inst} propKey="totalReviews" isPreview={isPreview} /> reviews
                      </p>
                    )}
                  </div>
                </div>
              )
            },
            // Drawn inside the score above.
            totalReviews: () => null,
          }}
          renderItems={({ instance: inst }) => {
            const reviews = (inst.props.reviews as Review[] | undefined) ?? []
            if (reviews.length === 0) return null
            return (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((r, i) => {
                  const stars = Number(r.rating ?? 5)
                  const text = (field: string, className: string, labelProp = false) => (
                    <ItemText
                      instance={inst}
                      collection="reviews"
                      index={i}
                      field={field}
                      as="span"
                      labelProp={labelProp}
                      className={className}
                      isPreview={isPreview}
                    />
                  )
                  return (
                    <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5" aria-label={`${stars} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`size-4 ${s <= stars ? "fill-primary text-primary" : "text-muted"}`} />
                          ))}
                        </div>
                        {r.source && (
                          text("source", "rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground")
                        )}
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-foreground">
                        &quot;{text("text", "")}&quot;
                      </p>
                      <div className="flex items-center gap-2.5 border-t border-border pt-3">
                        <ItemImage
                          instance={inst}
                          collection="reviews"
                          index={i}
                          srcField="avatarUrl"
                          alt={String(r.author ?? "")}
                          className="size-8 rounded-full object-cover"
                          isPreview={isPreview}
                          fallback={
                            <div
                              className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
                            >
                              {r.author?.[0] ?? "?"}
                            </div>
                          }
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{text("author", "", true)}</p>
                          {r.date && <p className="text-xs text-muted-foreground">{text("date", "")}</p>}
                        </div>
                      </div>
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

export const socialProofReviewsSection = defineSection({
  id: "social-proof-reviews",
  displayName: "Chorus",
  description: "Centred header and aggregate score over a wall of star-rated review cards.",
  category: "social-proof",
  layoutArchetype: "wall",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["restaurant", "hotel", "dentist", "fitness", "other"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "conversion", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 75,
  trustWeight: 90,
  tags: ["reviews", "testimonials", "stars", "ratings", "social-proof"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", label: "Eyebrow", canonical: "eyebrow", maxLength: 30, group: "content" } },
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: { headline: { key: "headline", label: "Headline", canonical: "headline", maxLength: 70, group: "content" } },
      },
      { kind: "body", field: { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 160, group: "content" } },
      {
        kind: "note",
        id: "overallRating",
        label: "Overall rating",
        field: { key: "overallRating", label: "Overall rating", type: "text", aiHint: "e.g. 4.9", maxLength: 5, group: "content" },
      },
      {
        kind: "note",
        id: "totalReviews",
        label: "Total reviews",
        field: { key: "totalReviews", label: "Total reviews", type: "text", aiHint: "e.g. 2,400+", maxLength: 20, group: "content" },
      },
      {
        kind: "items",
        key: "reviews",
        canonical: "testimonials",
        label: "Reviews",
        pick: [],
        itemFields: [
          { key: "author", label: "Author name", type: "text", canonical: "headline", maxLength: 50 },
          { key: "rating", label: "Rating (1-5)", type: "text", aiHint: "Number 1 to 5", maxLength: 1 },
          { key: "text", label: "Review text", type: "textarea", canonical: "body", maxLength: 300 },
          { key: "source", label: "Source (Google, Yelp…)", type: "text", aiHint: "Review platform", maxLength: 30 },
          { key: "date", label: "Date", type: "text", aiHint: "e.g. March 2024", maxLength: 30 },
          { key: "avatarUrl", label: "Avatar photo", type: "image", canonical: "image" },
        ],
        itemPlaceholder: "avatar",
        minItems: 1,
        maxItems: 12,
        newItem: () => ({ author: "Reviewer Name", rating: 5, date: "Month Year", text: "Review text.", source: "Google", avatarUrl: "" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Reviews",
    headline: "Loved by the people we serve",
    description: "",
    overallRating: "4.9",
    totalReviews: "1,200+",
    reviews: [
      { author: "Hannah W.", rating: 5, date: "March 2025", text: "Booking took two minutes and the team remembered every detail of our last visit.", source: "Google", avatarUrl: "" },
      { author: "Luis P.", rating: 5, date: "February 2025", text: "Friendly, punctual and genuinely careful. We won't go anywhere else now.", source: "Yelp", avatarUrl: "" },
      { author: "Grace O.", rating: 5, date: "February 2025", text: "Clear prices, no surprises, and they followed up the next day to check in.", source: "Google", avatarUrl: "" },
      { author: "Tom B.", rating: 4, date: "January 2025", text: "Busy on weekends, but worth the wait. Great results every time.", source: "Tripadvisor", avatarUrl: "" },
      { author: "Amira H.", rating: 5, date: "January 2025", text: "They made a stressful week feel easy. Thoughtful service from start to finish.", source: "Google", avatarUrl: "" },
      { author: "Ken J.", rating: 5, date: "December 2024", text: "Everything was ready when we arrived. Small touches that make a big difference.", source: "Facebook", avatarUrl: "" },
    ],
  },
  Component: SocialProofReviews,
})
