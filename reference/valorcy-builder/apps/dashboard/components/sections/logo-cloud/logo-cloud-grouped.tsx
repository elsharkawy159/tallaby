"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemText, type LogoItem } from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type LogoGroup = { label?: string; logos?: LogoItem[] }

/**
 * Directory — list archetype.
 *
 * A headline over a stacked list of labelled groups (Partners, Integrations,
 * Customers), each with its own row of logos.
 *
 * `groups` nests a `logos` array per item, which the flat item schema cannot
 * describe; the group label is a declared item field, and the nested logos keep
 * their pre-migration rendering.
 */
function LogoCloudGrouped ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-12"
          align="center"
          headingClassName={`${TYPE_H2_SM} text-center text-foreground`}
          renderItems={({ instance: inst }) => {
            const raw = inst.props.groups
            const groups = Array.isArray(raw) ? (raw as LogoGroup[]) : []
            if (groups.length === 0) return null
            return (
              <div className="space-y-10">
                {groups.map((group, gi) => (
                  <div key={gi} data-element-collection="groups" data-element-index={String(gi)} data-element-item-label-prop="label">
                    <p className="mb-5 text-center text-xs font-semibold text-muted-foreground">
                      <ItemText
                        instance={inst}
                        collection="groups"
                        index={gi}
                        field="label"
                        value={group.label}
                        isPreview={isPreview}
                      />
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                      {(group.logos ?? []).map((logo, li) => (
                        <div
                          key={li}
                          className="flex items-center justify-center grayscale opacity-60 transition-all hover:opacity-100 hover:grayscale-0"
                        >
                          {logo.imageUrl ? (
                            // Nested items have no media-picker binding; kept as before.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo.imageUrl} alt={logo.name ?? ""} className="h-8 w-auto max-w-[6rem] object-contain" />
                          ) : (
                            <div className="h-8 w-24 rounded bg-muted" title={logo.name} />
                          )}
                        </div>
                      ))}
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

export const logoCloudGroupedSection = defineSection({
  id: "logo-cloud-grouped",
  displayName: "Directory",
  description: "A headline over labelled groups of logos — partners, integrations, customers.",
  category: "logo-cloud",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "enterprise", "agency", "startup", "generic", "finance"],
  trustWeight: 75,
  conversionWeight: 25,
  funnelStage: "awareness",
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "brand", "awareness", "education"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
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
        key: "groups",
        canonical: "items",
        label: "Groups",
        pick: [],
        itemFields: [{ key: "label", label: "Group label", type: "text", maxLength: 30 }],
        minItems: 1,
        maxItems: 6,
        newItem: () => ({ label: "Partners", logos: [{ name: "Company" }, { name: "Company" }, { name: "Company" }] }),
      },
    ],
  },
  defaultProps: {
    headline: "An ecosystem built around your stack",
    groups: [
      { label: "Partners", logos: [{ name: "Northwind" }, { name: "Lumen" }, { name: "Arcadia" }] },
      { label: "Integrations", logos: [{ name: "Vertex" }, { name: "Halcyon" }, { name: "Quarry" }, { name: "Brightline" }] },
      { label: "Customers", logos: [{ name: "Solace" }, { name: "Kestrel" }, { name: "Monarch" }] },
    ],
  },
  Component: LogoCloudGrouped,
})
