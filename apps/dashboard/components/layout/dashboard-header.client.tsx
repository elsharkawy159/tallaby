"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Menu, Search, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/i18n/format";
import { useSidebarStore } from "@/stores";
import { CommandPalette } from "./command-palette.client";
import { resolveDashboardRoute } from "./dashboard-routes.lib";
import { InstallAppButton } from "./install-app-button.client";
import { LanguageToggle } from "./language-toggle.client";
import { ThemeToggle } from "./theme-toggle.client";

const ICON_BUTTON =
  "flex size-9.5 shrink-0 items-center justify-center rounded-[10px] border border-transparent text-muted-foreground transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function DashboardHeader({ walletBalance }: { walletBalance: number | null }) {
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

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-1 border-b border-sidebar-border bg-sidebar/90 px-3 text-sidebar-foreground backdrop-blur-md sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`${ICON_BUTTON} -ms-1 lg:hidden`}
        aria-label={t("openMenu")}
      >
        <Menu className="size-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {route.parent && (
          <>
            {route.parentHref ? (
              <Link
                href={route.parentHref}
                className="hidden shrink-0 text-[13px] text-muted-foreground transition-colors hover:text-sidebar-foreground sm:inline"
              >
                {tNav(route.parent)}
              </Link>
            ) : (
              <span className="hidden shrink-0 text-[13px] text-muted-foreground sm:inline">
                {tNav(route.parent)}
              </span>
            )}
            <ChevronRight
              aria-hidden="true"
              className="hidden size-3.5 shrink-0 text-muted-foreground sm:block rtl:rotate-180"
            />
          </>
        )}
        <h1 className="truncate text-[15px] font-semibold text-sidebar-foreground">
          {tNav(route.title)}
        </h1>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="hidden h-9.5 w-[280px] max-w-[40vw] shrink-0 items-center gap-2 rounded-[10px] border border-sidebar-border bg-sidebar-accent px-3 text-sm text-muted-foreground transition-colors hover:border-input hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:flex"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-start">{t("search")}</span>
        <kbd
          dir="ltr"
          className="rounded-[5px] border border-input px-1.5 font-mono text-[11px] text-muted-foreground"
        >
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className={`${ICON_BUTTON} md:hidden`}
        aria-label={t("search")}
      >
        <Search className="size-[18px]" />
      </button>

      {walletBalance != null && (
        <Link
          href="/wallet"
          title={t("walletBalance", { amount: formatMoney(walletBalance, locale) })}
          aria-current={pathname === "/wallet" ? "page" : undefined}
          className={cn(
            "flex h-9.5 shrink-0 items-center gap-2 rounded-[10px] border border-sidebar-border bg-sidebar-accent px-2.5 text-[13px] transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            pathname === "/wallet" && "border-primary/40 bg-primary-soft text-primary-ink",
          )}
        >
          <Wallet className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="hidden text-muted-foreground lg:inline">{t("walletLabel")}</span>
          <bdi dir="ltr" className={cn("font-semibold tabular-nums", walletBalance < 0 && "text-destructive")}>
            {formatMoney(walletBalance, locale)}
          </bdi>
        </Link>
      )}

      <InstallAppButton />
      <LanguageToggle />
      <ThemeToggle />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
