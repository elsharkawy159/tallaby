"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BarChart3, MessageSquare, Package, Send, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { getSupportWhatsAppUrl } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/layout/language-switcher.client";

const PANEL_BACKGROUND =
  "https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80";

const FEATURES = [
  { key: "storefront", icon: Store },
  { key: "orders", icon: Package },
  { key: "insights", icon: BarChart3 },
  { key: "marketing", icon: Send },
] as const;

/** Split auth layout: form column on the start side, brand panel on the end side (hidden below lg). */
export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations("auth");

  return (
    <div className="grid min-h-screen bg-white text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] dark:bg-background">
      <main className="flex flex-col p-5 lg:px-8 lg:py-7 xl:px-12 xl:py-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/login" aria-label="Tallaby">
            <Image
              src="/logo-word.png"
              alt="Tallaby"
              width={134}
              height={34}
              priority
              className="h-[34px] w-auto"
            />
          </Link>
          <LanguageSwitcher className="w-auto gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] [&_svg]:size-4" />
        </div>

        <div className="flex flex-1 items-center justify-center py-8 lg:py-10">
          <div className="flex w-full max-w-[420px] flex-col gap-[22px]">
            {children}
          </div>
        </div>

        <div className="flex justify-between gap-3 text-[12.5px] text-muted-foreground">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <a
            href={getSupportWhatsAppUrl(t("helpMessage"))}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-foreground"
          >
            {t("needHelp")}
          </a>
        </div>
      </main>

      <BrandPanel />
    </div>
  );
}

function BrandPanel() {
  const t = useTranslations("auth.panel");

  return (
    <aside className="relative isolate m-3 hidden flex-col justify-between overflow-hidden rounded-3xl bg-[#145163] px-10 pt-11 pb-10 text-white lg:flex xl:px-14 xl:pt-14 xl:pb-12">
      <Image
        src={PANEL_BACKGROUND}
        alt=""
        fill
        sizes="50vw"
        className="-z-10 object-cover opacity-[0.14] mix-blend-luminosity"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#145163]/20 to-[#0d3743]/85" />

      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 ps-2 pe-3.5 text-[13px] font-semibold whitespace-nowrap">
          <i className="ms-1 size-2 rounded-full bg-accent" />
          {t("pill")}
        </div>
        <h2 className="mt-[22px] mb-3.5 max-w-[520px] text-[32px] leading-[1.15] font-bold tracking-[-0.015em] text-balance rtl:tracking-normal text-white xl:text-[40px]">
          {t.rich("title", {
            em: (chunks) => <em className="text-[#ffb43d] not-italic">{chunks}</em>,
          })}
        </h2>
        <p className="max-w-[480px] text-base leading-[1.65] text-pretty text-[#cfdde1]">
          {t("description")}
        </p>

        <ul className="mt-10 grid max-w-[600px] gap-3.5 xl:grid-cols-2">
          {FEATURES.map(({ key, icon: Icon }) => (
            <li
              key={key}
              className="grid grid-cols-[38px_minmax(0,1fr)] gap-x-3.5 gap-y-0.5 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm xl:flex xl:flex-col xl:gap-2.5 xl:p-[18px]"
            >
              <div className="row-span-2 grid size-[38px] place-items-center rounded-[10px] bg-accent text-[#171717]">
                <Icon className="size-5" />
              </div>
              <b className="text-[15px] font-semibold">{t(`${key}Title`)}</b>
              <span className="text-[13.5px] leading-[1.55] text-[#cfdde1]">
                {t(`${key}Text`)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex items-center gap-3.5 border-t border-white/15 pt-6 text-sm text-[#cfdde1]">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white">
          <MessageSquare className="size-[18px]" />
        </div>
        <span>
          {t.rich("help", {
            link: (chunks) => (
              <a
                href={getSupportWhatsAppUrl(t("helpMessage"))}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline"
              >
                {chunks}
              </a>
            ),
          })}
        </span>
      </div>
    </aside>
  );
}

/** Pill segmented control: "Sign in" is this page, "Create account" goes to /signup. */
export function AuthTabs({ active }: { active: "signin" | "signup" }) {
  const t = useTranslations("auth");
  const tab = (isOn: boolean) =>
    cn(
      "grid h-10 place-items-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/30",
      isOn
        ? "bg-white text-primary shadow-sm dark:bg-card"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="grid grid-cols-2 rounded-full bg-[#f0f0f0] p-1 dark:bg-muted">
      <Link href="/login" className={tab(active === "signin")} aria-current={active === "signin" ? "page" : undefined}>
        {t("tabSignIn")}
      </Link>
      <Link href="/signup" className={tab(active === "signup")} aria-current={active === "signup" ? "page" : undefined}>
        {t("tabCreateAccount")}
      </Link>
    </div>
  );
}
