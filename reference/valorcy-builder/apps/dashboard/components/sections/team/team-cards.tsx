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
  TEAM_HEADING_BLOCK,
  TEAM_HEADING_CLASS,
  eyebrowAs,
  membersBlock,
  membersOf,
  stretchItems,
} from "@/components/sections/team/team-parts"

/**
 * Roster — grid archetype.
 *
 * A pill kicker and headline centred over a three-column grid of cards: square
 * photo on top, then name, role and a short bio. The cards are chrome; the
 * kicker, headline and the member collection are slot entries.
 */
function TeamCards ({ instance, isPreview, definition }: SectionComponentProps) {
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
          overrides={{
            eyebrow: eyebrowAs(
              "mb-4 inline-flex items-center rounded-full border border-border bg-primary/10 px-3 py-1 text-xs font-semibold text-primary",
              isPreview
            ),
          }}
          renderItems={({ instance: inst }) => {
            const members = membersOf(inst)
            if (members.length === 0) return null
            return (
              <div className="mt-12 grid grid-cols-1 gap-6 text-start sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m, i) => (
                  <div
                    key={i}
                    className="group flex flex-col"
                  >
                    <MemberPhoto
                      instance={inst}
                      member={m}
                      index={i}
                      isPreview={isPreview}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="flex flex-1 flex-col pt-4">
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="name"
                        value={m.name}
                        isPreview={isPreview}
                        className="text-base font-semibold text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="role"
                        value={m.role}
                        isPreview={isPreview}
                        className="mt-0.5 text-[13px] font-medium text-primary"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="bio"
                        value={m.bio}
                        isPreview={isPreview}
                        className="mt-3 flex-1 text-[13.5px] leading-relaxed text-muted-foreground"
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

export const teamCardsSection = defineSection({
  id: "team-cards",
  displayName: "Roster",
  description: "Centred headline over a three-column grid of cards — photo, name, role and a short bio.",
  category: "team",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps(oldProps, fromVersion) {
    if (fromVersion < 2) return teamCardsSection.defaultProps
    return oldProps
  },
  industries: ["saas", "agency", "startup", "enterprise", "nonprofit", "generic", "dentist", "law", "fitness", "real_estate"],
  trustWeight: 60,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "minimal"],
  goals: ["trust", "brand", "awareness"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
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
        maxItems: 12,
        bio: "textarea",
        newItem: () => ({ imageUrl: "", name: "Full Name", role: "Role", bio: "Short bio." }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Our team",
    headline: "The people building what you rely on",
    members: [
      { imageUrl: "", name: "Amara Okafor", role: "Chief Executive Officer", bio: "Twelve years leading product teams; obsessed with work that ships on time." },
      { imageUrl: "", name: "Daniel Reyes", role: "Head of Engineering", bio: "Built infrastructure that serves millions of requests a day without a pager storm." },
      { imageUrl: "", name: "Hana Takahashi", role: "Design Lead", bio: "Turns complicated workflows into screens people understand on first use." },
      { imageUrl: "", name: "Marcus Bell", role: "Customer Success", bio: "Makes sure every customer gets value in their first week, not their first quarter." },
      { imageUrl: "", name: "Sofia Lindqvist", role: "Head of Marketing", bio: "Tells the product's story plainly, and measures every word of it." },
      { imageUrl: "", name: "Omar Haddad", role: "Operations Manager", bio: "Keeps the company running smoothly so everyone else can focus." },
    ],
  },
  Component: TeamCards,
})
