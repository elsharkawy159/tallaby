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
 * Lineup — dense-grid archetype.
 *
 * A dense four-column wall of square portraits. Names and roles stay out of
 * the way until hover, when a scrim rises from the bottom of the tile. The
 * tiles and scrim are chrome; the kicker, headline and members are slot entries.
 */
function TeamGrid ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          align="center"
          entryClassName={stretchItems}
          headingClassName={TEAM_HEADING_CLASS}
          overrides={{ eyebrow: eyebrowAs(`mb-2 ${TEAM_EYEBROW_CLASS}`, isPreview) }}
          renderItems={({ instance: inst }) => {
            const members = membersOf(inst)
            if (members.length === 0) return null
            return (
              <div className="mt-10 grid grid-cols-2 gap-3 text-start sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                {members.map((m, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-2xl bg-muted">
                    <MemberPhoto instance={inst} member={m} index={i} isPreview={isPreview} />
                    {/* Hover scrim — inverts the theme surface so it reads on any photo. */}
                    <div className="absolute inset-0 flex flex-col items-start justify-end rounded-2xl bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <ItemText
                        instance={inst}
                        index={i}
                        field="name"
                        value={m.name}
                        isPreview={isPreview}
                        className="text-sm font-semibold leading-tight text-white"
                      />
                      <ItemText
                        instance={inst}
                        index={i}
                        field="role"
                        value={m.role}
                        isPreview={isPreview}
                        className="mt-0.5 text-xs text-white/75"
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

export const teamGridSection = defineSection({
  id: "team-grid",
  displayName: "Lineup",
  description: "Dense four-column wall of square portraits; name and role rise in on hover.",
  category: "team",
  layoutArchetype: "dense-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "creative", "startup", "nonprofit", "education", "generic"],
  trustWeight: 60,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "bold", "editorial"],
  goals: ["trust", "brand", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
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
    eyebrow: "The crew",
    headline: "Meet the people behind the work",
    members: [
      { imageUrl: "", name: "Amara Okafor", role: "Founder" },
      { imageUrl: "", name: "Daniel Reyes", role: "Engineering" },
      { imageUrl: "", name: "Hana Takahashi", role: "Design" },
      { imageUrl: "", name: "Marcus Bell", role: "Customer Success" },
      { imageUrl: "", name: "Sofia Lindqvist", role: "Marketing" },
      { imageUrl: "", name: "Omar Haddad", role: "Operations" },
      { imageUrl: "", name: "Priya Nair", role: "Product" },
      { imageUrl: "", name: "Lucas Moreau", role: "Sales" },
    ],
  },
  Component: TeamGrid,
})
