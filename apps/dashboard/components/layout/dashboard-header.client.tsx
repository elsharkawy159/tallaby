"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Plus } from "lucide-react";
import { IconButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { formatWalletMoney, moneyDir } from "@/lib/i18n/format";
import { useSidebarStore } from "@/stores/sidebar.store";
import type { SetupNextStep } from "@/app/[locale]/(main)/_components/setup-next-step.lib";
import { CommandPalette } from "./command-palette.client";
import { OPEN_COMMAND_PALETTE_EVENT } from "./command-palette.lib";
import { HeaderNextStep } from "./header-next-step.client";
import { InstallAppButton } from "./install-app-button.client";
import { LanguageToggle } from "./language-toggle.client";
import { NotificationBell } from "./notification-bell.client";
import { ThemeToggle } from "./theme-toggle.client";

/**
 * The top bar (`.top`). It follows the design's widths: up to 1020px the
 * labels go, and at 600px and below the language, theme and install buttons
 * move into the sidebar drawer. No page title or breadcrumb (owner, 2026-11-27).
 */
export function DashboardHeader({
  walletBalance,
  walletCurrency,
  storeLink,
  storeId,
  setupNextStep,
  userId,
}: {
  walletBalance: number | null;
  walletCurrency: string;
  storeLink: { url: string; host: string; href: string } | null;
  /** The selected store (navigation only): where the palette's Products links go (F-87c). */
  storeId: string | null;
  /** The selected store's next home setup step, or done (setup-next-step.lib.ts). */
  setupNextStep: SetupNextStep | null;
  /** The signed-in seller (getSessionUser), for the bell's realtime topic only. */
  userId: string | null;
}) {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // The search button is hidden for now (owner, 2026-11-18), so its OS shortcut hint is too; Ctrl/⌘K still works.
  // The shortcut hint depends on the OS; resolve after mount to keep SSR markup stable.
  // const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    // The mobile bottom nav's Search opens this same palette.
    const onOpenPalette = () => setPaletteOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenPalette);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenPalette);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[68px] items-center gap-2.5 border-b border-(--s-topbar-line) bg-(--s-topbar) px-7 backdrop-blur-[14px] backdrop-saturate-[1.4] transition-[background-color,border-color] duration-200 max-[1020px]:px-4 max-[600px]:h-[60px] max-[600px]:gap-1.5 max-[600px]:px-2.5 print:hidden",
        // Desktop: sticks 8px down, inside the viewport frame (MainContentWrapper), and is 60px tall so it still ends at 68px, where the pages' sticky bars start.
        "min-[1021px]:top-1 min-[1021px]:h-[60px]",
        // Desktop: clear at the top of the page, its usual glass once the page scrolls (owner, 2026-11-27).
        !scrolled && "min-[1021px]:border-transparent min-[1021px]:bg-transparent min-[1021px]:backdrop-blur-none",
      )}
    >
      <IconButton onClick={() => setMobileOpen(true)} aria-label={t("openMenu")} className="min-[1021px]:hidden">
        <Menu />
      </IconButton>

      {/* The next setup step (owner, 2026-11-18; "Visit store" is the sidebar's eye since 2026-11-27). Always rendered: it keeps the actions at the end. */}
      <div className="mx-auto flex min-w-0 flex-[1_1_0] justify-center max-[720px]:justify-start">
        <HeaderNextStep key={storeId ?? "none"} initial={setupNextStep} storeHref={storeLink?.href ?? null} />
      </div>

      {/* Search hidden for now (owner, 2026-11-18): Ctrl/⌘K and the bottom nav's Search still open the palette.
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
      */}

      <div className="flex shrink-0 items-center gap-1">
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
              className="inline-flex items-center gap-2 self-stretch text-(--s-muted) no-underline hover:text-(--s-ink)"
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

        <NotificationBell userId={userId} />

        <div className="flex items-center gap-1 max-[600px]:hidden">
          <InstallAppButton />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} storeId={storeId} />
    </header>
  );
}
