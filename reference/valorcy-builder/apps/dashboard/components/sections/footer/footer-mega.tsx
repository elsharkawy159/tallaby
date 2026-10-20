import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SECTION_PADDING_COMPACT } from "@/components/sections/section-style-presets"
import { SOCIAL_ICON_OPTIONS } from "@/components/sections/_chrome/social-options"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

/* ─── Footer — Mega ────────────────────────────────────────────────────────
   Full-width: logo + description + 4 link columns + social icons
   Bottom legal row with copyright + legal links
   ────────────────────────────────────────────────────────────────────────── */

export const footerMegaSection = defineSection({
  id: "footer-mega",
  displayName: "Footer — mega",
  description: "Full-featured footer: logo + description + social icons left, four link columns right, legal row at bottom.",
  category: "footer",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "agency", "ecommerce", "generic"],

  trustWeight: 15,

  conversionWeight: 10,

  funnelStage: 'retention',
  styles: ["modern", "minimal", "corporate"],
  goals: ["brand", "trust", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  editableElements: ["logoText", "description", "copyright", "columns", "socials", "legal"],
  defaultProps: {
    logoText: "Lorem",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    copyright: "© 2025 Lorem Ipsum, Inc. All rights reserved.",
    socials: [
      { icon: "Twitter", label: "Twitter", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Youtube", label: "YouTube", href: "#" },
      { icon: "Dribbble", label: "Dribbble", href: "#" },
    ],
    columns: [
      { title: "Lorem", links: [{ label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }] },
      { title: "Lorem", links: [{ label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }] },
      { title: "Lorem", links: [{ label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }] },
      { title: "Lorem", links: [{ label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }] },
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
    { key: "description", label: "Description", type: "textarea", canonical: 'body', aiHint: "Short descriptive paragraph (1–3 sentences, 20–60 words)", maxLength: 280, group: 'content' },
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
      key: "columns", label: "Link columns", minItems: 1, maxItems: 5,
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
