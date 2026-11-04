"use client";

import * as React from "react";
import { Info, Mail, MessageCircle, Radar, ShoppingCart, TicketPercent } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { useInView, useReducedMotion } from "./use-demo.client";
import styles from "./marketing-tools.module.css";

const TABS = [
  { id: "email", icon: Mail },
  { id: "whatsapp", icon: MessageCircle },
  { id: "carts", icon: ShoppingCart },
  { id: "coupon", icon: TicketPercent },
  { id: "pixel", icon: Radar },
] as const;
type TabId = (typeof TABS)[number]["id"];

const ROTATE_MS = 6000;
const IDLE_AFTER_INPUT_MS = 10_000;
const EVENTS = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"];
const COUNTDOWN_FROM = 2 * 3600 + 14 * 60 + 37;

function clock(seconds: number) {
  return [seconds / 3600, (seconds % 3600) / 60, seconds % 60].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":");
}

/** Marketing tools: tabs on one side rotate through sample screens on the other. Rotation stops off screen and for a while after any input. */
export function MarketingTools() {
  const t = useTranslations("home.marketing");
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [current, setCurrent] = React.useState(0);
  const [held, setHeld] = React.useState(false);
  const idle = React.useRef<number | undefined>(undefined);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = React.useId();
  const running = inView && !held && !reduced;

  const hold = () => {
    setHeld(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setHeld(false), IDLE_AFTER_INPUT_MS);
  };
  React.useEffect(() => () => window.clearTimeout(idle.current), []);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setCurrent((c) => (c + 1) % TABS.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [running, current]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const rtl = document.documentElement.dir === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (event.key === forward || event.key === "ArrowDown") next = (index + 1) % TABS.length;
    if (event.key === back || event.key === "ArrowUp") next = (index - 1 + TABS.length) % TABS.length;
    if (next === null) return;
    event.preventDefault();
    hold();
    setCurrent(next);
    tabRefs.current[next]?.focus();
  };

  const active: TabId = TABS[current]!.id;

  return (
    <div ref={ref} onPointerDown={hold} onWheel={hold} className="grid items-stretch gap-6 min-[1081px]:grid-cols-[340px_minmax(0,1fr)]">
      <div role="tablist" aria-label={t("kicker")} className="no-scrollbar flex gap-1.5 overflow-x-auto p-0.5 min-[1081px]:flex-col min-[1081px]:overflow-visible">
        {TABS.map((tab, i) => {
          const selected = i === current;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setCurrent(i)}
              onKeyDown={(event) => onKeyDown(event, i)}
              className={cn(
                "relative grid flex-none grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-[18px] border border-transparent px-3.5 py-3 text-start transition-colors duration-150 max-[1080px]:w-[250px] hover:bg-white/70",
                selected && "border-line bg-white shadow-[0_10px_30px_rgba(13,55,67,0.07)] hover:bg-white",
              )}
            >
              <span className={cn("grid size-11 place-items-center rounded-[14px] transition-colors duration-200 [&_svg]:size-5", selected ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-700")}>
                <tab.icon aria-hidden />
              </span>
              <span className="min-w-0">
                <b className="block text-[15px] text-teal-900">{t(`tabs.${tab.id}.title`)}</b>
                <small className="text-[13px] text-[#5f7277]">{t(`tabs.${tab.id}.body`)}</small>
              </span>
              {selected ? (
                <span aria-hidden className="absolute inset-x-3.5 bottom-0 h-0.5 overflow-hidden rounded-sm bg-[#edf2f3]">
                  <i key={current} className={cn(styles.progress, "block h-full origin-left bg-amber-600 rtl:origin-right", !running && "[animation-play-state:paused]")} style={{ animationDuration: `${ROTATE_MS}ms` }} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="flex items-center justify-center rounded-[22px] border border-line bg-[linear-gradient(160deg,#f2f7f8,#fff_70%)] p-3.5 min-[641px]:min-h-[440px] min-[641px]:rounded-card-lg min-[641px]:p-7"
      >
        <div key={active} className="flex w-full max-w-[520px] flex-col gap-3.5 rounded-[18px] border border-[#e6eef0] bg-white p-3.5 shadow-[0_14px_36px_rgba(13,55,67,0.07)] min-[641px]:rounded-[26px] min-[641px]:p-5">
          {active === "email" ? <EmailPane /> : null}
          {active === "whatsapp" ? <WhatsAppPane /> : null}
          {active === "carts" ? <CartsPane running={running} /> : null}
          {active === "coupon" ? <CouponPane running={running} /> : null}
          {active === "pixel" ? <PixelPane running={running} /> : null}
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

function EmailPane() {
  const t = useTranslations("home.marketing.email");
  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} />
      <div className="overflow-hidden rounded-2xl border border-[#edf1f2]">
        <div className="flex gap-2.5 border-b border-[#edf1f2] px-3.5 py-[9px] text-[13px]">
          <small className="w-14 flex-none text-ink-400">{t("toLabel")}</small>
          <span>{t("to")} · <b className="font-latin">284</b></span>
        </div>
        <div className="flex gap-2.5 border-b border-[#edf1f2] px-3.5 py-[9px] text-[13px]">
          <small className="w-14 flex-none text-ink-400">{t("subjectLabel")}</small>
          <span>{t("subject")}</span>
        </div>
        <div className="flex flex-col items-center gap-2 bg-[#fbf8f6] p-5 text-center">
          <span className="font-latin text-base font-extrabold text-[#c8586b]">glow</span>
          <b className="text-[17px] text-[#2a2420]">{t("heading")}</b>
          <p className="text-[13.5px] text-[#6b5d58]">{t("body")}</p>
          <em className="rounded-[10px] bg-[#c8586b] px-[18px] py-2 text-[13px] font-bold text-white not-italic">{t("button")}</em>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          [t("sent"), "284"],
          [t("left"), "216"],
          [t("unsubscribed"), "3"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[14px] bg-[#f6fafb] px-3 py-2.5">
            <small className="block text-xs text-ink-400">{label}</small>
            <b className="font-latin text-xl font-extrabold text-teal-900">{value}</b>
          </div>
        ))}
      </div>
    </>
  );
}

function WhatsAppPane() {
  const t = useTranslations("home.marketing.whatsapp");
  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} tone="amber" />
      <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#efeae2] p-3.5">
        <div className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2">
          <span className="grid size-[34px] place-items-center rounded-full bg-[#fbf1ef] font-latin text-[15px] font-extrabold text-[#c8586b]">m</span>
          <div>
            <b className="block text-sm">{t("customer")}</b>
            <small className="text-[11.5px] text-ink-400">{t("order")}</small>
          </div>
        </div>
        <div className="relative max-w-[85%] self-end rounded-xl rounded-se-[3px] bg-[#d9fdd3] px-3 py-2.5 text-[13.5px] leading-[1.7] text-[#1f2c2f]">
          {t("message")}
          <small className="block text-end font-latin text-[10.5px] text-[#8a979a]">10:24</small>
        </div>
        <div className="max-w-[85%] self-start rounded-xl rounded-ss-[3px] bg-white px-3 py-2.5 text-[13.5px] leading-[1.7] text-[#1f2c2f]">
          {t("reply")}
          <small className="block text-end font-latin text-[10.5px] text-[#8a979a]">10:25</small>
        </div>
      </div>
      <p className="flex items-start gap-2 text-[12.5px] text-[#5f7277]">
        <Info className="mt-[3px] size-[15px] flex-none text-teal-700" aria-hidden />
        {t("note")}
      </p>
    </>
  );
}

function CartsPane({ running }: { running: boolean }) {
  const t = useTranslations("home.marketing.carts");
  const rows = t.raw("rows") as { name: string; when: string; total: string }[];
  const [contacted, setContacted] = React.useState(1);

  React.useEffect(() => {
    if (!running || contacted >= rows.length) return;
    const id = window.setTimeout(() => setContacted((n) => n + 1), 2200);
    return () => window.clearTimeout(id);
  }, [running, contacted, rows.length]);

  return (
    <>
      <PaneHead title={t("title")} badge={<><span className="font-latin">4,860</span> {t("badge")}</>} tone="amber" />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {rows.map((row, i) => (
          <li key={row.name} className="flex items-center gap-3 rounded-[14px] border border-[#edf1f2] px-3 py-2.5">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-teal-50 font-bold text-teal-700">{row.name[0]}</span>
            <div className="min-w-0 flex-1">
              <b className="block text-sm text-teal-900">{row.name}</b>
              <small className="text-xs text-ink-400">{row.when} · <span className="font-latin">{row.total}</span> {t("egp")}</small>
            </div>
            <span className={cn("rounded-[10px] px-3 py-[7px] text-[12.5px] font-bold whitespace-nowrap transition-colors duration-300", i < contacted ? "bg-[#e5f6ea] text-[#15803d]" : "bg-teal-900 text-white")}>
              {i < contacted ? t("contacted") : t("whatsapp")}
            </span>
          </li>
        ))}
      </ul>
      <p className="flex items-start gap-2 text-[12.5px] text-[#5f7277]">
        <Info className="mt-[3px] size-[15px] flex-none text-teal-700" aria-hidden />
        {t("note")}
      </p>
    </>
  );
}

function CouponPane({ running }: { running: boolean }) {
  const t = useTranslations("home.marketing.coupon");
  const [seconds, setSeconds] = React.useState(COUNTDOWN_FROM);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} />
      <div className="grid overflow-hidden rounded-[18px] border-[1.5px] border-dashed border-amber-600 min-[641px]:grid-cols-2">
        <div className="flex flex-col gap-1 bg-amber-50 p-4">
          <small className="text-xs text-[#8a5300]">{t("codeLabel")}</small>
          <b dir="ltr" className="text-start font-latin text-2xl font-extrabold text-teal-900">WELCOME15</b>
          <span className="text-[13px] text-[#33464b]">{t("offer")}</span>
        </div>
        <div className="flex flex-col gap-2 px-4 py-3">
          {[
            [t("minimum"), t("minimumValue")],
            [t("uses"), "86 / 200"],
            [t("ends"), clock(seconds)],
          ].map(([label, value]) => (
            <div key={label}>
              <small className="block text-[11.5px] text-ink-400">{label}</small>
              <b className="font-latin text-sm font-bold text-teal-900">{value}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="relative -mt-1.5 flex w-[250px] max-w-full flex-col gap-1.5 self-center rounded-[18px] border border-[#edf1f2] bg-white p-[18px] text-center shadow-[0_18px_40px_rgba(13,55,67,0.16)]">
        <span aria-hidden className="absolute end-3 top-2 text-[#9aabb0]">×</span>
        <b className="text-[15px] text-teal-900">{t("popupTitle")}</b>
        <p className="text-[13px] text-[#5f7277]">
          {t("popupBody")} <span className="font-latin font-bold text-[#b42318]">{clock(seconds)}</span>
        </p>
        <em className="mt-1 rounded-[10px] bg-amber-600 px-3 py-[7px] text-[13px] font-bold text-teal-900 not-italic">{t("popupButton")}</em>
      </div>
    </>
  );
}

function PixelPane({ running }: { running: boolean }) {
  const t = useTranslations("home.marketing.pixel");
  const [tick, setTick] = React.useState(3);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1100);
    return () => window.clearInterval(id);
  }, [running]);

  const recent = [tick, tick - 1, tick - 2];
  return (
    <>
      <PaneHead title={t("title")} badge={t("badge")} />
      <div className="grid gap-2 min-[641px]:grid-cols-2">
        {["Meta Pixel + CAPI", "TikTok Pixel", "Snapchat Pixel", "Google Analytics 4"].map((name) => (
          <div key={name} className="flex items-center gap-2 rounded-xl border border-[#edf1f2] p-2.5">
            <b dir="ltr" className="flex-1 text-start font-latin text-[12.5px] whitespace-nowrap text-[#26393e]">{name}</b>
            <span className="rounded-full bg-[#e5f6ea] px-2 py-px text-[11px] font-bold text-[#15803d]">{t("connected")}</span>
          </div>
        ))}
      </div>
      <div className="flex min-h-[120px] flex-col gap-1.5">
        {recent.map((n) => (
          <div key={n} className="flex items-center gap-2.5 rounded-[10px] bg-[#f6fafb] px-3 py-2">
            <i className="size-2 flex-none rounded-full bg-[#16a34a]" />
            <b dir="ltr" className="font-latin text-[13px] text-teal-900">{EVENTS[((n % EVENTS.length) + EVENTS.length) % EVENTS.length]}</b>
            <small className="ms-auto text-xs text-ink-400">{t("sent")}</small>
          </div>
        ))}
      </div>
    </>
  );
}
