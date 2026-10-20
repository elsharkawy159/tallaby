import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SECTION_PADDING_COMPACT } from "@/components/sections/section-style-presets"
import { SOCIAL_ICON_OPTIONS } from "@/components/sections/_chrome/social-options"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

/* ─── Footer 1 — Simple bar ────────────────────────────────────────────────
   Logo left · nav links center · social icons right · copyright row below
   ────────────────────────────────────────────────────────────────────────── */

export const footerSimpleSection = defineSection({
  id: "footer-simple",
  displayName: "Footer — simple bar",
  description: "Logo, nav links, social icons in one row; copyright + legal beneath a divider.",
  category: "footer",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas","startup","agency","creative","portfolio","generic"],

  trustWeight: 15,

  conversionWeight: 10,

  funnelStage: 'retention',
  styles: ["modern","minimal"],
  goals: ["brand","engagement"],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 92,
  editable: true,
  editableElements: ["brandName","links","socials","copyright"],
  tags: ["footer","simple"],
  migrateProps(oldProps, fromVersion) {
    if (fromVersion < 2) return footerSimpleSection.defaultProps
    return oldProps
  },
  defaultProps: {
    logoText: "Lorem",
    copyright: "© 2025 Lorem Ipsum, Inc. All rights reserved.",
    links: [
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
    ],
    socials: [
      { icon: "Twitter", label: "Twitter / X", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Youtube", label: "YouTube", href: "#" },
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
    { key: "copyright", label: "Copyright", type: "text", canonical: 'body', aiHint: 'Copyright notice (e.g. © 2024 Acme Inc.)', maxLength: 60, group: 'content' },
  ],
  itemCollections: [
    {
      key: "links",
      label: "Nav links",
      minItems: 0,
      maxItems: 10,
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
