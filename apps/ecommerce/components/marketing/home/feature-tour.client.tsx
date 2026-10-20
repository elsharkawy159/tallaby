"use client";

import * as React from "react";
import {
  Banknote,
  Blocks,
  ChartColumn,
  Check,
  ChevronsUpDown,
  CircleCheck,
  CloudUpload,
  Copy,
  ExternalLink,
  Eye,
  Facebook,
  FileText,
  Globe,
  Info,
  Infinity as InfinityIcon,
  Instagram,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessageCircle,
  Moon,
  Music2,
  Package,
  PackagePlus,
  Palette,
  Pencil,
  Plug,
  Plus,
  Search,
  Server,
  Share2,
  Sheet,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Truck,
  Twitter,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import s from "./feature-tour.module.css";

/*
 * "Inside the dashboard" (Claude Design "Home v3", features-v3.js): a tab rail
 * that auto-advances every 8s, and a mock dashboard whose panels act out one
 * task each. Everything inside the mock app is decorative.
 */

const TABS = [
  { id: "home", icon: LayoutDashboard },
  { id: "product", icon: PackagePlus },
  { id: "delivery", icon: Truck },
  { id: "wallet", icon: Wallet },
  { id: "apps", icon: Blocks },
  { id: "website", icon: Globe },
] as const;
type TabId = (typeof TABS)[number]["id"];

const OPENING_BALANCE = 538.2;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Steps through `times` (ms after `run` turns on); jumps to the end for reduced motion. */
function useTimeline(times: readonly number[], run: boolean) {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    if (!run) return;
    if (reducedMotion()) {
      setStep(times.length);
      return;
    }
    const ids = times.map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
    return () => ids.forEach(window.clearTimeout);
  }, [run, times]);
  return step;
}

/** A number that eases from its previous value to `value`. */
function CountUp({ value, from = value, decimals = 0, duration = 1200 }: { value: number; from?: number; decimals?: number; duration?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const prev = React.useRef(from);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = prev.current;
    prev.current = value;
    if (start === value || reducedMotion()) {
      el.textContent = fmt(value, decimals);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      el.textContent = fmt(start + (value - start) * (1 - Math.pow(1 - p, 3)), decimals);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, decimals, duration]);
  return <span ref={ref}>{fmt(from, decimals)}</span>;
}

