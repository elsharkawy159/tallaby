import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SharedNavbarRenderer } from "@/components/sections/_chrome/shared-navbar-renderer"

/* ─── Navbar — Mega (enterprise) ───────────────────────────────────────────
   Logo left · nav links with decorative chevrons (hint at dropdowns) · CTA right.
   Wide, enterprise feel. Border-bottom. Mobile: logo + hamburger.
   ────────────────────────────────────────────────────────────────────────── */

export const navbarMegaSection = defineSection({
  id: "navbar-mega",
  displayName: "Navbar — mega / enterprise",
  description: "Wide enterprise navbar with logo, nav links hinting at dropdowns, sign in and CTA.",
  category: "navbar",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["enterprise", "saas", "finance", "real_estate", "education"],

  trustWeight: 20,

  conversionWeight: 5,

  funnelStage: 'awareness',
  styles: ["corporate", "modern"],
  goals: ["brand", "conversion"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  editableElements: ["logoText", "links", "ctaLabel", "secondaryLabel"],
  defaultProps: {
    logoText: "Lorem",
    links: [
      { label: "Lorem", href: "#", hasDropdown: true },
      { label: "Lorem", href: "#", hasDropdown: true },
      { label: "Lorem", href: "#", hasDropdown: true },
      { label: "Lorem", href: "#", hasDropdown: false },
      { label: "Lorem", href: "#", hasDropdown: false },
    ],
    secondaryLabel: "Lorem",
    secondaryHref: "#",
    ctaLabel: "Lorem Ipsum",
    ctaHref: "#",
    showThemeToggle: false,
  },
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "secondaryLabel", label: "Secondary CTA label", type: "text", canonical: 'ctaSecondary', aiHint: "Secondary CTA label (1–4 words)", maxLength: 30, group: 'cta' },
    { key: "secondaryHref", label: "Secondary CTA link", type: "url", group: 'cta' },
    { key: "ctaLabel", label: "CTA label", type: "text", canonical: 'ctaPrimary', aiHint: "CTA button label (1–4 words)", maxLength: 30, group: 'cta' },
    { key: "ctaHref", label: "CTA link", type: "url", group: 'cta' },
    { key: "showThemeToggle", label: "Show theme toggle", type: "switch" },
    { key: "showLanguageSwitcher", label: "Show language switcher", type: "switch" },
    { key: "languageSwitcherStyle", label: "Switcher style", type: "select", options: [{ value: 'code', label: 'EN / AR' }, { value: 'name', label: 'English / العربية' }, { value: 'flag', label: 'Flag + Code' }] },
  ],
  itemCollections: [
    {
      key: "links",
      label: "Nav links",
      minItems: 1,
      maxItems: 8,
      newItemTemplate: () => ({ label: "Link", href: "#", hasDropdown: false }),
      itemPropDefinitions: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
        { key: "hasDropdown", label: "Show dropdown chevron", type: "switch" },
      ],
    },
  ],
  Component: SharedNavbarRenderer,
})
