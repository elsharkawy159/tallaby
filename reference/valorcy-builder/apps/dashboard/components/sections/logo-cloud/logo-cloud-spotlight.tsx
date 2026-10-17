"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  LogoMark,
  isBlockHidden,
  labelBlock,
  labelOverride,
  logosBlock,
  readLogos,
  sampleLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Keystone — asymmetric archetype.
 *
 * One featured customer in a card (large logo + a one-line quote) beside a grid
 * of supporting logos. Both read the single `logos` collection: the first item
 * is featured, the rest fill the grid.
 *
 * The `logos` block lives in the card slot, where it draws the featured mark.
 * The supporting grid is chrome that mirrors the same block — hiding the block
 * hides both, so the collection stays one block as the engine expects.
 */
function LogoCloudSpotlight ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const logos = readLogos(instance)
  const rest = logos.slice(1)
  const gridHidden = isBlockHidden(instance, "card", "logos")

  return (
    <section style={rootStyle}>
      <SectionContainer className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="rounded-3xl border border-border bg-card p-8">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="card"
            className="flex flex-col"
            align="left"
            bodyClassName="text-lg font-medium leading-snug tracking-tight text-foreground"
            entryClassName={(entry) =>
              entry.kind === "block" && entry.block.id === "quote"
                ? undefined
                : entry.kind === "block" && entry.block.kind === "items"
                  ? "mb-5"
                  : "mb-4"
            }
            overrides={{
              eyebrow: labelOverride("text-xs font-semibold text-primary", isPreview),
            }}
            renderItems={({ instance: inst }) => {
              const featured = readLogos(inst)[0]
              if (!featured) return null
              return (
                <div
                  data-element-collection="logos"
                  data-element-index="0"
                  data-element-item-label-prop="name"
                  className="flex items-center"
                >
                  <LogoMark
                    instance={inst}
                    logo={featured}
                    index={0}
                    isPreview={isPreview}
                    imgClassName="h-10 w-auto max-w-[9rem] object-contain"
                    nameClassName="text-2xl font-semibold tracking-tight text-foreground"
                  />
                </div>
              )
            }}
          />
        </div>
        {gridHidden ? null : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3">
            {rest.map((logo, i) => (
              <div
                key={i}
                data-element-collection="logos"
                data-element-index={String(i + 1)}
                data-element-item-label-prop="name"
                className="flex items-center justify-center grayscale opacity-60 transition hover:opacity-100 hover:grayscale-0"
              >
                <LogoMark
                  instance={instance}
                  logo={logo}
                  index={i + 1}
                  isPreview={isPreview}
                  imgClassName="h-6 w-auto max-w-[5.5rem] object-contain"
                  nameClassName="text-[13px] font-semibold text-foreground/70"
                />
              </div>
            ))}
          </div>
        )}
      </SectionContainer>
    </section>
  )
}

export const logoCloudSpotlightSection = defineSection({
  id: "logo-cloud-spotlight",
  displayName: "Keystone",
  description: "One featured customer — large logo and a one-line quote — beside a grid of supporting logos.",
  category: "logo-cloud",
  layoutArchetype: "asymmetric",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "enterprise", "startup", "generic"],
  styles: ["modern", "editorial", "corporate"],
  goals: ["trust", "brand", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["logos", "trust", "spotlight", "featured"],
  trustWeight: 80,
  funnelStage: "consideration",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "card", label: "Featured card", isDefault: true }],
    blocks: [
      labelBlock("eyebrow", {
        label: "Eyebrow",
        aiHint: "Short label (1–3 words)",
        maxLength: 30,
      }),
      logosBlock({ minItems: 2, maxItems: 12, label: "Logos (first is featured)" }),
      {
        kind: "body",
        id: "quote",
        label: "Spotlight quote",
        field: {
          key: "quote",
          label: "Spotlight quote",
          type: "textarea",
          canonical: "body",
          aiHint: "Short quote from the featured customer (1 sentence)",
          maxLength: 120,
          group: "content",
        },
      },
    ],
  },
  defaultProps: {
    eyebrow: "Featured customer",
    quote: "Our launch pages went from weeks to an afternoon.",
    logos: sampleLogos(7),
  },
  Component: LogoCloudSpotlight,
})
