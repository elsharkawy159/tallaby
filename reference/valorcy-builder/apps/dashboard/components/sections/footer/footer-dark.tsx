import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SECTION_PADDING_COMPACT } from "@/components/sections/section-style-presets"
import { SOCIAL_ICON_OPTIONS } from "@/components/sections/_chrome/social-options"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

/* ─── Footer — Dark ────────────────────────────────────────────────────────
   Explicit dark background (bg-zinc-950) with logo + tagline + 3 link
   columns + social icons. Bottom row: copyright + legal links.
   ────────────────────────────────────────────────────────────────────────── */

export const footerDarkSection = defineSection({
  id: "footer-dark",
  displayName: "Footer — dark",
  description: "Dark-background footer (zinc-950) with logo, tagline, social icons, three link columns, and legal row.",
  category: "footer",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "creative", "enterprise", "generic"],

  trustWeight: 15,

  conversionWeight: 10,

  funnelStage: 'retention',
  styles: ["dark", "modern", "bold"],
  goals: ["brand", "trust", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 82,
  editable: true,
  editableElements: ["logoText", "tagline", "copyright", "columns", "socials", "legal"],
  defaultProps: {
    logoText: "Lorem",
    tagline: "Lorem ipsum dolor sit amet.",
    copyright: "© 2025 Lorem Ipsum, Inc. All rights reserved.",
    socials: [
      { icon: "Twitter", label: "Twitter", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Dribbble", label: "Dribbble", href: "#" },
    ],
    columns: [
      { title: "Lorem", links: [{ label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }] },
      { title: "Lorem", links: [{ label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }] },
      { title: "Lorem", links: [{ label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }] },
    ],
    legal: [
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
    ],
  },
  defaultStyle: SECTION_PADDING_COMPACT,
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "tagline", label: "Tagline", type: "textarea", canonical: 'subheadline', aiHint: "Brand tagline or slogan (4–8 words)", maxLength: 80, group: 'content' },
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
      key: "columns", label: "Link columns", minItems: 1, maxItems: 4,
      newItemTemplate: () => ({ title: "Column", links: [{ label: "Link", href: "#" }] }),
      itemPropDefinitions: [{ key: "title", label: "Column title", type: "text", canonical: 'headline', aiHint: "Section title (4–8 words)", maxLength: 60, group: 'content' }],
    },
    {
      key: "legal", label: "Legal links", minItems: 0, maxItems: 6,
      newItemTemplate: () => ({ label: "Legal link", href: "#" }),
      itemPropDefinitions: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
      ],
    },
  ],
  Component: SharedFooterRenderer,
})
