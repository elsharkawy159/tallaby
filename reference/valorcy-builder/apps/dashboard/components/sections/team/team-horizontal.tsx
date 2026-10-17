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
 * Profiles — list archetype.
 *
 * One wide card per person, stacked down the page: photo on the start side
 * (a quarter of the width on desktop), name, role and bio beside it. Stacks to
 * photo-over-copy on mobile. The cards are chrome; the kicker, headline and
 * members are slot entries.
 */
function TeamHorizontal ({ instance, isPreview, definition }: SectionComponentProps) {
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
              <div className="mt-12 flex flex-col gap-6">
                {members.map((m, i) => (
                  <div
                    key={i}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/20 sm:flex-row"
                  >
                    {/* Photo — a quarter of the width on desktop */}
                    <div className="w-full shrink-0 sm:w-1/4">
                      <MemberPhoto
                        instance={inst}
                        member={m}
                        index={i}
                        isPreview={isPreview}
                        className="h-48 rounded-b-none sm:h-full sm:rounded-e-none sm:rounded-es-2xl"
                        sizes="(max-width: 640px) 100vw, 25vw"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-center p-6">
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="name"
                        value={m.name}
                        isPreview={isPreview}
                        className="text-lg font-semibold tracking-tight text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="role"
                        value={m.role}
                        isPreview={isPreview}
                        className="mt-1 text-sm font-medium text-primary"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="bio"
                        value={m.bio}
                        isPreview={isPreview}
                        className="mt-3 text-sm leading-relaxed text-muted-foreground"
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

export const teamHorizontalSection = defineSection({
  id: "team-horizontal",
  displayName: "Profiles",
  description: "Wide profile cards stacked down the page — photo beside name, role and bio.",
  category: "team",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps(oldProps, fromVersion) {
    if (fromVersion < 2) return teamHorizontalSection.defaultProps
    return oldProps
  },
  industries: ["agency", "startup", "enterprise", "nonprofit", "education", "generic"],
  trustWeight: 60,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["modern", "minimal", "editorial"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
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
        maxItems: 12,
        bio: "textarea",
        newItem: () => ({ imageUrl: "", name: "Full Name", role: "Role", bio: "Short bio." }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Who we are",
    headline: "Experienced people, accountable for your results",
    members: [
      { imageUrl: "", name: "Amara Okafor", role: "Managing Partner", bio: "Fifteen years advising growing companies on strategy and operations. Amara leads every new engagement personally for its first ninety days." },
      { imageUrl: "", name: "Daniel Reyes", role: "Technical Director", bio: "Daniel has shipped platforms for fintech and healthcare clients, and runs the delivery practice with a bias for small, frequent releases." },
      { imageUrl: "", name: "Hana Takahashi", role: "Creative Director", bio: "Hana shapes brand and product design across every account, keeping the work consistent from the first sketch to launch." },
      { imageUrl: "", name: "Marcus Bell", role: "Client Services Lead", bio: "Marcus is the first call for every client — he keeps projects on schedule and makes sure nothing falls between teams." },
    ],
  },
  Component: TeamHorizontal,
})
