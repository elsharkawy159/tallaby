/** Renderer + section library. React; safe for server components (no hooks). */
export * from "./render";
export * from "../core/types";
export * from "../core/demo-product";
export * from "../core/registry";
export * from "../core/slots";
export * from "../core/locale";
export * from "../core/theme";
export * from "../core/fonts";
export * from "../core/copy";
export * from "../core/links";
export * from "../sections";
export * from "../elements/style";
export * from "../elements/registry";
export * from "../elements/tree";
export * from "../elements/presets";
export * from "../social/platforms";
export * from "../social/icon";
export * from "../elements/shell";
export * from "../elements/motion";
export { scrollEffectTargets, type ScrollTargets } from "../elements/scroll-plan";
export * from "../library";
export { DATA_ACTION_CLASS, DataEmpty, EmptySection } from "../sections/_data";
export { MOBILE_MENU_BUTTON_CLASS } from "../elements/render";
export {
  BOTTOM_NAV_ATTR,
  BOTTOM_NAV_FIXED_LABELS,
  BOTTOM_NAV_ICON_COMPONENTS,
  SiteBottomNav,
  bottomNavOn,
  drawnBottomNavItems,
  type BottomNavPage,
} from "./bottom-nav";
export * from "../config/bottom-nav";
export * from "../config/mobile-menu";
export * from "../core/catalog-resolve";
export * from "../designs";
export * from "../elements/data";
export * from "../elements/video";
export {
  CHROME_OPTIONS,
  LANGUAGE_SWITCHER_PROP,
  chromeHasThemeToggle,
  footerCreditsTallaby,
  chromeOptionOn,
  drawChrome,
  flushHeaderOnMobile,
  languageSwitcherOn,
  mobileMenuRows,
  setChromeOption,
  withLanguageSwitcher,
  type ChromeOption,
  type ChromePart,
} from "../config/header";
