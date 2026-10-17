"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { PropText, noteBlock, textBlock } from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Inbox — centered archetype.
 *
 * A quiet, centred sign-up: headline and subheadline over one row holding the
 * capture field and the button. Copy and form are separate regions, so each is
 * a slot. The form is presentational, as it always was — the field shows the
 * placeholder text (inline-editable), the button carries the label.
 */
function NewsletterOptin ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="text-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center"
          align="center"
          headingClassName={`${TYPE_H2_SM}`}
          overrides={{
            subheadline: textBlock("subheadline", "mx-auto mt-3 max-w-md text-muted-foreground", isPreview),
          }}
        />
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="form"
          className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          overrides={{
            emailPlaceholder: ({ instance: inst }) => {
              if (typeof inst.props.emailPlaceholder !== "string") return null
              return (
                <PropText
                  instance={inst}
                  propKey="emailPlaceholder"
                  isPreview={isPreview}
                  className="block w-64 rounded border border-input px-4 py-2 text-sm text-muted-foreground"
                />
              )
            },
            ctaLabel: ({ instance: inst }) => {
              const v = inst.props.ctaLabel
              if (typeof v !== "string" || v === "") return null
              return (
                <PropText
                  instance={inst}
                  propKey="ctaLabel"
                  elementType="button"
                  isPreview={isPreview}
                  className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                />
              )
            },
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const newsletterOptinSection = defineSection({
  id: "blog-newsletter-optin",
  displayName: "Inbox",
  description: "Centred newsletter sign-up — headline, subheadline, then the email field and button in one row.",
  category: "blog",
  layoutArchetype: "centered",
  industries: ["app_landing", "saas", "agency", "portfolio", "creative", "education", "generic"],
  styles: ["modern", "minimal"],
  goals: ["leads", "engagement", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["newsletter", "email", "leads"],
  conversionWeight: 70,
  funnelStage: "consideration",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "form", label: "Sign-up form", eject: { direction: "row" } },
    ],
    blocks: [
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: {
          headline: { key: "headline", label: "Headline", type: "text", canonical: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80, group: "content" },
        },
      },
      {
        kind: "body",
        id: "subheadline",
        label: "Subheadline",
        field: { key: "subheadline", label: "Subheadline", type: "textarea", canonical: "subheadline", aiHint: "Supporting subheadline (8–14 words)", maxLength: 120, group: "content" },
      },
      noteBlock({ key: "emailPlaceholder", label: "Input placeholder", slot: "form", type: "text" }),
      noteBlock({
        key: "ctaLabel",
        label: "Button label",
        slot: "form",
        type: "text",
        canonical: "ctaPrimary",
        aiHint: "CTA button label (1–4 words)",
        maxLength: 30,
        group: "cta",
      }),
    ],
  },
  defaultProps: {
    headline: "Get the best of the blog every month",
    subheadline: "One thoughtful email with our newest guides. Unsubscribe anytime.",
    emailPlaceholder: "you@company.com",
    ctaLabel: "Subscribe",
  },
  Component: NewsletterOptin,
})
