import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SharedNavbarRenderer } from "@/components/sections/_chrome/shared-navbar-renderer"

/* ─── Navbar — Sticky ───────────────────────────────────────────────────────
   Same layout as navbar-simple but with sticky top-0 z-50 backdrop-blur.
   The blur + translucent bg creates a frosted-glass effect on scroll.
   Mobile: logo + hamburger (decorative).
   ────────────────────────────────────────────────────────────────────────── */

export const navbarStickySection = defineSection({
  id: "navbar-sticky",
  displayName: "Navbar — sticky blur",
  description: "Sticky top-0 navbar with frosted-glass backdrop blur. Stays visible as users scroll.",
  category: "navbar",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "agency", "portfolio", "creative", "generic"],

  trustWeight: 20,

  conversionWeight: 5,

  funnelStage: 'awareness',
  styles: ["glass", "modern", "minimal"],
  goals: ["brand", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  editableElements: ["logoText", "links", "signInText", "ctaText"],
  defaultProps: {
    logoText: "Lorem",
    links: [
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
      { label: "Lorem", href: "#" },
    ],
    signInText: "Lorem",
    signInHref: "#",
    ctaText: "Lorem Ipsum",
    ctaHref: "#",
    showThemeToggle: true,
    showLanguageSwitcher: true,
    languageSwitcherStyle: 'code',
  },
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "showThemeToggle", label: "Show theme toggle", type: "switch" },
    { key: "showLanguageSwitcher", label: "Show language switcher", type: "switch" },
    { key: "languageSwitcherStyle", label: "Switcher style", type: "select", options: [{ value: 'code', label: 'EN / AR' }, { value: 'name', label: 'English / العربية' }, { value: 'flag', label: 'Flag + Code' }] },
    { key: "signInText", label: "Sign in label", type: "text", canonical: 'ctaSecondary', aiHint: "Sign-in link label (1–3 words)", maxLength: 20, group: 'cta' },
    { key: "signInHref", label: "Sign in link", type: "url", group: 'cta' },
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
