"use client"

import { Star } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  LogoMark,
  labelBlock,
  labelOverride,
  logosBlock,
  readLogos,
  sampleLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type Rating = { platform?: string; score?: string }

function RatingsBar ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const raw = instance.props.ratings
  const ratings = Array.isArray(raw) ? (raw as Rating[]) : []
  if (ratings.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-border pt-8">
      {ratings.map((r, i) => (
        <div
          key={i}
          data-element-collection="ratings"
          data-element-index={String(i)}
          data-element-item-label-prop="platform"
          className="flex items-center gap-2"
        >
          <span className="flex gap-0.5 text-accent">
            {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="size-3.5 fill-current" aria-hidden />)}
          </span>
          <ItemText
            instance={instance}
            collection="ratings"
            index={i}
            field="score"
            value={r.score}
            className="text-sm font-semibold text-foreground"
            isPreview={isPreview}
          />
          <span className="text-sm text-muted-foreground">
            on{" "}
            <ItemText
              instance={instance}
              collection="ratings"
              index={i}
              field="platform"
              value={r.platform}
              isPreview={isPreview}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Verdict — tiered archetype.
 *
 * Two tiers on one rule: who uses it (logos), then what they think of it (an
 * aggregate review bar with stars, scores and platforms).
 */
function LogoCloudRating ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-8"
          align="center"
          overrides={{
            eyebrow: labelOverride(
              "text-center text-xs font-semibold text-muted-foreground",
              isPreview
            ),
          }}
          renderItems={({ instance: inst, block }) => {
            if (block.collectionKey === "ratings") {
              return <RatingsBar instance={inst} isPreview={isPreview} />
            }
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="flex items-center justify-center grayscale opacity-65 transition hover:opacity-100 hover:grayscale-0"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-7 w-auto max-w-[6rem] object-contain"
                      nameClassName="text-[13px] font-semibold text-foreground/75"
                    />
                  </div>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudRatingSection = defineSection({
  id: "logo-cloud-rating",
  displayName: "Verdict",
  description: "A logo row over a review bar of stars, scores and platforms like G2 and Capterra.",
  category: "logo-cloud",
  layoutArchetype: "tiered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "ecommerce", "enterprise", "agency", "generic"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["trust", "conversion", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["logos", "trust", "ratings", "reviews"],
  trustWeight: 85,
  funnelStage: "decision",
  defaultStyle: SECTION_PADDING_MEDIUM,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow",
        aiHint: "Short label above the logos (3–6 words)",
        maxLength: 40,
      }),
      logosBlock({ minItems: 2, maxItems: 10 }),
      {
        kind: "items",
        key: "ratings",
        canonical: "items",
        label: "Ratings",
        pick: [],
        itemFields: [
          { key: "platform", label: "Platform", type: "text" },
          { key: "score", label: "Score", type: "text" },
        ],
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ platform: "G2", score: "4.9/5" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Loved by teams everywhere",
    logos: sampleLogos(5),
    ratings: [
      { platform: "G2", score: "4.9/5" },
      { platform: "Capterra", score: "4.8/5" },
      { platform: "Product Hunt", score: "4.9/5" },
    ],
  },
  Component: LogoCloudRating,
})
