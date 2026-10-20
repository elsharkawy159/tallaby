import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SharedNavbarRenderer } from "@/components/sections/_chrome/shared-navbar-renderer"

/* ─── Navbar 3 — App-shell navbar ──────────────────────────────────────────
   Layout: Logo + workspace switcher left · Nav center · Search + bell + upgrade + avatar right
   Heavier, app-dashboard style with section dividers.
   Mobile: collapses to logo + workspace + icon buttons + hamburger.
   ────────────────────────────────────────────────────────────────────────── */

export const navbarAppSection = defineSection({
  id: "navbar-app",
  displayName: "Navbar — app shell",
  description: "App-dashboard style with workspace switcher, search, notifications, and avatar.",
  category: "navbar",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "finance", "education"],

  trustWeight: 20,

  conversionWeight: 5,

  funnelStage: 'awareness',
  styles: ["modern", "corporate", "minimal"],
  goals: ["brand"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 70,
  editable: true,
  editableElements: ["logoText", "workspaceName", "links", "upgradeText", "searchPlaceholder", "avatarInitials"],
  defaultProps: {
    logoText: "Lorem",
    workspaceName: "Lorem Ipsum",
    avatarInitials: "LI",
    upgradeText: "Lorem Ipsum",
    upgradeHref: "#",
    searchPlaceholder: "Lorem ipsum...",
    showNotificationDot: true,
    showThemeToggle: true,
    showLanguageSwitcher: true,
    languageSwitcherStyle: 'code',
    isFixed: false,
    links: [
      { label: "Lorem", href: "#", active: true },
      { label: "Lorem", href: "#", active: false },
      { label: "Lorem", href: "#", active: false },
      { label: "Lorem", href: "#", active: false },
    ],
  },
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "logoText", label: "Logo text", type: "text", canonical: 'brandName', aiHint: "Brand or product name shown in logo area", maxLength: 40, group: 'content' },
    { key: "isFixed", label: "Fixed on scroll", type: "switch" },
    { key: "workspaceName", label: "Workspace name", type: "text", canonical: 'brandName', aiHint: "Workspace or project name", maxLength: 40, group: 'content' },
    { key: "avatarInitials", label: "Avatar initials", type: "text", canonical: 'brandName', aiHint: "User initials (2 letters)", maxLength: 3, group: 'content' },
    { key: "upgradeText", label: "Upgrade label", type: "text", canonical: 'ctaPrimary', aiHint: "Upgrade prompt text (1–4 words)", maxLength: 30, group: 'cta' },
    { key: "upgradeHref", label: "Upgrade link", type: "url", group: 'cta' },
    { key: "searchPlaceholder", label: "Search placeholder", type: "text", canonical: 'body', aiHint: "Search input placeholder text", maxLength: 40, group: 'content' },
    {
      key: "showNotificationDot",
      label: "Show notification dot",
      type: "switch",
    },
    { key: "showThemeToggle", label: "Show theme toggle", type: "switch" },
    { key: "showLanguageSwitcher", label: "Show language switcher", type: "switch" },
    { key: "languageSwitcherStyle", label: "Switcher style", type: "select", options: [{ value: 'code', label: 'EN / AR' }, { value: 'name', label: 'English / العربية' }, { value: 'flag', label: 'Flag + Code' }] },
  ],
  itemCollections: [
    {
      key: "links",
      label: "Nav links",
      minItems: 1,
      maxItems: 6,
      newItemTemplate: () => ({ label: "Page", href: "#", active: false }),
      itemPropDefinitions: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "url", group: 'cta' },
        { key: "active", label: "Active (current page)", type: "switch" },
      ],
    },
  ],
  Component: SharedNavbarRenderer,
})
