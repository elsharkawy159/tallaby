"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Package, Palette, SquareArrowOutUpRight, Truck, type LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { HomeStepKey } from "@/app/[locale]/(main)/_components/setup-checklist.lib";
import { SETUP_PROMPT_CHECK_EVENT } from "@/app/[locale]/(main)/_components/setup-prompts.lib";
import {
  headerSetupAction,
  parseSetupNextStep,
  type SetupNextStep,
} from "@/app/[locale]/(main)/_components/setup-next-step.lib";

/** The wallet balance pill's shape beside it (dashboard-header.client.tsx): height, border, radius, type, padding. */
const PILL =
  "inline-flex h-10 min-w-0 shrink items-center gap-2.5 whitespace-nowrap rounded-full border border-(--s-field) px-3.5 text-[12.5px] font-semibold no-underline transition-colors duration-150 hover:border-(--s-outline) max-[600px]:h-9 max-[600px]:gap-2 max-[600px]:px-2.5 [&_svg]:size-[15px] [&_svg]:shrink-0";

/** Same icons as the home setup cards (HOME_STEP_ICONS, a server file). */
const STEP_ICONS: Record<HomeStepKey, LucideIcon> = {
  product: Package,
  design: Palette,
  payments: CreditCard,
  shipping: Truck,
};

/**
 * The header slot where the search was (owner, 2026-11-18): the next home
 * setup step while setup is open, then "Visit store". The layout renders it
 * with the current value; it asks /api/setup-next-step again after each page
 * change and on a setup action (requestSetupPromptCheck), so a finished step
 * moves it on without a reload.
 */
export function HeaderNextStep({
  initial,
  storeHref,
  siteLive,
}: {
  initial: SetupNextStep | null;
  storeHref: string | null;
  /** The selected store's site is published: the "Visit store" dot is green, else red. */
  siteLive: boolean;
}) {
  const t = useTranslations("header");
  const tSteps = useTranslations("home.setup.tasks");
  const pathname = usePathname();
  // A layout re-render (store switch, refresh) brings a fresh server value: take it.
  const [state, setState] = useState({ initial, next: initial });
  if (state.initial !== initial) setState({ initial, next: initial });
  const latestRequest = useRef(0);
  const firstPath = useRef(pathname);

  useEffect(() => {
    const check = () => {
      const request = ++latestRequest.current;
      fetch("/api/setup-next-step", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : undefined))
        .then((body: unknown) => {
          if (body === undefined || request !== latestRequest.current) return;
          const next = parseSetupNextStep(body);
          setState((current) => ({ ...current, next }));
        })
        .catch(() => {
          // Offline or a hiccup: keep what is shown; the next page change asks again.
        });
    };
    // The layout's value is fresh on the first page; ask again only after a move.
    if (pathname !== firstPath.current) {
      firstPath.current = pathname;
      check();
    }
    window.addEventListener(SETUP_PROMPT_CHECK_EVENT, check);
    return () => window.removeEventListener(SETUP_PROMPT_CHECK_EVENT, check);
  }, [pathname]);

  const action = headerSetupAction(state.next, storeHref);
  if (!action) return null;

  if (action.kind === "visit") {
    const siteLabel = t(siteLive ? "siteLive" : "siteOffline");
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        title={`${siteLabel} · ${t("visitStoreHint")}`}
        className={cn(PILL, "bg-(--s-surface) text-(--s-muted) hover:text-(--s-ink)")}
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
        <span className="truncate">{t("visitStore")}</span>
        <SquareArrowOutUpRight aria-hidden />
      </a>
    );
  }

  const Icon = STEP_ICONS[action.key];
  const stepTitle = tSteps(`${action.key}.title`);
  const label = t("nextStep", { step: stepTitle });
  // Mobile (owner, 2026-11-26): the pill names the step itself, and a tiny
  // "Next step" badge sits centred on its top border.
  return (
    <Link
      href={action.href}
      aria-label={label}
      title={label}
      className={cn(PILL, "relative bg-primary-soft text-primary-ink")}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-1.5 py-px text-[9px] leading-[1.35] font-bold whitespace-nowrap text-primary-foreground min-[601px]:hidden"
      >
        {t("nextStepShort")}
      </span>
      <Icon aria-hidden />
      <span className="truncate max-[600px]:hidden">{label}</span>
      <span className="truncate min-[601px]:hidden">{stepTitle}</span>
    </Link>
  );
}