/** Types `text` one character at a time. Remount (key) to type new text. */
function Typed({ text, speed, onDone }: { text: string; speed: number; onDone?: () => void }) {
  const [n, setN] = React.useState(0);
  const done = React.useRef(onDone);
  React.useEffect(() => {
    done.current = onDone;
  });
  React.useEffect(() => {
    if (reducedMotion()) {
      setN(text.length);
      done.current?.();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) {
        window.clearInterval(id);
        done.current?.();
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);
  return <>{text.slice(0, n)}</>;
}

export function FeatureTour() {
  const t = useTranslations("home.features");
  const [cur, setCur] = React.useState<TabId>("home");
  const [started, setStarted] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [balance, setBalance] = React.useState(OPENING_BALANCE);
  const [flash, setFlash] = React.useState(false);
  const tourRef = React.useRef<HTMLDivElement>(null);
  const navRef = React.useRef<HTMLDivElement>(null);
  const flashTimer = React.useRef(0);

  React.useEffect(() => {
    const el = tourRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry!.isIntersecting);
        if (entry!.isIntersecting) setStarted(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(flashTimer.current);
    };
  }, []);

  const select = (id: TabId, focus = false) => {
    setCur(id);
    setBalance(OPENING_BALANCE);
    const nav = navRef.current;
    const tab = nav?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`);
    if (focus) tab?.focus();
    // On narrow screens the rail scrolls sideways; keep the active tab centred.
    if (nav && tab && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: tab.offsetLeft - nav.clientWidth / 2 + tab.offsetWidth / 2, behavior: "smooth" });
    }
  };
  const next = (step: number) => {
    const i = TABS.findIndex((tab) => tab.id === cur);
    return TABS[(i + step + TABS.length) % TABS.length]!.id;
  };

  const onBalance = (v: number) => {
    setBalance(v);
    setFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 900);
  };

  const paused = !(inView && !hover && started);

  return (
    <div ref={tourRef} className={cn(s.tour, paused && s.paused)}>
      <div
        ref={navRef}
        className={s.tnav}
        role="tablist"
        aria-label={t("tourLabel")}
        onKeyDown={(e) => {
          const back = document.documentElement.dir === "rtl" ? "ArrowRight" : "ArrowLeft";
          const fwd = back === "ArrowRight" ? "ArrowLeft" : "ArrowRight";
          if (e.key === fwd || e.key === "ArrowDown") select(next(1), true);
          else if (e.key === back || e.key === "ArrowUp") select(next(-1), true);
          else return;
          e.preventDefault();
        }}
      >
        {TABS.map(({ id, icon: Icon }) => {
          const on = id === cur;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tour-tab-${id}`}
              data-tab={id}
              aria-selected={on}
              aria-controls="tour-panel"
              tabIndex={on ? 0 : -1}
              className={s.tt}
              onClick={() => select(id)}
            >
              <span className={s.tic}>
                <Icon aria-hidden />
              </span>
              <span>
                <b>{t(`tabs.${id}.title`)}</b>
                <small>{t(`tabs.${id}.sub`)}</small>
              </span>
              <span className={s.pg} aria-hidden>
                <i
                  onAnimationEnd={(e) => {
                    if (e.target === e.currentTarget) select(next(1));
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className={s.app} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div className={s.abar} aria-hidden>
          <Menu />
          <b className={s.atitle}>{t(`tabs.${cur}.title`)}</b>
          <span className={s.sp} />
          <Search className={s.hm} />
          <span className={cn(s.wpill, flash && s.flash)}>
            <Wallet />
            <b>
              <CountUp key={cur} value={balance} decimals={1} duration={800} />
            </b>
            EGP
          </span>
          <Languages className={s.hm} />
          <Moon className={s.hm} />
        </div>
        <div id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${cur}`} className={s.abody}>
          <div key={`${cur}-${started}`} className={s.pn} aria-hidden>
            {cur === "home" && <HomePanel run={started} />}
            {cur === "product" && <ProductPanel run={started} />}
            {cur === "delivery" && <DeliveryPanel run={started} />}
            {cur === "wallet" && <WalletPanel run={started} onBalance={onBalance} />}
            {cur === "apps" && <AppsPanel run={started} />}
            {cur === "website" && <WebsitePanel run={started} />}
          </div>
          <p className="sr-only">{t(`tabs.${cur}.sub`)}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- dashboard home ---------- */

const PTS = [14, 26, 22, 40, 34, 52, 46, 60, 55, 72, 64, 86];
const ORDER_BARS = [3, 5, 4, 7, 6, 8, 7, 9, 8, 11, 9, 12];
const px = (i: number) => (i / (PTS.length - 1)) * 400;
const LINE = PTS.map((v, i) => `${px(i).toFixed(1)},${112 - v}`).join(" ");

function HomePanel({ run }: { run: boolean }) {
  const t = useTranslations("home.features.home");
  const kpis: { icon: LucideIcon; label: string; n: number; d: number; unit: string; foot: React.ReactNode }[] = [
    { icon: Banknote, label: t("sales"), n: 12480, d: 0, unit: "EGP", foot: <Up v="+18%" /> },
    { icon: ShoppingBag, label: t("orders"), n: 46, d: 0, unit: t("ordersUnit"), foot: <Up v="+12%" /> },
    { icon: Star, label: t("rating"), n: 4.8, d: 1, unit: "/ 5", foot: <span className={s.lk}>{t("reviews")}</span> },
    { icon: Wallet, label: t("wallet"), n: OPENING_BALANCE, d: 1, unit: "EGP", foot: <span className={s.lk}>{t("withdraw")}</span> },
  ];
  return (
    <>
      <div className={s.hh}>
        <div>
          <h4>{t("greeting")}</h4>
          <p>
            {t.rich("pending", {
              count: () => (
                <b className={s.num}>
                  <CountUp from={0} value={run ? 7 : 0} duration={1400} />
                </b>
              ),
            })}
          </p>
        </div>
        <span className={cn(s.abtn, s.teal)}>
          <Plus />
          {t("addProduct")}
        </span>
      </div>
      <div className={s.rng}>
        <span>{t("d7")}</span>
        <span className={s.on}>{t("d30")}</span>
        <span>{t("d90")}</span>
      </div>
      <div className={s.k4}>
        {kpis.map((k, i) => (
          <div key={k.label} className={s.kc} style={{ animationDelay: `${i * 90}ms` }}>
            <div className={s.kt}>
              <span>{k.label}</span>
              <span className={s.ki}>
                <k.icon />
              </span>
            </div>
            <div className={s.kv}>
              <b className={s.num}>
                <CountUp from={0} value={run ? k.n : 0} decimals={k.d} duration={1400} />
              </b>
              <small>{k.unit}</small>
            </div>
            {k.foot}
          </div>
        ))}
      </div>
      <div className={s.chart}>
        <div className={s.chh}>
          <div>
            <b>{t("sales")}</b>
            <small>{t("last30")}</small>
          </div>
          <div className={s.lgd}>
            <span>
              <i />
              {t("revenue")}
            </span>
            <span>
              <i className={s.o} />
              {t("orderCount")}
            </span>
          </div>
        </div>
        <svg viewBox="0 0 400 120" preserveAspectRatio="none">
          {[20, 50, 80, 110].map((y) => (
            <line key={y} className={s.gl} x1="0" x2="400" y1={y} y2={y} />
          ))}
          {/* The design drew the area over the bars and hid them; bars go on top here. */}
          <polygon className={s.area} points={`0,120 ${LINE} 400,120`} />
          {ORDER_BARS.map((v, i) => (
            <rect
              key={i}
              className={s.bx}
              x={(px(i) - 4).toFixed(1)}
              y={120 - v * 2}
              width="8"
              height={v * 2}
              rx="2"
              style={{ animationDelay: `${200 + i * 50}ms` }}
            />
          ))}
          <polyline className={s.line} pathLength={1000} points={LINE} />
        </svg>
      </div>
    </>
  );
}

function Up({ v }: { v: string }) {
  return (
    <span className={s.up}>
      <TrendingUp />
      {v}
    </span>
  );
}

/* ---------- add product ---------- */

const PRODUCT_TIMES = [300, 1700, 2500, 3300, 4700] as const;
const PRODUCT_NAME = { ar: "قميص كتان", en: "Linen shirt" } as const;

function ProductPanel({ run }: { run: boolean }) {
  const t = useTranslations("home.features.product");
  const first = useLocale() === "en" ? "en" : "ar";
  const second = first === "ar" ? "en" : "ar";
  const step = useTimeline(PRODUCT_TIMES, run);
  const [name1, setName1] = React.useState(false);
  const [name2, setName2] = React.useState(false);
  const [price, setPrice] = React.useState(false);

  const pct = price ? 100 : name2 ? 71 : step >= 3 ? 48 : name1 ? 29 : 0;
  const left = price ? t("ready") : name2 ? t("left2") : step >= 3 ? t("left4") : name1 ? t("left5") : t("left6");
  const stage = price ? 4 : step >= 5 ? 3 : name2 ? 2 : step >= 3 ? 1 : 0;
  const lang = step >= 4 ? second : first;
  const steps = [t("basics"), t("photos"), t("description"), t("price"), t("inventory")];

  return (
    <>
      <div className={s.pt}>
        <h4>{t("title")}</h4>
        <div className={s.lseg}>
          <span className={cn(lang === "ar" && s.on)}>العربية</span>
          <span className={cn(lang === "en" && s.on)}>English</span>
        </div>
      </div>
      <div className={s.stp}>
        {steps.map((label, i) => (
          <span key={label} className={cn(i === stage && s.on, i < stage && s.past)}>
            <i />
            {label}
          </span>
        ))}
      </div>
      <div className={cn(s.card, s.pc)}>
        <div className={s.pch}>
          <span className={s.ki}>
            <Tag />
          </span>
          <div>
            <b>{t("basicInfo")}</b>
            <small>{t("basicInfoHint")}</small>
          </div>
        </div>
        <span className={s.fl}>
          {t("name")} <em>{lang.toUpperCase()}</em>
        </span>
        <div className={s.inp}>
          <span dir={lang === "ar" ? "rtl" : "ltr"}>
            {step >= 4 ? (
              <Typed key="second" text={PRODUCT_NAME[second]} speed={70} onDone={() => setName2(true)} />
            ) : step >= 1 ? (
              <Typed key="first" text={PRODUCT_NAME[first]} speed={80} onDone={() => setName1(true)} />
            ) : null}
          </span>
          <span className={s.car} />
        </div>
        <div className={s.slugr}>
          <span>{t("link")}</span>
          <code className={s.ltr}>
            tallaby.com/products/<b>{name1 ? "linen-shirt" : "…"}</b>
          </code>
        </div>
        <span className={s.fl}>{t("category")}</span>
        <div className={cn(s.inp, s.sel, step >= 3 && s.inpOk)}>
          {step >= 3 ? (
            <>
              <span>{t("suggestion")}</span>
              <Check />
            </>
          ) : (
            <>
              <span className={s.phd}>{t("chooseCategory")}</span>
              <ChevronsUpDown />
            </>
          )}
        </div>
        <div className={cn(s.sug, step === 2 && s.on)}>
          <Sparkles />
          {t("suggested")} <b>{t("suggestion")}</b>
        </div>
        <span className={s.fl}>{t("price")}</span>
        <div className={cn(s.inp, s.ltr, step >= 5 && s.inpOk)}>
          {step >= 5 ? <Typed text="890.00" speed={90} onDone={() => setPrice(true)} /> : <span className={s.phd}>0.00</span>}
          <small>EGP</small>
        </div>
      </div>
      <div className={cn(s.card, s.rd, price && s.rdOk)}>
        <div className={s.ring}>
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" className={s.ringBg} />
            <circle cx="20" cy="20" r="16" className={s.ringFg} pathLength={100} style={{ strokeDashoffset: 100 - pct }} />
          </svg>
          <span>{pct}%</span>
        </div>
        <div>
          <small>{t("readiness")}</small>
          <b>{left}</b>
        </div>
        <span className={cn(s.abtn, s.teal, price ? s.go : s.dis)}>{t("publish")}</span>
      </div>
    </>
  );
}

/* ---------- delivery follow-up ---------- */

const DELIVERY_TIMES = [900, 1300, 2800, 4400] as const;

function DeliveryPanel({ run }: { run: boolean }) {
  const t = useTranslations("home.features.delivery");
  const step = useTimeline(DELIVERY_TIMES, run);
  const track = step >= 4 ? 3 : step >= 3 ? 2 : step >= 2 ? 1 : 0;
  const status = [
    { cls: s.sttY, label: t("ready") },
    { cls: s.sttB, label: t("assigned") },
    { cls: s.sttB, label: t("out") },
    { cls: s.sttG, label: t("delivered") },
  ][track]!;
  const cards = [
    { icon: Package, tone: s.diY, label: t("ready"), from: 3, value: step >= 2 ? 2 : 3 },
    { icon: Truck, tone: s.diB, label: t("inProgress"), from: 2, value: step >= 4 ? 2 : step >= 2 ? 3 : 2 },
    { icon: CircleCheck, tone: s.diG, label: t("deliveredToday"), from: 5, value: step >= 4 ? 6 : 5 },
    { icon: Banknote, tone: s.diP, label: t("cash"), from: 1850, value: step >= 3 ? 2930 : 1850, egp: true },
  ];

  return (
    <>
      <div className={s.dt}>
        <p>{t("intro")}</p>
        <span className={cn(s.abtn, s.amber)}>
          <Plus />
          {t("addCourier")}
        </span>
      </div>
      <div className={s.d4}>
        {cards.map((c) => (
          <div key={c.label} className={cn(s.card, s.dc)}>
            <span className={cn(s.di, c.tone)}>
              <c.icon />
            </span>
            <div>
              <small>{c.label}</small>
              <b className={s.num}>
                <CountUp from={c.from} value={c.value} duration={c.egp ? 900 : 500} />
              </b>
              {c.egp ? <em> EGP</em> : null}
            </div>
          </div>
        ))}
      </div>
      <div className={cn(s.card, s.ord)}>
        <div className={s.oh}>
          <div>
            <b className={s.num}>#1042</b>
            <small>{t("customer")}</small>
          </div>
          <span className={cn(s.stt, status.cls)}>{status.label}</span>
        </div>
        <div className={s.otr}>
          {[t("ready"), t("assigned"), t("out"), t("delivered")].map((label, i) => (
            <span key={label} className={cn(i <= track && s.on)}>
              <i />
              {label}
            </span>
          ))}
        </div>
        <div className={s.of}>
          {step >= 2 ? (
            <div className={s.crx}>
              <span className={s.av}>{t("courierInitial")}</span>
              <div>
                <b>{t("courier")}</b>
                <small>{t("courierStatus")}</small>
              </div>
            </div>
          ) : (
            <span className={cn(s.abtn, s.outline, step >= 1 && s.press)}>
              <UserPlus />
              {t("assign")}
            </span>
          )}
          <div className={s.cod}>
            <small>{t("cod")}</small>
            <b>1,080 EGP</b>
          </div>
        </div>
      </div>
      <div className={cn(s.toast, step >= 4 && s.on)}>
        <CircleCheck />
        <span>{t("toast")}</span>
      </div>
    </>
  );
}

/* ---------- wallet ---------- */

const WALLET_TIMES = [900, 2200, 2600, 4000, 5200] as const;

function WalletPanel({ run, onBalance }: { run: boolean; onBalance: (v: number) => void }) {
  const t = useTranslations("home.features.wallet");
  const step = useTimeline(WALLET_TIMES, run);
  const balance = step >= 5 ? 1028.2 : step >= 3 ? 1033.2 : step >= 1 ? 533.2 : OPENING_BALANCE;
  const notify = React.useRef(onBalance);
  React.useEffect(() => {
    notify.current = onBalance;
  });
  React.useEffect(() => {
    if (balance !== OPENING_BALANCE) notify.current(balance);
  }, [balance]);

  const today = new Date().toISOString().slice(0, 10).replaceAll("-", "/");
  const rows = [
    { key: "open", title: t("adjustment"), sub: t("opening"), amount: "+538.20", tone: "", at: 0 },
    { key: "f1", title: t("fee"), sub: `#1042 · ${t("delivered")}`, amount: "−5.00", tone: s.neg, at: 1 },
    { key: "top", title: t("topUp"), sub: `${t("card")} •••• 4242`, amount: "+500.00", tone: s.pos, at: 3 },
    { key: "cx", title: t("cancelled"), sub: `#1043 · ${t("noFee")}`, amount: "0.00", tone: "", at: 4 },
    { key: "f2", title: t("fee"), sub: `#1044 · ${t("delivered")}`, amount: "−5.00", tone: s.neg, at: 5 },
  ]
    .filter((r) => step >= r.at)
    .reverse();

  return (
    <>
      <div className={cn(s.card, s.wc)}>
        <span className={s.ki}>
          <Wallet />
        </span>
        <div className={s.wv}>
          <small>{t("title")}</small>
          <div className={cn(s.bl, s.ltr)}>
            <b>
              <CountUp value={balance} decimals={1} duration={800} />
            </b>
            <em>EGP</em>
          </div>
          <small>{t("month")}</small>
        </div>
        <span className={cn(s.abtn, s.amber, step >= 2 && s.press)}>
          <Plus />
          {t("topUp")}
        </span>
      </div>
      <div className={cn(s.card, s.wi)}>
        <b>
          <Info />
          {t("howTitle")}
        </b>
        <p>{t("howBody")}</p>
      </div>
      <div className={cn(s.card, s.wl)}>
        <div className={s.wlh}>
          <b>{t("activity")}</b>
          <div className={s.chs}>
            {[t("all"), t("sales"), t("fees"), t("topUps"), t("other")].map((c, i) => (
              <span key={c} className={cn(i === 0 && s.on)}>
                {c}
              </span>
            ))}
          </div>
        </div>
        {rows.map((r) => (
          <div key={r.key} className={cn(s.wr, r.at > 0 && s.nw)}>
            <span suppressHydrationWarning>{today}</span>
            <span>
              {r.title}
              <small>{r.sub}</small>
            </span>
            <b className={cn(s.num, r.tone)}>{r.amount}</b>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- apps & integrations ---------- */

const APPS: { id: string; name: string; vendor: string; icon: LucideIcon; bg: string }[] = [
  { id: "metaPixel", name: "Meta Pixel", vendor: "Meta", icon: InfinityIcon, bg: "#0866ff" },
  { id: "ga4", name: "Google Analytics 4", vendor: "Google", icon: ChartColumn, bg: "#f9ab00" },
  { id: "gtm", name: "Google Tag Manager", vendor: "Google", icon: Tag, bg: "#246fdb" },
  { id: "metaCapi", name: "Meta Conversions API", vendor: "Meta", icon: Server, bg: "#1c2b33" },
  { id: "tiktok", name: "TikTok Pixel", vendor: "TikTok", icon: Music2, bg: "#111111" },
  { id: "sheets", name: "Google Sheets", vendor: "Google", icon: Sheet, bg: "#0f9d58" },
];
const APPS_TIMES = APPS.flatMap((_, i) => [700 + i * 700, 1150 + i * 700]);

function AppsPanel({ run }: { run: boolean }) {
  const t = useTranslations("home.features.apps");
  const step = useTimeline(APPS_TIMES, run);
  return (
    <>
      <div className={s.aph}>
        <b>{t("title")}</b>
        <span>
          {t("connected")} <b className={s.num}>{Math.floor(step / 2)}</b>
          <b className={s.num}>/{APPS.length}</b>
        </span>
      </div>
      <div className={s.apg}>
        {APPS.map((a, i) => {
          const done = step >= 2 * i + 2;
          const busy = !done && step >= 2 * i + 1;
          return (
            <div key={a.id} className={cn(s.card, s.apc, done && s.on)} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={s.aph2}>
                <span className={s.alg} style={{ background: a.bg }}>
                  <a.icon />
                </span>
                <div>
                  <b>{a.name}</b>
                  <small>{a.vendor}</small>
                </div>
              </div>
              <p>{t(`items.${a.id}.desc`)}</p>
              <div className={s.apf}>
                <span className={s.tag}>{t(`items.${a.id}.kind`)}</span>
                {done ? (
                  <span className={cn(s.abtn, s.done)}>
                    <Check />
                    {t("connected")}
                  </span>
                ) : (
                  <span className={cn(s.abtn, s.teal, busy && s.press)}>
                    {busy ? <LoaderCircle className={s.spin} /> : <Plug />}
                    {busy ? t("connecting") : t("connect")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- website & social ---------- */

const SOCIAL: { id: string; icon: LucideIcon; bg: string; placeholder: string; value: string }[] = [
  { id: "facebook", icon: Facebook, bg: "#1877f2", placeholder: "facebook.com/yourstore", value: "facebook.com/nour.eg" },
  { id: "instagram", icon: Instagram, bg: "#e1306c", placeholder: "@yourstore", value: "@nour.eg" },
  { id: "tiktok", icon: Music2, bg: "#111111", placeholder: "@yourstore", value: "@nour.eg" },
  { id: "whatsapp", icon: MessageCircle, bg: "#25d366", placeholder: "01xxxxxxxxx", value: "01012345678" },
  { id: "x", icon: Twitter, bg: "#000000", placeholder: "@yourstore", value: "@nour_eg" },
];
// 1 highlights Social links, 2–6 fill each account, 7 enables Publish, 8 presses it, 9 published.
const WEBSITE_TIMES = [400, ...SOCIAL.map((_, i) => 700 + i * 650), 4100, 4700, 5000];

function WebsitePanel({ run }: { run: boolean }) {
  const t = useTranslations("home.features.website");
  const step = useTimeline(WEBSITE_TIMES, run);
  const published = step >= 9;
  const menu: { icon: LucideIcon; key: string }[] = [
    { icon: Palette, key: "design" },
    { icon: FileText, key: "pages" },
    { icon: Globe, key: "domain" },
    { icon: Share2, key: "social" },
  ];

  return (
    <div className={s.web}>
      <div className={cn(s.card, s.wo)}>
        <div className={s.wsh}>
          <span className={s.lgo}>N</span>
          <div>
            <b>Nour</b>
            <small className={s.ltr}>nour.tallaby.com</small>
          </div>
        </div>
        <div className={s.wbox}>
          <small>{t("address")}</small>
          <div className={s.adr}>
            <code className={s.ltr}>nour.tallaby.com</code>
            <span className={s.mini}>
              <Copy />
              {t("copy")}
            </span>
            <span className={s.mini}>
              <ExternalLink />
              {t("open")}
            </span>
          </div>
          <small>
            {published ? <CircleCheck /> : null}
            {published ? t("publishedNow") : t("publishedYesterday")}
          </small>
          <div className={s.wact}>
            <span className={cn(s.abtn, s.amber)}>
              <Pencil />
              {t("edit")}
            </span>
            <span className={cn(s.abtn, s.outline)}>
              <Eye />
              {t("preview")}
            </span>
            <span className={cn(s.abtn, s.outline, step >= 7 && !published ? s.go : s.dis, step === 8 && s.press)}>
              <CloudUpload />
              {t("publish")}
            </span>
          </div>
        </div>
        <div className={s.wm}>
          {menu.map((m) => (
            <div key={m.key} className={cn(m.key === "social" && step >= 1 && !published && s.hl)}>
              <span className={s.ki}>
                <m.icon />
              </span>
              <div>
                <b>{t(`menu.${m.key}.title`)}</b>
                <small>{t(`menu.${m.key}.sub`)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cn(s.card, s.wsoc)}>
        <div className={s.wsh2}>
          <span className={s.ki}>
            <Share2 />
          </span>
          <div>
            <b>{t("socialTitle")}</b>
            <small>{t("socialHint")}</small>
          </div>
        </div>
        {SOCIAL.map((so, i) => (
          <div key={so.id} className={s.sr}>
            <span className={s.si} style={{ background: so.bg }}>
              <so.icon />
            </span>
            <b>{t(`social.${so.id}`)}</b>
            <div className={cn(s.inp, s.ltr, step === i + 2 && s.inpOk)}>
              {step >= i + 2 ? <Typed text={so.value} speed={30} /> : <span className={s.phd}>{so.placeholder}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className={cn(s.toast, published && s.on)}>
        <CircleCheck />
        <span>{t("toast")}</span>
      </div>
    </div>
  );
}
