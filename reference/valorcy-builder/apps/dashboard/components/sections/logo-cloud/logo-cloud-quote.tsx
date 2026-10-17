"use client"

import { Quote } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  LogoMark,
  PropText,
  logosBlock,
  readLogos,
  sampleLogos,
} from "@/components/sections/logo-cloud/logo-cloud-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Testament — editorial archetype.
 *
 * One customer's pull-quote with attribution, then a ruled row of the logos
 * that agree with them. The quote mark is decoration and stays in JSX.
 *
 * Author and role are two blocks but one line ("Name · Role"), as they always
 * rendered: the author entry draws the whole attribution and the role entry is
 * carried by it (edited inline there, or in the inspector).
 */
function LogoCloudQuote ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="bg-muted/30" style={rootStyle}>
      <SectionContainer className="text-center">
        <Quote className="mx-auto mb-5 size-7 text-primary/70" aria-hidden />
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col items-center gap-4"
          align="center"
          bodyClassName="mx-auto max-w-2xl text-xl font-medium leading-snug tracking-tight text-foreground sm:text-2xl"
          overrides={{
            author: ({ instance: inst }) => {
              const hasAuthor = typeof inst.props.author === "string"
              const hasRole = typeof inst.props.role === "string"
              if (!hasAuthor && !hasRole) return null
              return (
                <p className="text-sm text-muted-foreground">
                  <PropText
                    instance={inst}
                    propKey="author"
                    isPreview={isPreview}
                    className="font-semibold text-foreground"
                  />
                  {hasAuthor && hasRole ? "  ·  " : null}
                  <PropText instance={inst} propKey="role" isPreview={isPreview} />
                </p>
              )
            },
            // Rendered inside the attribution line above.
            role: () => null,
          }}
          renderItems={({ instance: inst }) => {
            const logos = readLogos(inst)
            if (logos.length === 0) return null
            return (
              <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-x-12 gap-y-6 border-t border-border pt-10 opacity-65">
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
          entryClassName={(entry) =>
            entry.kind === "block" && entry.block.kind === "items" ? "w-full" : undefined
          }
        />
      </SectionContainer>
    </section>
  )
}

export const logoCloudQuoteSection = defineSection({
  id: "logo-cloud-quote",
  displayName: "Testament",
  description: "A customer pull-quote with attribution over a ruled row of customer logos.",
  category: "logo-cloud",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "generic"],
  styles: ["modern", "editorial", "corporate"],
  goals: ["trust", "brand", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  tags: ["logos", "trust", "quote", "testimonial"],
  trustWeight: 82,
  funnelStage: "consideration",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      {
        kind: "body",
        id: "quote",
        label: "Quote",
        field: {
          key: "quote",
          label: "Quote",
          type: "textarea",
          canonical: "body",
          aiHint: "Short customer quote (1–2 sentences)",
          maxLength: 180,
          group: "content",
        },
      },
      {
        kind: "note",
        id: "author",
        label: "Author",
        field: { key: "author", label: "Author", type: "text", aiHint: "Quote author full name", maxLength: 40, group: "content" },
      },
      {
        kind: "note",
        id: "role",
        label: "Author role",
        field: {
          key: "role",
          label: "Author role",
          type: "text",
          aiHint: "Role and company (e.g. VP Engineering, Northwind)",
          maxLength: 60,
          group: "content",
        },
      },
      logosBlock({ minItems: 2, maxItems: 10 }),
    ],
  },
  defaultProps: {
    quote: "We moved our whole marketing site over in a week, and our conversion rate has never been higher.",
    author: "Maya Chen",
    role: "VP Marketing, Northwind",
    logos: sampleLogos(5),
  },
  Component: LogoCloudQuote,
})
