"use client";

import { useMemo } from "react";
import { LayoutDashboard, Package, Search, ShoppingBag, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  activeBottomNavKey,
  bottomNavEntries,
  bottomNavHiddenOn,
  bottomNavLinks,
  type BottomNavKey,
} from "./bottom-nav.lib";
import { openCommandPalette } from "./command-palette.lib";

/** The sidebar's icons for the same pages. */
const ICONS: Record<BottomNavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: Package,
  ordersGroup: ShoppingBag,
};

const ITEM =
  "group flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-semibold leading-tight text-(--s-subtle) no-underline transition-colors duration-150 hover:text-(--s-ink) focus-visible:outline-offset-0";
const ICON_WRAP = "grid h-7 w-12 place-items-center rounded-full transition-colors duration-150";

/**
 * Mobile bottom nav (owner, 2026-11-18): Home, Products, Orders and Search in a
 * floating rounded bar, up to the width where the sidebar becomes a drawer
 * (1020px). Always shown while scrolling (owner, 2026-11-18). Hidden on pages
 * with their own bottom bar (`bottomNavHiddenOn`) and, in CSS, while a save or
 * bulk bar is open.
 */
export function BottomNav({ storeId }: { storeId: string | null }) {
  const t = useTranslations();
  const pathname = usePathname();
  const entries = useMemo(() => bottomNavEntries(storeId), [storeId]);
  const links = useMemo(() => bottomNavLinks(entries), [entries]);
  const active = activeBottomNavKey(entries, links, pathname);
  if (bottomNavHiddenOn(pathname)) return null;

  return (
    <nav
      data-bottom-nav
      aria-label={t("bottomNav.label")}
      className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-30 mx-auto max-w-[440px] rounded-[24px] border border-(--s-line) bg-(--s-glass-nav) p-1.5 shadow-(--s-shadow-menu) backdrop-blur-[14px] backdrop-saturate-[1.4] min-[1021px]:hidden print:hidden"
    >
      <ul className="m-0 grid list-none grid-cols-4 gap-1 p-0">
        {links.map(({ key, href }) => {
          const Icon = ICONS[key];
          const isActive = key === active;
          return (
            <li key={key} className="min-w-0">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(ITEM, isActive && "text-(--s-primary) hover:text-(--s-primary)")}
              >
                <span className={cn(ICON_WRAP, isActive ? "bg-(--s-hover)" : "group-hover:bg-(--s-fill)")}>
                  <Icon aria-hidden className="size-5" strokeWidth={isActive ? 2.25 : 1.9} />
                </span>
                <span className="max-w-full truncate">{t(key === "dashboard" ? "bottomNav.home" : `nav.${key}`)}</span>
              </Link>
            </li>
          );
        })}
        <li className="min-w-0">
          <button type="button" onClick={openCommandPalette} className={cn(ITEM, "w-full cursor-pointer border-0 bg-transparent")}>
            <span className={cn(ICON_WRAP, "group-hover:bg-(--s-fill)")}>
              <Search aria-hidden className="size-5" strokeWidth={1.9} />
            </span>
            <span className="max-w-full truncate">{t("bottomNav.search")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
