"use client"

import { Award } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemImage, ItemText } from "@/components/sections/social-proof/social-proof-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type AwardItem = { name?: string; year?: string; imageUrl?: string }

/**
 * Laurels — grid archetype.
 *
 * A short headline over an even grid of award plaques: badge art, award name,
 * year. Plaques without art show a trophy so an unconfigured grid still reads
 * as awards. The headline and the grid are entries of one slot.
 */
function SocialProofAwards ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col gap-10 text-center"
          align="center"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          renderItems={({ instance: inst }) => {
            const awards = (inst.props.awards as AwardItem[] | undefined) ?? []
            if (awards.length === 0) return null
            return (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-border pt-10 sm:grid-cols-3 lg:grid-cols-4">
                {awards.map((award, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 text-center">
                    <ItemImage
                      instance={inst}
                      collection="awards"
                      index={i}
                      srcField="imageUrl"
                      alt={String(award.name ?? "")}
                      className="h-14 w-14 object-contain"
                      isPreview={isPreview}
                      fallback={
                        <div aria-hidden className="flex h-14 w-14 items-center justify-center text-muted-foreground">
                          <Award className="size-9" strokeWidth={1.5} />
                        </div>
                      }
                    />
                    <ItemText
                      instance={inst}
                      collection="awards"
                      index={i}
                      field="name"
                      elementKey={`awardName${i}`}
                      labelProp
                      className="text-center text-sm font-semibold text-foreground"
                      isPreview={isPreview}
                    />
                    <ItemText
                      instance={inst}
                      collection="awards"
                      index={i}
                      field="year"
                      elementKey={`awardYear${i}`}
                      className="text-xs text-muted-foreground"
                      isPreview={isPreview}
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

export const socialProofAwardsSection = defineSection({
  id: "social-proof-awards",
  displayName: "Laurels",
  description: "Short headline over an even grid of award plaques — badge, name and year.",
  category: "social-proof",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic", "creative", "finance"],
  trustWeight: 80,
  conversionWeight: 40,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "corporate", "bold"],
  goals: ["trust", "brand", "awareness"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: {
          headline: {
            key: "headline",
            label: "Headline",
            canonical: "headline",
            aiHint: "Primary section headline (6–10 words, no period)",
            maxLength: 80,
            group: "content",
          },
        },
      },
      {
        kind: "items",
        key: "awards",
        canonical: "items",
        label: "Awards",
        pick: [],
        itemFields: [
          { key: "name", label: "Award name", type: "text" },
          { key: "year", label: "Year", type: "text" },
          { key: "imageUrl", label: "Badge image", type: "image" },
        ],
        itemPlaceholder: "logo",
        minItems: 1,
        maxItems: 8,
        newItem: () => ({ name: "Award Name", year: "2024" }),
      },
    ],
  },
  defaultProps: {
    headline: "Recognised by the people who judge the craft",
    awards: [
      { name: "Product of the Year", year: "2025" },
      { name: "Best Place to Work", year: "2025" },
      { name: "Design Excellence Award", year: "2024" },
      { name: "Top 50 Startups", year: "2024" },
    ],
  },
  Component: SocialProofAwards,
})
