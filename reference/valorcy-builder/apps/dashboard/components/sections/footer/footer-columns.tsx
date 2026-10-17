import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SECTION_PADDING_TIGHT } from "@/components/sections/section-style-presets"
import { SOCIAL_ICON_OPTIONS } from "@/components/sections/_chrome/social-options"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

/* ─── Footer 2 — Multi-column ─────────────────────────────────────────────
   Brand block + tagline + socials · 4 link columns · status row beneath
   Everything is fully customizable: brand text, tagline, columns, links,
   socials, status indicator label and color.
   ────────────────────────────────────────────────────────────────────────── */

export const footerColumnsSection = defineSection({
  id: "footer-columns",
  displayName: "Footer — multi-column",
  description:
    "Brand column with tagline + socials plus four configurable link columns.",
  category: "footer",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas","startup","agency","enterprise","ecommerce","generic"],

  trustWeight: 15,

  conversionWeight: 10,

  funnelStage: 'retention',
  styles: ["modern","minimal","corporate"],
  goals: ["brand","engagement"],
  complexity: 'medium',
  density: 'medium',
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  editableElements: ["brandName","socials","links"],
  tags: ["footer","columns","multi-column"],
  migrateProps(oldProps, fromVersion) {
    if (fromVersion < 2) return footerColumnsSection.defaultProps
    return oldProps
  },
  defaultProps: {
    logoText: "Lorem",
    tagline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    copyright: "© 2025 Lorem Ipsum, Inc. All rights reserved.",
    statusText: "Lorem ipsum",
    statusColor: "var(--success)",
    socials: [
      { icon: "Twitter", label: "Twitter", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Youtube", label: "YouTube", href: "#" },
      { icon: "Dribbble", label: "Dribbble", href: "#" },
    ],
    columns: [
      {
        title: "Lorem",
        links: [
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
        ],
      },
      {
        title: "Lorem",
        links: [
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
        ],
      },
      {
        title: "Lorem",
        links: [
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
        ],
      },
      {
        title: "Lorem",
        links: [
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
          { label: "Lorem", href: "#" },
        ],
      },
    ],
  },
  defaultStyle: SECTION_PADDING_TIGHT,
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "tagline", label: "Tagline", type: "textarea", canonical: 'subheadline', aiHint: "Brand tagline or slogan (4–8 words)", maxLength: 80, group: 'content' },
    { key: "copyright", label: "Copyright", type: "text", canonical: 'body', aiHint: 'Copyright notice (e.g. © 2024 Acme Inc.)', maxLength: 60, group: 'content' },
    { key: "statusText", label: "Status label", type: "text" },
    { key: "statusColor", label: "Status dot color", type: "color" },
  ],
  itemCollections: [
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
      key: "columns",
      label: "Link columns",
      minItems: 1,
      maxItems: 5,
      newItemTemplate: () => ({
        title: "Column",
        links: [
          { label: "Link", href: "#" },
          { label: "Link", href: "#" },
        ],
      }),
      itemPropDefinitions: [
        { key: "title", label: "Column title", type: "text", canonical: 'headline', aiHint: "Section title (4–8 words)", maxLength: 60, group: 'content' },
      ],
    },
  ],
  Component: SharedFooterRenderer,
})
