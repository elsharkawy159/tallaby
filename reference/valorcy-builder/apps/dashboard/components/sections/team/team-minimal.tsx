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

/** Up to two initials from a name — shown when a member has no photo. */
function initialsOf (name: unknown): string {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

/**
 * Directory — minimal archetype.
 *
 * Compact rows divided by hairlines: a small round avatar (initials when there
 * is no photo), name and role, and an optional one-line bio on wide screens.
 * The rows are chrome; the kicker, headline and members are slot entries.
 */
function TeamMinimal ({ instance, isPreview, definition }: SectionComponentProps) {
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
              <div className="mt-10 divide-y divide-border">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 py-4">
                    <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      {m.imageUrl ? (
                        <MemberPhoto
                          instance={inst}
                          member={m}
                          index={i}
                          isPreview={isPreview}
                          rounded="full"
                          className="size-full"
                          sizes="40px"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-sm font-semibold text-muted-foreground">
                          {initialsOf(m.name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <ItemText
                        instance={inst}
                        index={i}
                        field="name"
                        value={m.name}
                        isPreview={isPreview}
                        className="text-sm font-semibold text-foreground"
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

                    {m.bio ? (
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="bio"
                        value={m.bio}
                        isPreview={isPreview}
                        className="hidden max-w-sm text-xs leading-relaxed text-muted-foreground md:block"
                      />
                    ) : null}
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

export const teamMinimalSection = defineSection({
  id: "team-minimal",
  displayName: "Directory",
  description: "Compact hairline-divided rows — small avatar or initials, name, role and an optional bio.",
  category: "team",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps(oldProps, fromVersion) {
    if (fromVersion < 2) return teamMinimalSection.defaultProps
    return oldProps
  },
  industries: ["saas", "startup", "agency", "enterprise", "finance", "generic"],
  trustWeight: 60,
  conversionWeight: 25,
  funnelStage: "consideration",
  styles: ["minimal", "modern"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
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
        bio: "optional",
        photoLabel: "Avatar",
        newItem: () => ({ imageUrl: "", name: "Full Name", role: "Role", bio: "" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Our people",
    headline: "Who you will work with",
    members: [
      { imageUrl: "", name: "Amara Okafor", role: "Chief Executive Officer", bio: "Sets direction and owns every client relationship." },
      { imageUrl: "", name: "Daniel Reyes", role: "Head of Engineering", bio: "Leads the platform and security teams." },
      { imageUrl: "", name: "Hana Takahashi", role: "Design Lead", bio: "Owns product and brand design." },
      { imageUrl: "", name: "Marcus Bell", role: "Customer Success", bio: "Your first call for anything account-related." },
      { imageUrl: "", name: "Sofia Lindqvist", role: "Head of Marketing", bio: "Runs brand, content and growth." },
      { imageUrl: "", name: "Omar Haddad", role: "Operations Manager", bio: "Keeps finance, hiring and delivery on track." },
    ],
  },
  Component: TeamMinimal,
})
