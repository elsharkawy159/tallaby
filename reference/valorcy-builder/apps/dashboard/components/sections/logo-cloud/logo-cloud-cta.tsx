"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { CtaLinkButton } from "@/components/sections/cta/cta-parts"
import {
  LogoMark,
  labelBlock,
  labelOverride,
  logosBlock,
  readLogos,
  sampleLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Invitation — centered archetype.
 *
 * A logo row that converts: the customers first, then a trust line and a pill
 * button inviting the visitor to join them. The action row is its own slot
 * because it lays out horizontally under the vertical stack.
 *
 * The button keeps the flat `ctaText` / `ctaHref` props it has always stored;
 * the href block is an inspector field only, carried by the button.
 */
function LogoCloudCta ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="flex flex-col items-center gap-8 text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="logos"
          className="flex w-full flex-col items-center gap-8"
          align="center"
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-65">
                {logos.map((logo, i) => (
                  <div
                    key={i}
                    data-element-collection="logos"
                    data-element-index={String(i)}
                    data-element-item-label-prop="name"
                    className="flex items-center justify-center grayscale"
                  >
                    <LogoMark
                      instance={inst}
                      logo={logo}
                      index={i}
                      isPreview={isPreview}
                      imgClassName="h-6 w-auto max-w-[5.5rem] object-contain"
                      nameClassName="text-[13px] font-semibold text-foreground/75"
                    />
                  </div>
                ))}
              </div>
            )
          }}
        />

        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="action"
          className="flex flex-col items-center gap-4 sm:flex-row"
          align="center"
          overrides={{
            eyebrow: labelOverride("text-sm font-medium text-muted-foreground", isPreview),
            ctaText: ({ instance: inst }) => (
              <CtaLinkButton
                instance={inst}
                isPreview={isPreview}
                labelProp="ctaText"
                hrefProp="ctaHref"
                elementKey="ctaText"
                fallback="Get started"
                className="gap-1.5 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90"
              />
            ),
            // Carried by the button above; edited in the inspector.
            ctaHref: () => null,
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudCtaSection = defineSection({
  id: "logo-cloud-cta",
  displayName: "Invitation",
  description: "Customer logos followed by a trust line and a pill button inviting visitors to join them.",
  category: "logo-cloud",
  layoutArchetype: "centered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "ecommerce", "generic"],
  styles: ["modern", "bold", "minimal"],
  goals: ["trust", "conversion", "leads"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 93,
  editable: true,
  tags: ["logos", "trust", "cta", "conversion"],
  trustWeight: 70,
  conversionWeight: 45,
  funnelStage: "decision",
  defaultStyle: SECTION_PADDING_MEDIUM,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [
      { id: "logos", label: "Logos", isDefault: true },
      { id: "action", label: "Action", eject: { direction: "row" } },
    ],
    blocks: [
      logosBlock({ minItems: 2, maxItems: 10 }),
      labelBlock(
        "eyebrow",
        {
          label: "Trust line",
          aiHint: "Short join-them line (4–8 words)",
          maxLength: 60,
        },
        "action"
      ),
      {
        kind: "note",
        id: "ctaText",
        label: "CTA label",
        slot: "action",
        field: {
          key: "ctaText",
          label: "CTA label",
          type: "text",
          canonical: "ctaPrimary",
          aiHint: "CTA button text (1–3 words)",
          maxLength: 24,
          group: "cta",
        },
      },
      {
        kind: "note",
        id: "ctaHref",
        label: "CTA link",
        slot: "action",
        field: { key: "ctaHref", label: "CTA link", type: "url", canonical: "ctaLink", group: "cta" },
      },
    ],
  },
  defaultProps: {
    eyebrow: "Join 2,000+ teams already on board.",
    ctaText: "Start free",
    ctaHref: "#",
    logos: sampleLogos(5),
  },
  Component: LogoCloudCta,
})
