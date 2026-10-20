import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SharedNavbarRenderer } from "@/components/sections/_chrome/shared-navbar-renderer"

/* ─── Navbar 2 — Floating glass pill ───────────────────────────────────────
   A rounded-full pill that floats above the page content with blur + glow.
   Desktop: logo · divider · nav links · CTA pill all inline.
   Mobile: pill collapses to logo + hamburger; menu drops below.
   ────────────────────────────────────────────────────────────────────────── */

export const navbarPillSection = defineSection({
  id: "navbar-pill",
  displayName: "Navbar — floating pill",
  description: "A glass-blur pill that floats above page content. Ideal for marketing sites.",
  category: "navbar",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "startup", "portfolio", "creative", "agency", "generic"],

  trustWeight: 20,

  conversionWeight: 5,

  funnelStage: 'awareness',
  styles: ["glass", "modern", "minimal"],
  goals: ["brand", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  editableElements: ["logoText", "links", "ctaText"],
  defaultProps: {
    logoText: "Lorem",
    links: [
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
    ],
    ctaText: "Lorem Ipsum",
    ctaHref: "#",
    showThemeToggle: true,
    showLanguageSwitcher: true,
    languageSwitcherStyle: 'code',
    isFixed: false,
  },
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "isFixed", label: "Fixed on scroll", type: "switch" },
    { key: "showThemeToggle", label: "Show theme toggle", type: "switch" },
    { key: "showLanguageSwitcher", label: "Show language switcher", type: "switch" },
    { key: "languageSwitcherStyle", label: "Switcher style", type: "select", options: [{ value: 'code', label: 'EN / AR' }, { value: 'name', label: 'English / العربية' }, { value: 'flag', label: 'Flag + Code' }] },
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
