import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SOCIAL_ICON_OPTIONS } from "@/components/sections/_chrome/social-options"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

/* ─── Footer 3 — Centered ──────────────────────────────────────────────────
   Centered logo + tagline + nav + social row.
   Soft radial brand wash backdrop. Bottom copyright + legal links.
   ────────────────────────────────────────────────────────────────────────── */

export const footerMinimalSection = defineSection({
  id: "footer-minimal",
  displayName: "Footer — centered minimal",
  description: "Centered logo, tagline, nav links and social circles over a soft brand-wash backdrop.",
  category: "footer",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas","startup","portfolio","creative","agency","generic"],

  trustWeight: 15,

  conversionWeight: 10,

  funnelStage: 'retention',
  styles: ["minimal","modern"],
  goals: ["brand"],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  editableElements: ["brandName","copyright","links"],
  tags: ["footer","minimal","simple"],
  migrateProps(oldProps, fromVersion) {
    if (fromVersion < 2) return footerMinimalSection.defaultProps
    return oldProps
  },
  defaultProps: {
    logoText: "Lorem",
    tagline: "Lorem ipsum dolor sit amet.",
    copyright: "© 2025 Lorem Ipsum, Inc. All rights reserved.",
    links: [
      { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" }, { label: "Lorem", href: "#" },
    ],
    socials: [
      { icon: "Twitter", label: "Twitter", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Instagram", label: "Instagram", href: "#" },
      { icon: "Youtube", label: "YouTube", href: "#" },
    ],
    legal: [
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
    ],
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "tagline", label: "Tagline", type: "textarea", canonical: 'subheadline', aiHint: "Brand tagline or slogan (4–8 words)", maxLength: 80, group: 'content' },
    { key: "copyright", label: "Copyright", type: "text", canonical: 'body', aiHint: 'Copyright notice (e.g. © 2024 Acme Inc.)', maxLength: 60, group: 'content' },
  ],
  itemCollections: [
    {
      key: "links",
      label: "Nav links",
      minItems: 0,
      maxItems: 12,
      newItemTemplate: () => ({ label: "Link", href: "#" }),
      itemPropDefinitions: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
      ],
    },
    {
      key: "socials",
      label: "Social icons",
      minItems: 0,
      maxItems: 8,
      newItemTemplate: () => ({ icon: "Twitter", label: "Twitter", href: "#" }),
      itemPropDefinitions: [
        { key: "icon", label: "Icon", type: "select", options: SOCIAL_ICON_OPTIONS },
        { key: "label", label: "Aria label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
      ],
    },
    {
      key: "legal",
      label: "Legal links",
      minItems: 0,
      maxItems: 6,
      newItemTemplate: () => ({ label: "Privacy", href: "#" }),
      itemPropDefinitions: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
      ],
    },
  ],
  Component: SharedFooterRenderer,
})
