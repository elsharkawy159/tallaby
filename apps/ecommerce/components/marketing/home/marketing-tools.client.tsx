"use client";

import * as React from "react";
import { Info, Mail, MessageCircle, Radar, ShoppingCart, TicketPercent } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";

const TABS = [
  { id: "email", icon: Mail },
  { id: "whatsapp", icon: MessageCircle },
  { id: "carts", icon: ShoppingCart },
  { id: "coupon", icon: TicketPercent },
  { id: "pixel", icon: Radar },
] as const;

/**
 * Marketing tools: plain tabs (a row on phones, a column on desktop) and the
 * picked tool's sample screen, a still frame. No autoplay or timers (owner,
 * 2026-11-10); arrow keys move between tabs.
 */
export function MarketingTools() {
  const t = useTranslations("home.marketing");
  const [current, setCurrent] = React.useState(0);
  const baseId = React.useId();
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const flip = useLocale() === "ar" ? -1 : 1;

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: flip, ArrowLeft: -flip }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (current + step + TABS.length) % TABS.length;
    setCurrent(next);
    tabs.current[next]?.focus();
  };
  const active = TABS[current]!.id;

  return (
    <div className="grid items-stretch gap-4 min-[1081px]:grid-cols-[320px_minmax(0,1fr)] min-[1081px]:gap-6">
      <div role="tablist" aria-label={t("kicker")} onKeyDown={onKeyDown} className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] min-[1081px]:mx-0 min-[1081px]:flex-col min-[1081px]:justify-center min-[1081px]:px-0">
        {TABS.map((tab, i) => {
          const selected = i === current;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setCurrent(i)}
              className={cn(
                "flex flex-none items-center gap-3 rounded-[18px] border px-3 py-2.5 text-start focus-visible:shadow-[var(--ring-focus)] focus-visible:outline-none min-[1081px]:px-3.5 min-[1081px]:py-3",
                selected ? "border-line bg-white" : "border-transparent opacity-75 hover:bg-white/70",
              )}
            >
              <span className={cn("grid size-9 flex-none place-items-center rounded-xl [&_svg]:size-[18px] min-[1081px]:size-11", selected ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-700")}>
                <tab.icon aria-hidden />
              </span>
              <span className="min-w-0">
                <b className="block text-sm whitespace-nowrap text-teal-900 min-[1081px]:text-[15px] min-[1081px]:whitespace-normal">{t(`tabs.${tab.id}.title`)}</b>
                <small className="hidden text-[13px] text-ink-500 min-[1081px]:block">{t(`tabs.${tab.id}.body`)}</small>
              </span>
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="flex items-center justify-center rounded-[22px] border border-line bg-[linear-gradient(160deg,#f2f7f8,#fff_70%)] p-3.5 min-[641px]:min-h-[420px] min-[641px]:rounded-card-lg min-[641px]:p-7"
      >
        <div className="flex w-full max-w-[520px] flex-col gap-3.5 rounded-[18px] border border-[#e6eef0] bg-white p-3.5 text-[13.5px] min-[641px]:rounded-[26px] min-[641px]:p-5">
          {active === "email" ? <EmailPane /> : null}
          {active === "whatsapp" ? <WhatsAppPane /> : null}
          {active === "carts" ? <CartsPane /> : null}
          {active === "coupon" ? <CouponPane /> : null}
          {active === "pixel" ? <PixelPane /> : null}
        </div>
      </div>
    </div>
  );
}

function PaneHead({ title, badge, tone = "green" }: { title: React.ReactNode; badge: React.ReactNode; tone?: "green" | "amber" }) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <b className="text-[15px] text-teal-900">{title}</b>
      <span className={cn("rounded-full px-2.5 py-[3px] text-xs font-bold whitespace-nowrap", tone === "green" ? "bg-[#e5f6ea] text-[#15803d]" : "bg-amber-50 text-[#8a5300]")}>{badge}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[12.5px] text-ink-500">
      <Info className="mt-[3px] size-[15px] flex-none text-teal-700" aria-hidden />
      {children}
    </p>
  );
}

