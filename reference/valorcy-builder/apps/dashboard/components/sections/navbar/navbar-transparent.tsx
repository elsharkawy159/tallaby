import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SharedNavbarRenderer } from "@/components/sections/_chrome/shared-navbar-renderer"

/* ─── Navbar — Transparent ──────────────────────────────────────────────────
   No background, no border. Logo left, nav center, CTA right.
   Designed to float over hero sections. Mobile: logo + hamburger.
   ────────────────────────────────────────────────────────────────────────── */

export const navbarTransparentSection = defineSection({
  id: "navbar-transparent",
  displayName: "Navbar — transparent",
  description: "Borderless, background-free navbar. Designed to float over hero sections.",
  category: "navbar",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "portfolio", "agency", "creative", "startup", "generic"],

  trustWeight: 20,

  conversionWeight: 5,

  funnelStage: 'awareness',
  styles: ["minimal", "modern"],
  goals: ["brand"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  editableElements: ["logoText", "links", "ctaText"],
  defaultProps: {
    logoText: "Lorem",
    links: [
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
    ],
    ctaText: "Lorem Ipsum",
    ctaHref: "#",
  },
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "ctaText", label: "CTA label", type: "text", canonical: 'ctaPrimary', aiHint: "CTA button text (1–4 words)", maxLength: 30, group: 'cta' },
    { key: "ctaHref", label: "CTA link", type: "url", group: 'cta' },
  ],
  itemCollections: [
    {
      key: "links",
      label: "Nav links",
      minItems: 1,
      maxItems: 7,
      newItemTemplate: () => ({ label: "Link", href: "#" }),
      itemPropDefinitions: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
      ],
    },
  ],
  Component: SharedNavbarRenderer,
})
