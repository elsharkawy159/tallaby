import * as React from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { DashFrame, MockCard, MockCardHead, MockPill, MockToggle } from "@/components/marketing/pages/dash-mock";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import type { ProductVisual } from "@/lib/marketing/product-pages.lib";

/**
 * Pictures for the product pages (product-page.tsx). A `dash` picture is a
 * coded dashboard screen whose every word comes from the page's messages: names
 * and numbers are made up, and each card matches a real dashboard screen
 * (checked in apps/dashboard). `screens` and `phone` use the real template
 * card screenshots in public/template-previews. All are aria-hidden: the copy
 * beside them says the same thing.
 */

export type MockRowWords = {
  label: string;
  value?: string;
  pill?: string;
  tone?: "green" | "amber" | "gray";
  toggle?: "on" | "off";
  /** 0 to 100: a bar under the label (reports). */
  bar?: number;
};
export type MockCardWords = { title: string; hint?: string; rows: MockRowWords[] };
export type MockWords = { title: string; path: string; cards: MockCardWords[] };

function MockRow({ row }: { row: MockRowWords }) {
  return (
    <div className="grid gap-1 rounded-[9px] bg-[#f7faf9] px-2.5 py-[7px]">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 truncate font-semibold text-[#171717]">{row.label}</span>
        <span className="flex flex-none items-center gap-2">
          {row.value ? <bdi className="font-latin text-[11.5px] font-semibold text-[#55605f] tabular-nums">{row.value}</bdi> : null}
          {row.pill ? <MockPill tone={row.tone}>{row.pill}</MockPill> : null}
          {row.toggle ? <MockToggle off={row.toggle === "off"} /> : null}
        </span>
      </div>
      {row.bar !== undefined ? (
        <span className="block h-1.5 overflow-hidden rounded-full bg-[#e5eced]">
          <i className="block h-full rounded-full bg-teal-700" style={{ width: `${Math.max(4, Math.min(100, row.bar))}%` }} />
        </span>
      ) : null}
    </div>
  );
}

function MockCards({ cards }: { cards: MockCardWords[] }) {
  return (
    <>
      {cards.map((card) => (
        <MockCard key={card.title}>
          <MockCardHead title={card.title} hint={card.hint} />
          <div className="grid gap-1.5">
            {card.rows.map((row) => (
              <MockRow key={row.label} row={row} />
            ))}
          </div>
        </MockCard>
      ))}
    </>
  );
}

/** The hero: the dashboard frame around the page's screen. */
export async function DashShot({ words, active }: { words: MockWords; active: string }) {
  return (
    <DashFrame active={active} title={words.title}>
      <div>
        <b className="block text-base text-[#171717]">{words.title}</b>
        <small className="text-[11.5px] text-[#808080]">{words.path}</small>
      </div>
      <MockCards cards={words.cards} />
    </DashFrame>
  );
}

/** A section's picture: the same cards on a quiet panel, without the frame. */
export function DashPanel({ words }: { words: MockWords }) {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-card border border-[#e3ebed] bg-[#f4f6f6] p-3.5 text-start sm:p-5">
      <small className="text-[11.5px] font-semibold text-[#808080]">{words.path}</small>
      <MockCards cards={words.cards} />
    </div>
  );
}

const preview = (key: string, locale: string, mobile?: boolean) => `/template-previews/${key}.${locale === "en" ? "en" : "ar"}${mobile ? ".mobile" : ""}.webp`;

function PhoneFrame({ src, className, children }: { src: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative rounded-[30px] bg-[#0f1d21] p-[7px] shadow-[0_24px_56px_rgba(13,55,67,0.22)]", className)}>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[24px] bg-white">
        <Image src={src} alt="" fill sizes="220px" className="object-cover object-top" />
        {children}
      </div>
    </div>
  );
}

/** Two real templates: one in a browser, the other on a phone in front of it. */
export async function TemplateScreens({ templates, priority }: { templates: readonly [string, string]; priority?: boolean }) {
  const locale = await getLocale();
  return (
    <div aria-hidden className="relative pb-6 sm:pe-10">
      <div className="overflow-hidden rounded-[14px] border border-[#e3ebed] bg-white shadow-[0_24px_56px_rgba(13,55,67,0.14)]">
        <BrowserBar url={<span>{templates[0]}.tallaby.com</span>} />
        <div className="relative aspect-[4/3]">
          <Image src={preview(templates[0], locale)} alt="" fill priority={priority} sizes="(min-width: 1081px) 640px, 92vw" className="object-cover object-top" />
        </div>
      </div>
      <PhoneFrame src={preview(templates[1], locale, true)} className="absolute end-0 bottom-0 w-[30%] max-w-[170px] min-w-[104px]" />
    </div>
  );
}

/** A template on a phone with the store app's install card at the bottom (Store settings › App). */
export async function PhoneAppShot({ template }: { template: string }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("productPages.store-app.phone")]);
  return (
    <div aria-hidden className="mx-auto w-full max-w-[290px]">
      <PhoneFrame src={preview(template, locale, true)}>
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-2.5 rounded-2xl bg-white/95 p-2.5 text-start shadow-[0_10px_30px_rgba(13,55,67,0.25)] backdrop-blur">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-teal-900 font-latin text-sm font-bold text-white">{t("initials")}</span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[13px] text-[#171717]">{t("appName")}</b>
            <small className="block truncate text-[11px] text-[#808080]">{t("hint")}</small>
          </span>
          <span className="inline-flex h-8 flex-none items-center gap-1 rounded-[9px] bg-teal-700 px-2.5 text-[11.5px] font-bold text-white">
            <Download className="size-3.5" />
            {t("install")}
          </span>
        </div>
      </PhoneFrame>
    </div>
  );
}

/** Any section picture. `mock` is required for `dash`. */
export async function ProductVisualView({ visual, mock, hero }: { visual: ProductVisual; mock?: MockWords; hero?: boolean }) {
  if (visual.kind === "screens") return <TemplateScreens templates={visual.templates} priority={hero} />;
  if (visual.kind === "phone") return <PhoneAppShot template={visual.template} />;
  if (!mock) return null;
  return hero ? <DashShot words={mock} active={visual.active} /> : <DashPanel words={mock} />;
}
