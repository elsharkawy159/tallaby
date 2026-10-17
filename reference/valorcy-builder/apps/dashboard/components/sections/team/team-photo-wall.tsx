"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import type { SectionComponentProps } from "@/components/sections/registry.types"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  MemberPhoto,
  TEAM_EYEBROW_BLOCK,
  TEAM_EYEBROW_CLASS,
  TEAM_HEADING_BLOCK,
  TEAM_HEADING_CLASS,
  eyebrowAs,
  membersBlock,
  membersOf,
  stretchItems,
} from "@/components/sections/team/team-parts"

/**
 * Collage — masonry archetype.
 *
 * A casual, candid wall of photo cards flowing through CSS columns (two, then
 * three, then four), each with a small name and role caption. The columns and
 * cards are chrome; the kicker, headline and members are slot entries.
 */
function TeamPhotoWall ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
          align="left"
          entryClassName={stretchItems}
          headingClassName={TEAM_HEADING_CLASS}
          overrides={{ eyebrow: eyebrowAs(`mb-1 ${TEAM_EYEBROW_CLASS}`, isPreview) }}
          renderItems={({ instance: inst }) => {
            const members = membersOf(inst)
            if (members.length === 0) return null
            return (
              <div className="mt-10 columns-2 gap-3 sm:columns-3 lg:columns-4 lg:gap-4">
                {members.map((m, i) => (
                  <div
                    key={i}
                    className="group mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card lg:mb-4"
                  >
                    <MemberPhoto
                      instance={inst}
                      member={m}
                      index={i}
                      isPreview={isPreview}
                      className="rounded-b-none"
                      imgClassName="transition-transform duration-500"
                    />
                    <div className="p-3">
                      <ItemText
                        instance={inst}
                        index={i}
                        field="name"
                        value={m.name}
                        isPreview={isPreview}
                        className="text-xs font-semibold text-foreground"
                      />
                      <ItemText
                        instance={inst}
                        index={i}
                        field="role"
                        value={m.role}
                        isPreview={isPreview}
                        className="mt-0.5 text-xs text-muted-foreground"
                      />
                    </div>
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

export const teamPhotoWallSection = defineSection({
  id: "team-photo-wall",
  displayName: "Collage",
  description: "Casual masonry wall of photo cards, two to four columns, each with a name and role caption.",
  category: "team",
  layoutArchetype: "masonry",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "creative", "startup", "education", "nonprofit", "generic"],
  trustWeight: 60,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["minimal", "editorial", "playful"],
  goals: ["trust", "brand", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: true,
  mobileScore: 87,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      TEAM_EYEBROW_BLOCK,
      TEAM_HEADING_BLOCK,
      membersBlock({
        label: "Team members",
        maxItems: 24,
        bio: false,
        newItem: () => ({ imageUrl: "", name: "Full Name", role: "Role" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Life at the studio",
    headline: "A small team that likes working together",
    members: [
      { imageUrl: "", name: "Amara Okafor", role: "Founder" },
      { imageUrl: "", name: "Daniel Reyes", role: "Developer" },
      { imageUrl: "", name: "Hana Takahashi", role: "Designer" },
      { imageUrl: "", name: "Marcus Bell", role: "Producer" },
      { imageUrl: "", name: "Sofia Lindqvist", role: "Copywriter" },
      { imageUrl: "", name: "Omar Haddad", role: "Studio Manager" },
      { imageUrl: "", name: "Priya Nair", role: "Illustrator" },
      { imageUrl: "", name: "Lucas Moreau", role: "Strategist" },
    ],
  },
  Component: TeamPhotoWall,
})
