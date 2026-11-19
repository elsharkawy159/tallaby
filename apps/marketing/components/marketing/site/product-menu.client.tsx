"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { PRODUCT_AREAS, PRODUCT_MENU } from "@/lib/marketing/product-pages.lib";
import { Container } from "./layout-primitives";

const PANEL_ID = "site-product-menu";
const CLOSE_DELAY_MS = 140;

/** Every href in the menu, so the trigger shows as current on those pages. */
const MENU_HREFS = PRODUCT_AREAS.flatMap((area) => PRODUCT_MENU[area].map((item) => item.href));

export function isProductMenuPath(pathname: string): boolean {
  return pathname === "/features" || MENU_HREFS.includes(pathname);
}

/**
 * The header's "Features" item from 1081px: a disclosure button that opens a
 * full-width panel with the four groups (Build, Run, Marketing, Get paid).
 * Opens on click and, with a mouse, on hover; closes on Escape, outside click,
 * pointer leave and navigation.
 */
export function ProductMenuDesktop({ label, className }: { label: string; className?: string }) {
  const t = useTranslations("nav.productMenu");
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeTimer = React.useRef<number | undefined>(undefined);
  const current = isProductMenuPath(pathname);

  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const enter = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const leave = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <div ref={rootRef} className={className} onPointerEnter={enter} onPointerLeave={leave}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        data-current={current || undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 rounded-[10px] px-3 py-2 text-[14.5px] font-semibold whitespace-nowrap text-ink-600 hover:bg-teal-50 hover:text-teal-900 aria-expanded:bg-teal-50 aria-expanded:text-teal-900 data-current:bg-teal-50 data-current:text-teal-900"
      >
        {label}
        <ChevronDown className={cn("size-4 transition-transform duration-150 motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </button>
      <div id={PANEL_ID} hidden={!open} className="absolute inset-x-0 top-full border-t border-line-soft bg-white shadow-[0_24px_48px_rgba(13,55,67,0.12)]">
        <Container className="py-7">
          <div role="group" aria-label={t("label")} className="grid grid-cols-4 gap-6">
            {PRODUCT_AREAS.map((area) => (
              <div key={area} className="min-w-0">
                <p className="text-[15px] font-bold text-teal-900">{t(`areas.${area}.title`)}</p>
                <p className="mt-0.5 mb-3 text-[13px] text-ink-500">{t(`areas.${area}.body`)}</p>
                <ul className="grid gap-0.5">
                  {PRODUCT_MENU[area].map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className="group grid grid-cols-[32px_minmax(0,1fr)] items-start gap-2.5 rounded-xl p-2 hover:bg-teal-50 hover:no-underline aria-[current=page]:bg-teal-50"
                      >
                        <span className="grid size-8 place-items-center rounded-[10px] bg-teal-50 text-teal-700 group-hover:bg-white">
                          <item.icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <b className="block text-[14px] leading-snug text-teal-900">{t(`items.${item.id}.title`)}</b>
                          <span className="block text-[12.5px] leading-snug text-ink-500">{t(`items.${item.id}.body`)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-line-soft pt-4 text-[13.5px]">
            <span className="text-ink-500">{t("allFeaturesBody")}</span>
            <Link href="/features" className="font-bold text-teal-700 hover:text-teal-900">
              {t("allFeatures")}
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
}

/** The same groups inside the phone menu, as one disclosure. */
export function ProductMenuMobile({ label, onNavigate }: { label: string; onNavigate: () => void }) {
  const t = useTranslations("nav.productMenu");
  const pathname = usePathname();
  return (
    <details className="group border-b border-[#f1f4f5]" open={isProductMenuPath(pathname) || undefined}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-3.5 font-semibold text-teal-900 [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div className="grid gap-4 pb-4 ps-1">
        {PRODUCT_AREAS.map((area) => (
          <div key={area}>
            <p className="mb-1 text-[12.5px] font-bold text-ink-500">{t(`areas.${area}.title`)}</p>
            <ul className="grid grid-cols-2 gap-x-3">
              {PRODUCT_MENU[area].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={onNavigate}
                    className="flex min-h-10 items-center gap-2 text-[14px] text-teal-900 hover:no-underline aria-[current=page]:font-bold"
                  >
                    <item.icon className="size-4 flex-none text-teal-700" aria-hidden />
                    <span className="min-w-0">{t(`items.${item.id}.title`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Link href="/features" onClick={onNavigate} className="text-[14px] font-bold text-teal-700">
          {t("allFeatures")}
        </Link>
      </div>
    </details>
  );
}
