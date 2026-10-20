"use client"

import { Star } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_LOGOS, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  PropText,
  labelBlock,
  labelOverride,
  logosBlock,
  readLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Seal — strip archetype.
 *
 * A compact bar between hairlines: trusted-by label · brand names · star rating
 * with its sources. (Re-homed from the deprecated `logos` category — kept as id
 * "logos-strip" so existing pages keep resolving.)
 *
 * The rating is two blocks but one cluster ("★★★★★ 4.9 · G2 · Capterra"), as it
 * always rendered: the value entry draws the cluster and the sources entry is
 * carried by it (edited inline there, or in the inspector).
 */
function LogoCloudTrustStrip ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })

  return (
    <section className="border-y border-border bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="row"
          className="flex flex-col items-center justify-between gap-6 sm:flex-row"
          align="left"
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "flex-1" : undefined
          }
          overrides={{
            trustedByLabel: labelOverride(
              "shrink-0 whitespace-nowrap text-[12.5px] font-medium text-muted-foreground",
              isPreview,
              "span"
            ),
            ratingValue: ({ instance: inst }) => (
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex gap-0.5 text-accent">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-current" aria-hidden />)}
                </div>
                <PropText
                  instance={inst}
                  propKey="ratingValue"
                  isPreview={isPreview}
                  className="text-[13px] font-medium text-foreground"
                />
                {typeof inst.props.ratingSources === "string" ? (
                  <>
                    <span className="text-[12.5px] text-muted-foreground">·</span>
                    <PropText
                      instance={inst}
                      propKey="ratingSources"
                      isPreview={isPreview}
                      className="text-[12.5px] text-muted-foreground"
                    />
                  </>
                ) : null}
              </div>
            ),
            // Rendered inside the rating cluster above.
            ratingSources: () => null,
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-2 opacity-55">
                {logos.map((l, i) => (
                  <span
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                  >
                    <ItemText
                      instance={inst}
                      collection="logos"
                      index={i}
                      field="name"
                      value={l.name}
                      className="text-[13px] font-semibold text-foreground"
                      isPreview={isPreview}
                    />
                  </span>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudTrustStripSection = defineSection({
  id: "logos-strip",
  displayName: "Seal",
  description: "Compact bar — trusted-by label, brand names and a star rating with its sources.",
  category: "logo-cloud",
  layoutArchetype: "strip",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "enterprise", "generic"],
  styles: ["minimal", "modern"],
  goals: ["trust", "brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["logos", "trust", "strip"],
  trustWeight: 65,
  funnelStage: "consideration",
  defaultStyle: SECTION_PADDING_LOGOS,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "start", paddingY: "sm" },
  schema: {
    slots: [{ id: "row", label: "Row", isDefault: true, eject: { direction: "row" } }],
    blocks: [
      labelBlock("trustedByLabel", {
        label: "Trusted-by label",
        aiHint: "Trusted-by section label (e.g. Powering teams at)",
        maxLength: 50,
      }),
      logosBlock({
        minItems: 1,
        maxItems: 12,
        withImage: false,
        nameLabel: "Brand name",
        newItem: () => ({ name: "BRAND" }),
      }),
      {
        kind: "note",
        id: "ratingValue",
        label: "Rating value",
        field: { key: "ratingValue", label: "Rating value", type: "text", aiHint: "Average rating out of 5 (e.g. 4.9)", maxLength: 5, group: "content" },
      },
      {
        kind: "note",
        id: "ratingSources",
        label: "Rating sources",
        field: { key: "ratingSources", label: "Rating sources", type: "text", aiHint: "Review platforms (e.g. G2 · Capterra)", maxLength: 40, group: "content" },
      },
    ],
  },
  defaultProps: {
    trustedByLabel: "Powering teams at",
    ratingValue: "4.9",
    ratingSources: "G2 · Capterra",
    logos: [
      { name: "NORTHWIND" }, { name: "LUMEN" }, { name: "ARCADIA" },
      { name: "VERTEX" }, { name: "HALCYON" }, { name: "QUARRY" },
    ],
  },
  Component: LogoCloudTrustStrip,
})
