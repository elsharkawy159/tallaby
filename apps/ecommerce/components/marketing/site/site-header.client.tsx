"use client";

import * as React from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { LOGIN_URL } from "@/lib/marketing/site.lib";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { Container } from "./layout-primitives";
import { LocaleSwitch } from "./locale-switch.client";
import { NAV_ITEMS, activeNavKey } from "./nav.lib";

const MENU_ID = "site-mobile-menu";

/**
 * Sticky light header: transparent at the top, frosted once the page scrolls.
 * Below 1080px the links drop down from the burger.
 */
export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const active = activeNavKey(pathname);
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation, and with Escape.
  React.useEffect(() => setMenuOpen(false), [pathname]);
  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      data-print="hide"
      className={cn(
        "sticky top-0 z-[60] border-b border-transparent transition-[background-color,border-color] duration-200",
        scrolled && "border-b-teal-700/10 bg-surface-nav backdrop-blur-[14px] backdrop-saturate-[1.4]",
        menuOpen && "bg-white",
      )}
    >
      <Container className="flex h-[68px] items-center gap-7">
        <Link href="/" aria-label="Tallaby" className="shrink-0">
          <Image src="/logo-primary.png" alt="طلبي" width={118} height={30} priority className="block h-[30px] w-auto" />
        </Link>
        <nav aria-label={t("main")} className="hidden flex-1 gap-0.5 min-[1081px]:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className="rounded-[10px] px-3 py-2 text-[14.5px] font-semibold whitespace-nowrap text-ink-600 hover:bg-teal-50 hover:text-teal-900 hover:no-underline aria-[current=page]:bg-teal-50 aria-[current=page]:text-teal-900"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5">
          <LocaleSwitch />
          <a
            href={LOGIN_URL}
            className="hidden h-[42px] items-center rounded-[10px] px-3 text-sm font-semibold whitespace-nowrap text-ink-600 hover:bg-teal-50 hover:text-teal-900 hover:no-underline min-[1081px]:inline-flex"
          >
            {t("login")}
          </a>
          <SignupTrigger size="sm" className="hidden min-[1081px]:inline-flex">
            {t("cta")}
          </SignupTrigger>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            aria-label={menuOpen ? t("closeMenu") : t("menu")}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-11 place-items-center rounded-xl text-teal-900 min-[1081px]:hidden"
          >
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </Container>
      <nav
        id={MENU_ID}
        aria-label={t("mobile")}
        hidden={!menuOpen}
        className="border-t border-line-soft bg-white px-5 pt-2 pb-[18px] min-[1081px]:hidden"
      >
        <div className="grid [&>a]:border-b [&>a]:border-[#f1f4f5] [&>a]:px-1 [&>a]:py-3.5 [&>a]:font-semibold [&>a]:text-teal-900 [&>a]:hover:no-underline">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              {t(item.key)}
            </Link>
          ))}
          <a href={LOGIN_URL}>{t("login")}</a>
        </div>
        <SignupTrigger className="mt-3.5 w-full" onClick={() => setMenuOpen(false)}>
          {t("ctaMobile")}
        </SignupTrigger>
      </nav>
    </header>
  );
}
