/**
 * The phone bottom navigation (owner, 2026-10-27; docs/template-rules.md
 * §4.2): Home, Shop, Cart, Profile, each an icon with its name under it. On by
 * default for every site; the seller turns it off in the header's options
 * (`bottomNav`, `config/header.ts`). Hosts draw it after the footer (never in
 * the header tree, whose sticky slide would carry a fixed bar with it); it
 * only shows under 768px and leaves a spacer so nothing is covered.
 *
 * Server-safe (no hooks). `BottomNavRuntime` marks the current page and hides
 * the bar on checkout. The cart count comes from the host's `renderCartBadge`.
 */
import { House, ShoppingBag, Store, UserRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { chromeOptionOn } from "../config/header";
import type { SectionInstance } from "../config/schema";
import { sectionText, type SectionCopyKey } from "../core/copy";
import type { RenderContext } from "../core/types";

export const BOTTOM_NAV_ATTR = "data-sf-bottom-nav";

const ITEMS: readonly { href: string; label: SectionCopyKey; icon: LucideIcon }[] = [
  { href: "/", label: "home", icon: House },
  { href: "/products", label: "navShop", icon: Store },
  { href: "/cart", label: "navCart", icon: ShoppingBag },
  { href: "/profile", label: "navProfile", icon: UserRound },
];

/** Whether the site shows the bottom navigation on phones (its header's `bottomNav` option, on by default). */
export function bottomNavOn(header: SectionInstance | null | undefined): boolean {
  return chromeOptionOn(header, "header", "bottomNav");
}

/** 64px bar plus the phone's home-indicator area. */
const CSS = `
.sf-bnav,.sf-bnav-space{display:none}
@media (max-width:767px){
.sf-bnav-space{display:block;height:calc(64px + env(safe-area-inset-bottom))}
.sf-bnav-space:has(+.sf-bnav[hidden]){display:none}
.sf-bnav{display:flex;position:fixed;inset-inline:0;bottom:0;z-index:40;height:calc(64px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);background:color-mix(in oklab,var(--sf-paper) 92%,transparent);-webkit-backdrop-filter:saturate(1.4) blur(14px);backdrop-filter:saturate(1.4) blur(14px);border-top:1px solid var(--sf-line);color:var(--sf-muted);font-family:var(--sf-font-body)}
.sf-bnav[hidden]{display:none}
.sf-bnav a{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent;transition:color .2s}
.sf-bnav a:focus-visible{outline:2px solid var(--sf-brand);outline-offset:-4px;border-radius:12px}
.sf-bnav-ico{position:relative;display:inline-flex;align-items:center;justify-content:center;width:52px;height:30px;border-radius:999px;transition:background-color .2s,color .2s}
.sf-bnav-ico svg{width:22px;height:22px;stroke-width:1.75}
.sf-bnav-lbl{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:1;font-weight:500}
.sf-bnav a[aria-current="page"]{color:var(--sf-brand)}
.sf-bnav a[aria-current="page"] .sf-bnav-ico{background:color-mix(in oklab,var(--sf-brand) 14%,transparent)}
.sf-bnav a[aria-current="page"] .sf-bnav-lbl{font-weight:700}
.sf-bnav-badge{position:absolute;top:-2px;inset-inline-end:6px;display:flex}
.sf-bnav-badge:empty{display:none}
@media (prefers-reduced-motion:reduce){.sf-bnav a,.sf-bnav-ico{transition:none}}
}
`;

/**
 * The bar and its spacer, or nothing when the seller turned it off. `ctx`
 * needs only the locale, the host's Link and (optionally) its cart badge.
 */
export function SiteBottomNav({
  header,
  ctx,
}: {
  header: SectionInstance | null | undefined;
  ctx: Pick<RenderContext, "locale" | "Link" | "renderCartBadge">;
}): ReactNode {
  if (!bottomNavOn(header)) return null;
  const { Link, locale } = ctx;
  return (
    <>
      <style>{CSS}</style>
      <div className="sf-bnav-space" aria-hidden />
      <nav className="sf-bnav" aria-label={sectionText("bottomNav", locale)} {...{ [BOTTOM_NAV_ATTR]: "" }}>
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} data-part={`bottom-nav-${label}`}>
            <span className="sf-bnav-ico">
              <Icon aria-hidden />
              {href === "/cart" && ctx.renderCartBadge && <span className="sf-bnav-badge">{ctx.renderCartBadge()}</span>}
            </span>
            <span className="sf-bnav-lbl">{sectionText(label, locale)}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
