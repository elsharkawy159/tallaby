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

/** Sticky dark-teal header with the mobile menu below it. */
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

  // Close the menu on navigation.
  React.useEffect(() => setMenuOpen(false), [pathname]);

  const links = NAV_ITEMS.map((item) => (
    <Link
      key={item.key}
      href={item.href}
      aria-current={active === item.key ? "page" : undefined}
      onClick={() => setMenuOpen(false)}
      className="rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap text-[#c9d9dd] hover:bg-white/5 hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
    >
      {t(item.key)}
    </Link>
  ));

  return (
    <header
      data-print="hide"
      className={cn(
        "sticky top-0 z-50 bg-teal-900 transition-shadow duration-200",
        scrolled && "shadow-[0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.18)]",
      )}
    >
      <Container className="flex h-[68px] items-center gap-7">
        <Link href="/" aria-label="Tallaby" className="shrink-0">
          <Image src="/logo-white.png" alt="طلبي" width={110} height={28} priority className="h-7 w-auto" />
        </Link>
        <nav aria-label={t("main")} className="hidden flex-1 gap-1 xl:flex">
          {links}
        </nav>
        <div className="ms-auto flex items-center gap-2 xl:ms-0">
          <LocaleSwitch />
          <a href={LOGIN_URL} className="hidden rounded-lg px-2.5 py-2 text-sm font-semibold text-[#c9d9dd] hover:text-white sm:block">
            {t("login")}
          </a>
          <SignupTrigger size="sm" className="hidden sm:inline-flex">
            {t("cta")}
          </SignupTrigger>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={t("menu")}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-11 place-items-center rounded-[10px] text-white xl:hidden"
          >
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </Container>
      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label={t("menu")}
          className="grid gap-1 border-t border-white/10 bg-teal-900 px-6 pt-3 pb-5 xl:hidden [&>a]:border-b [&>a]:border-white/5 [&>a]:px-1 [&>a]:py-3 [&>a]:font-semibold [&>a]:text-[#dfe9ec]"
        >
          {links}
          <a href={LOGIN_URL}>{t("login")}</a>
          <SignupTrigger className="mt-3" onClick={() => setMenuOpen(false)}>
            {t("cta")}
          </SignupTrigger>
        </nav>
      ) : null}
    </header>
  );
}
