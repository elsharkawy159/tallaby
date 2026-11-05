"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Megaphone, MessageCircle, ShoppingBag, Sparkles, Store, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { getSupportWhatsAppUrl } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/layout/language-switcher.client";
import { AUTH_LINK } from "./auth-ui";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tallaby.com";

const POINTS = [
  { key: "pointStore", icon: Store },
  { key: "pointAi", icon: Sparkles },
  { key: "pointShipping", icon: Truck },
  { key: "pointMarketing", icon: Megaphone },
] as const;

/**
 * Split auth layout (`.wrap`): the form column, then the brand panel, which is
 * hidden at 980px and below. `seller-shell` switches the design system on for
 * /login and /signup only.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations("auth");

  return (
    <div className="seller-shell grid min-h-dvh grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] overflow-x-clip bg-background text-(--s-body) max-[980px]:grid-cols-1">
      <main className="flex min-w-0 flex-col px-[clamp(20px,5vw,64px)] py-6 max-[480px]:px-[18px] max-[480px]:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/login" aria-label="Tallaby" className="flex h-10 items-center">
            <Image
              src="/logo-word.png"
              alt="Tallaby"
              width={120}
              height={30}
              priority
              className="h-[30px] w-auto dark:brightness-0 dark:invert"
            />
          </Link>
          <LanguageSwitcher className="h-10 w-auto gap-1.5 rounded-[10px] px-3 py-0 font-montserrat text-[13px] font-semibold text-(--s-muted) hover:bg-(--s-hover) hover:text-(--s-ink) [&_svg]:size-4" />
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-[22px] py-8 max-[480px]:gap-[18px] max-[480px]:py-5">
          {children}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 text-[12.5px] text-(--s-faint)">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <a
            href={getSupportWhatsAppUrl(t("helpMessage"))}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(AUTH_LINK, "inline-flex min-h-10 items-center gap-1.5")}
          >
            <MessageCircle className="size-[15px] text-(--s-whatsapp)" />
            {t("needHelp")}
          </a>
        </div>
      </main>

      <BrandPanel />
    </div>
  );
}

/** A dashboard sketch: labels and empty bars, so nothing on a public page looks like a real number. */
function DashboardSketch() {
  const t = useTranslations("auth.panel");
  const bar = "block h-3 rounded-full bg-(--s-fill)";
  return (
    <div
      aria-hidden
      className="flex max-w-[500px] -rotate-[1.5deg] flex-col gap-2.5 rounded-[22px] bg-background p-3.5 text-(--s-text) shadow-[0_30px_60px_rgb(0_0_0/0.25)] ltr:rotate-[1.5deg]"
    >
      <b className="text-sm text-(--s-ink)">{t("sketchTitle")}</b>
      <div className="grid grid-cols-3 gap-2">
        {(["sketchSales", "sketchOrders", "sketchVisits"] as const).map((key, i) => (
          <div key={key} className="flex flex-col gap-2 rounded-[14px] border border-(--s-line) bg-(--s-surface) p-2.5">
            <small className="text-[11px] text-(--s-subtle)">{t(key)}</small>
            <span className={bar} style={{ width: `${70 - i * 12}%` }} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5 rounded-[14px] border border-(--s-line) bg-(--s-surface) px-3 py-2.5 text-[12.5px]">
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink">
          <ShoppingBag className="size-4" />
        </span>
        <b className="flex-1 font-semibold">{t("sketchNewOrder")}</b>
        <span className={cn(bar, "w-14")} />
      </div>
    </div>
  );
}

function BrandPanel() {
  const t = useTranslations("auth.panel");

  return (
    <aside className="relative isolate flex flex-col justify-center gap-7 overflow-hidden bg-(--s-setup) px-[clamp(28px,4vw,64px)] py-12 text-white max-[980px]:hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-30%_-20%_auto_30%] -z-10 h-[90%] bg-[radial-gradient(closest-side,rgb(253_173_40/0.22),transparent)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[auto_40%_-30%_-20%] -z-10 h-[70%] bg-[radial-gradient(closest-side,rgb(44_110_128/0.6),transparent)]"
      />

      <span className="inline-flex w-max items-center gap-1.5 rounded-full border border-accent/25 bg-accent/12 px-3 py-[3px] text-[12.5px] font-bold text-accent before:size-1.5 before:rounded-full before:bg-current">
        {t("pill")}
      </span>
      <h2 className="max-w-[520px] text-[clamp(26px,3vw,38px)] leading-[1.35] font-bold text-balance text-white">
        {t.rich("title", {
          em: (chunks) => <em className="text-accent not-italic">{chunks}</em>,
        })}
      </h2>
      <p className="max-w-[480px] text-[15px] text-pretty text-white/80">{t("description")}</p>

      <DashboardSketch />

      <ul className="grid max-w-[520px] grid-cols-2 gap-x-[18px] gap-y-2.5">
        {POINTS.map(({ key, icon: Icon }) => (
          <li key={key} className="flex items-start gap-2.5 text-[13.5px] text-white/85">
            <Icon className="mt-[3px] size-[18px] shrink-0 text-accent" />
            {t(key)}
          </li>
        ))}
      </ul>

      <p className="max-w-[520px] border-t border-white/12 pt-5 text-[13.5px] text-white/80">
        {t.rich("help", {
          link: (chunks) => (
            <a
              href={getSupportWhatsAppUrl(t("helpMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </aside>
  );
}

/** Pill segmented control: "Sign in" is /login, "Create account" goes to /signup. */
export function AuthTabs({ active }: { active: "signin" | "signup" }) {
  const t = useTranslations("auth");
  const tab = (isOn: boolean) =>
    cn(
      "grid h-10 place-items-center rounded-full text-[13.5px] font-bold transition-colors duration-150",
      isOn ? "bg-(--s-solid) text-(--s-solid-fg)" : "text-(--s-muted) hover:text-(--s-ink)",
    );

  return (
    <div className="grid grid-cols-2 rounded-full border border-(--s-field) bg-(--s-surface) p-1">
      <Link href="/login" className={tab(active === "signin")} aria-current={active === "signin" ? "page" : undefined}>
        {t("tabSignIn")}
      </Link>
      <Link href="/signup" className={tab(active === "signup")} aria-current={active === "signup" ? "page" : undefined}>
        {t("tabCreateAccount")}
      </Link>
    </div>
  );
}

/** The terms line, linking to the tallaby.com legal pages (Arabic has no locale prefix there). */
export function AuthLegal() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const base = `https://${ROOT_DOMAIN}${locale === "en" ? "/en" : ""}`;
  const link = (path: string) =>
    function LegalLink(chunks: ReactNode) {
      return (
        <a href={`${base}/${path}`} target="_blank" rel="noopener noreferrer" className={AUTH_LINK}>
          {chunks}
        </a>
      );
    };
  return (
    <p className="text-center text-xs leading-[1.7] text-(--s-faint)">
      {t.rich("legal", { terms: link("terms"), privacy: link("privacy") })}
    </p>
  );
}
