"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Ellipsis, Menu, Search, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/i18n/format";
import { useSidebarStore } from "@/stores";
import { CommandPalette } from "./command-palette.client";
import { resolveDashboardRoute } from "./dashboard-routes.lib";
import { InstallAppButton } from "./install-app-button.client";
import { LanguageToggle } from "./language-toggle.client";
import { NotificationBell } from "./notification-bell.client";
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
  const tCommon = useTranslations("common");
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const toolsId = useId();

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

  // The phone "⋯" tools menu closes on navigation, outside taps and Escape.
  useEffect(() => {
    setToolsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!toolsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setToolsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsOpen]);

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
              <span className="hidden shrink-0 text-[13px] text-muted-foreground sm:inline">{tNav(route.parent)}</span>
            )}
            <ChevronRight
              aria-hidden="true"
              className="hidden size-3.5 shrink-0 text-muted-foreground sm:block rtl:rotate-180"
            />
          </>
        )}
        <h1 className="truncate text-[15px] font-semibold text-sidebar-foreground">{tNav(route.title)}</h1>
      </div>

      {/* Desktop: title, search and actions share the width equally, so the search sits in the middle. */}
      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9.5 w-full max-w-[360px] items-center gap-2 rounded-[10px] border border-sidebar-border bg-sidebar-accent px-3 text-sm text-muted-foreground transition-colors hover:border-input hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-3 md:min-w-0 md:flex-1">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className={`${ICON_BUTTON} md:hidden`}
          aria-label={t("search")}
        >
          <Search className="size-[18px]" />
        </button>

        <NotificationBell className={ICON_BUTTON} />

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

        {/* Install, language and theme: inline from sm up; on phones they sit
            behind a "⋯" button so the page title keeps its width. One set of
            buttons serves both layouts, so the install prompt is caught once. */}
        <div ref={toolsRef} className="relative flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setToolsOpen((open) => !open)}
            className={`${ICON_BUTTON} sm:hidden`}
            aria-label={tCommon("actions")}
            aria-expanded={toolsOpen}
            aria-controls={toolsId}
          >
            <Ellipsis className="size-[18px]" />
          </button>
          <div
            id={toolsId}
            className={cn(
              "flex items-center gap-1 sm:gap-3",
              "max-sm:absolute max-sm:end-0 max-sm:top-full max-sm:mt-2 max-sm:rounded-xl max-sm:border max-sm:border-sidebar-border max-sm:bg-popover max-sm:p-1 max-sm:shadow-lg",
              !toolsOpen && "max-sm:hidden"
            )}
          >
            <InstallAppButton />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