function EmailPane() {
  const t = useTranslations("home.marketing.email");
  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} />
      <p className="text-[13px] text-ink-500">
        {t("toLabel")}: {t("to")} · <b className="font-latin">284</b>
      </p>
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#fbf8f6] p-5 text-center">
        <span className="font-latin text-base font-extrabold text-[#c8586b]">glow</span>
        <b className="text-[17px] text-[#2a2420]">{t("heading")}</b>
        <p className="text-[#6b5d58]">{t("body")}</p>
        <em className="rounded-[10px] bg-[#c8586b] px-[18px] py-2 text-[13px] font-bold text-white not-italic">{t("button")}</em>
      </div>
      <p className="text-[13px] text-ink-500">
        {t("sent")}: <b className="font-latin text-teal-900">284</b> · {t("left")}: <b className="font-latin text-teal-900">216</b>
      </p>
    </>
  );
}

function WhatsAppPane() {
  const t = useTranslations("home.marketing.whatsapp");
  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} tone="amber" />
      <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#efeae2] p-3.5 leading-[1.7] text-[#1f2c2f]">
        <b className="text-sm">
          {t("customer")} · <span className="font-normal text-ink-400">{t("order")}</span>
        </b>
        <p className="max-w-[85%] self-end rounded-xl bg-[#d9fdd3] px-3 py-2.5">{t("message")}</p>
        <p className="max-w-[85%] self-start rounded-xl bg-white px-3 py-2.5">{t("reply")}</p>
      </div>
      <Note>{t("note")}</Note>
    </>
  );
}

function CartsPane() {
  const t = useTranslations("home.marketing.carts");
  const rows = t.raw("rows") as { name: string; when: string; total: string }[];
  return (
    <>
      <PaneHead title={t("title")} badge={<><span className="font-latin">4,860</span> {t("badge")}</>} tone="amber" />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {rows.map((row, i) => (
          <li key={row.name} className="flex items-center gap-3 rounded-[14px] border border-[#edf1f2] px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <b className="block text-sm text-teal-900">{row.name}</b>
              <small className="text-xs text-ink-400">{row.when} · <span className="font-latin">{row.total}</span> {t("egp")}</small>
            </div>
            <span className={cn("rounded-[10px] px-3 py-[7px] text-[12.5px] font-bold whitespace-nowrap", i === 0 ? "bg-[#e5f6ea] text-[#15803d]" : "bg-teal-900 text-white")}>
              {i === 0 ? t("contacted") : t("whatsapp")}
            </span>
          </li>
        ))}
      </ul>
      <Note>{t("note")}</Note>
    </>
  );
}

function CouponPane() {
  const t = useTranslations("home.marketing.coupon");
  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} />
      <div className="flex flex-col gap-1 rounded-[18px] border-[1.5px] border-dashed border-amber-600 bg-amber-50 p-4">
        <small className="text-xs text-[#8a5300]">{t("codeLabel")}</small>
        <b dir="ltr" className="text-start font-latin text-2xl font-extrabold text-teal-900">WELCOME15</b>
        <span className="text-ink-700">{t("offer")}</span>
      </div>
      <div className="flex w-[250px] max-w-full flex-col gap-1.5 self-center rounded-[18px] border border-[#edf1f2] p-[18px] text-center shadow-soft">
        <b className="text-[15px] text-teal-900">{t("popupTitle")}</b>
        <p className="text-[13px] text-ink-500">
          {t("popupBody")} <span className="font-latin font-bold text-[#b42318]">02:14:37</span>
        </p>
        <em className="mt-1 rounded-[10px] bg-amber-600 px-3 py-[7px] text-[13px] font-bold text-teal-900 not-italic">{t("popupButton")}</em>
      </div>
    </>
  );
}

function PixelPane() {
  const t = useTranslations("home.marketing.pixel");
  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} />
      <ul dir="ltr" className="m-0 grid list-none gap-2 p-0 min-[641px]:grid-cols-2">
        {["Meta Pixel", "Conversions API", "Google Analytics 4", "Google Tag Manager"].map((name) => (
          <li key={name} className="flex items-center gap-2 rounded-xl border border-[#edf1f2] p-2.5 font-latin text-[12.5px] font-bold text-[#26393e]">
            <i className="size-2 flex-none rounded-full bg-[#16a34a]" />
            {name}
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-ink-500">
        <b dir="ltr" className="font-latin text-teal-900">Purchase</b> · {t("sent")}
      </p>
    </>
  );
}
