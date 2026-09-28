"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Menu, Search } from "lucide-react";
import { useSidebarStore } from "@/stores";
import { CommandPalette } from "./command-palette.client";
import { resolveDashboardRoute } from "./dashboard-routes.lib";
import { LanguageToggle } from "./language-toggle.client";
import { ThemeToggle } from "./theme-toggle.client";

const ICON_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DashboardHeader() {
  const t = useTranslations("header");
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`${ICON_BUTTON} -ms-1 lg:hidden`}
        aria-label={t("openMenu")}
      >
        <Menu className="size-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {route.parent && route.parentHref && (
          <>
            <Link
              href={route.parentHref}
              className="hidden shrink-0 text-sm text-muted-foreground transition-colors hover:text-sidebar-foreground sm:inline"
            >
              {tNav(route.parent)}
            </Link>
            <ChevronRight
              aria-hidden="true"
              className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block rtl:rotate-180"
            />
          </>
        )}
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-sidebar-foreground">
          {tNav(route.title)}
        </h1>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="hidden h-9 w-64 shrink-0 items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/60 ps-3 pe-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex lg:w-80"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-start">{t("search")}</span>
        <kbd
          dir="ltr"
          className="rounded-md border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
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

      <LanguageToggle />
      <ThemeToggle />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
