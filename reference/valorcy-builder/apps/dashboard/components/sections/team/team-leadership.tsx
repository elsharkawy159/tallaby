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
 * Principals — editorial archetype.
 *
 * Two or three founders or leaders, each a tall portrait with a large name,
 * a tracked role line and a full bio paragraph beneath. No card chrome — the
 * portraits carry the section. Kicker, headline and leaders are slot entries.
 */
function TeamLeadership ({ instance, isPreview, definition }: SectionComponentProps) {
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
          overrides={{ eyebrow: eyebrowAs(`mb-2 ${TEAM_EYEBROW_CLASS}`, isPreview) }}
          renderItems={({ instance: inst }) => {
            const members = membersOf(inst)
            if (members.length === 0) return null
            return (
              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m, i) => (
                  <div key={i} className="group flex flex-col">
                    <div className="overflow-hidden rounded-2xl">
                      <MemberPhoto
                        instance={inst}
                        member={m}
                        index={i}
                        isPreview={isPreview}
                        ratio="portrait"
                        placeholder="portrait"
                        imgClassName="transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>

                    <div className="mt-5">
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="name"
                        value={m.name}
                        isPreview={isPreview}
                        className="text-xl font-semibold tracking-tight text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="role"
                        value={m.role}
                        isPreview={isPreview}
                        className="mt-1 text-sm font-semibold text-primary"
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

export const teamLeadershipSection = defineSection({
  id: "team-leadership",
  displayName: "Principals",
  description: "Two or three leaders in tall portraits, each with a large name, role line and bio.",
  category: "team",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "finance", "agency", "generic", "law", "real_estate", "dentist"],
  trustWeight: 60,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["editorial", "modern", "corporate"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: true,
  mobileScore: 90,
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
        label: "Leaders",
        maxItems: 6,
        bio: "textarea",
        itemPlaceholder: "portrait",
        newItem: () => ({ imageUrl: "", name: "Full Name", role: "Role", bio: "Bio paragraph." }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Leadership",
    headline: "Led by people who have done this before",
    members: [
      { imageUrl: "", name: "Amara Okafor", role: "Co-founder & CEO", bio: "Amara spent a decade scaling operations at two venture-backed companies before founding the business. She sets direction and still talks to customers every week." },
      { imageUrl: "", name: "Daniel Reyes", role: "Co-founder & CTO", bio: "Daniel leads engineering and security. He previously built payment infrastructure trusted by thousands of merchants across three continents." },
      { imageUrl: "", name: "Hana Takahashi", role: "Chief Operating Officer", bio: "Hana runs finance, people and delivery. She joined from a global consultancy, where she led transformation programmes for Fortune 500 clients." },
    ],
  },
  Component: TeamLeadership,
})
