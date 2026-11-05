"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, ExternalLink, Menu, Plus, Search } from "lucide-react";
import { IconButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { formatWalletMoney, moneyDir } from "@/lib/i18n/format";
import { useSidebarStore } from "@/stores";
import { CommandPalette } from "./command-palette.client";
import { resolveDashboardRoute } from "./dashboard-routes.lib";
import { InstallAppButton } from "./install-app-button.client";
import { LanguageToggle } from "./language-toggle.client";
import { NotificationBell } from "./notification-bell.client";
import { ThemeToggle } from "./theme-toggle.client";

/**
 * The top bar (`.top`). It follows the design's widths: up to 1020px the host
 * pill and labels go, up to 720px the title goes, and at 600px and below the
 * language, theme and install buttons move into the sidebar drawer.
 */
export function DashboardHeader({
  walletBalance,
  walletCurrency,
  storeLink,
  siteLive,
}: {
  walletBalance: number | null;
  walletCurrency: string;
  storeLink: { url: string; host: string } | null;
  /** The selected store's site is published. */
  siteLive: boolean;
}) {
  const t = useTranslations("header");
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const route = resolveDashboardRoute(pathname);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // The shortcut hint depends on the OS; resolve after mount to keep SSR markup stable.
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const siteLabel = t(siteLive ? "siteLive" : "siteOffline");

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-2.5 border-b border-(--s-topbar-line) bg-(--s-topbar) px-7 backdrop-blur-[14px] backdrop-saturate-[1.4] max-[1020px]:px-4 max-[600px]:h-[60px] max-[600px]:gap-1.5 max-[600px]:px-2.5 print:hidden">
      <IconButton onClick={() => setMobileOpen(true)} aria-label={t("openMenu")} className="min-[1021px]:hidden">
        <Menu />
      </IconButton>

      <div className="flex min-w-0 items-center gap-2.5 whitespace-nowrap max-[720px]:hidden">
        {route.parent && (
          <span className="flex items-center gap-1.5 text-[13px] text-(--s-subtle) max-[1020px]:hidden">
            {route.parentHref ? (
              <Link href={route.parentHref} className="text-(--s-subtle) no-underline hover:text-(--s-ink)">
                {tNav(route.parent)}
              </Link>
            ) : (
              tNav(route.parent)
            )}
            <ChevronRight aria-hidden className="size-3.5 rtl:rotate-180" />
          </span>
        )}
        <b className="truncate text-[15px] font-bold text-(--s-ink)">{tNav(route.title)}</b>
        {storeLink && (
          <a
            href={storeLink.url}
            target="_blank"
            rel="noopener noreferrer"
            title={siteLabel}
            className="inline-flex items-center gap-[7px] rounded-full border border-(--s-field) bg-(--s-surface) px-2.5 py-1 font-montserrat text-xs font-medium text-(--s-subtle) no-underline transition-colors duration-150 hover:border-(--s-outline) hover:text-(--s-ink) max-[1020px]:hidden"
          >
            <span
              role="img"
              aria-label={siteLabel}
              className={cn(
                "relative size-2 shrink-0 rounded-full",
                siteLive
                  ? "sui-live-dot bg-[#16a34a] text-[#16a34a] shadow-[0_0_0_3px_rgb(22_163_74/0.15)]"
                  : "bg-[#dc2626] shadow-[0_0_0_3px_rgb(220_38_38/0.15)]",
              )}
            />
            <bdi dir="ltr" className="max-w-[220px] truncate">
              {storeLink.host}
            </bdi>
            <ExternalLink aria-hidden className="size-[13px] shrink-0" />
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label={t("searchHint")}
        className="mx-auto flex h-[42px] min-w-0 max-w-[420px] flex-[1_1_0] cursor-pointer items-center gap-2.5 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) pe-2 ps-3.5 text-[#8aa0a6] transition-[border-color,box-shadow] duration-150 hover:border-(--s-outline) max-[720px]:max-w-none max-[600px]:h-10 max-[600px]:px-3"
      >
        <Search aria-hidden className="size-[18px] shrink-0" />
        <span className="min-w-0 flex-1 truncate text-start text-[13.5px] max-[600px]:hidden">{t("searchHint")}</span>
        <kbd
          dir="ltr"
          className="whitespace-nowrap rounded-lg border border-(--s-field) bg-(--s-fill) px-2 py-0.5 font-montserrat text-[11px] font-semibold text-(--s-subtle) max-[720px]:hidden"
        >
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-1 max-[600px]:gap-0">
        {walletBalance != null && (
          <span
            className={cn(
              "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-(--s-field) bg-(--s-surface) pe-1.5 ps-3.5 text-[12.5px] text-(--s-muted) max-[600px]:h-9 max-[600px]:pe-1 max-[600px]:ps-2.5",
              pathname === "/wallet" && "border-(--s-primary)",
            )}
          >
            <Link
              href="/wallet"
              title={t("walletBalance", { amount: formatWalletMoney(walletBalance, walletCurrency, locale) })}
              className="inline-flex items-center gap-2 text-(--s-muted) no-underline hover:text-(--s-ink)"
            >
              <span className="max-[1020px]:hidden">{t("walletLabel")}</span>
              <bdi dir={moneyDir(locale, { currency: walletCurrency })} className={cn("font-montserrat text-[13px] font-bold text-(--s-ink) tabular-nums", walletBalance < 0 && "text-destructive")}>
                {formatWalletMoney(walletBalance, walletCurrency, locale)}
              </bdi>
            </Link>
            <Link
              href="/wallet?topup=1"
              aria-label={t("topUp")}
              title={t("topUp")}
              className="relative grid size-7 place-items-center rounded-full bg-(--s-hover) text-(--s-link) transition-colors duration-150 after:absolute after:-inset-1.5 hover:bg-primary hover:text-primary-foreground"
            >
              <Plus aria-hidden className="size-[15px]" />
            </Link>
          </span>
        )}

        <NotificationBell />

        <div className="flex items-center gap-1 max-[600px]:hidden">
          <InstallAppButton />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
