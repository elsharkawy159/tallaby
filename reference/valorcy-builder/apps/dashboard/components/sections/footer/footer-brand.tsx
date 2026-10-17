import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SOCIAL_ICON_OPTIONS } from "@/components/sections/_chrome/social-options"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

/* ─── Footer — Brand centered ──────────────────────────────────────────────
   Large centered logo, bold tagline, social icons, minimal nav row,
   soft radial brand wash backdrop, copyright at bottom.
   ────────────────────────────────────────────────────────────────────────── */

export const footerBrandSection = defineSection({
  id: "footer-brand",
  displayName: "Footer — brand centered",
  description: "Large centered logo and bold tagline with social icons, minimal nav links, and soft brand-wash backdrop.",
  category: "footer",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["startup", "creative", "agency", "portfolio", "saas", "generic"],

  trustWeight: 15,

  conversionWeight: 10,

  funnelStage: 'retention',
  styles: ["modern", "minimal", "bold", "gradient"],
  goals: ["brand", "awareness", "engagement"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  editableElements: ["logoText", "tagline", "copyright", "links", "socials"],
  defaultProps: {
    logoText: "Lorem",
    tagline: "Lorem ipsum dolor sit amet.",
    copyright: "© 2025 Lorem Ipsum, Inc. All rights reserved.",
    socials: [
      { icon: "Twitter", label: "Twitter", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Instagram", label: "Instagram", href: "#" },
    ],
    links: [
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
    ],
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "tagline", label: "Tagline", type: "text", canonical: 'subheadline', aiHint: "Brand tagline or slogan (4–8 words)", maxLength: 80, group: 'content' },
    { key: "copyright", label: "Copyright", type: "text", canonical: 'body', aiHint: 'Copyright notice (e.g. © 2024 Acme Inc.)', maxLength: 60, group: 'content' },
  ],
  itemCollections: [
    {
      key: "socials", label: "Social icons", minItems: 0, maxItems: 8,
      newItemTemplate: () => ({ icon: "Twitter", label: "Twitter", href: "#" }),
      itemPropDefinitions: [
        { key: "icon", label: "Icon", type: "select", options: SOCIAL_ICON_OPTIONS },
        { key: "label", label: "Aria label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
      ],
    },
    {
      key: "links", label: "Nav links", minItems: 0, maxItems: 8,
      newItemTemplate: () => ({ label: "Link", href: "#" }),
      itemPropDefinitions: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
      ],
    },
  ],
  Component: SharedFooterRenderer,
})
