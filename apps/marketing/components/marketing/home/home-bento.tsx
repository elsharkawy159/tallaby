import * as React from "react";
import {
  BadgeCheck,
  Globe,
  Banknote,
  BarChart3,
  Headset,
  LayoutDashboard,
  Mail,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Container, Ltr, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";

/** The box every bento cell shares: a mock-up stage on top, then the title and one line. */
function BentoBox({
  id,
  title,
  body,
  stage,
  className,
  stageClassName,
  badge,
}: {
  id?: string;
  title: string;
  body: React.ReactNode;
  stage: React.ReactNode;
  className?: string;
  stageClassName?: string;
  /** A small pill after the title, e.g. "Soon" for a feature that is not live. */
  badge?: React.ReactNode;
}) {
  return (
    <article
      id={id}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-card border border-line bg-white p-4 shadow-soft transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-raise min-[641px]:p-5",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "relative flex h-[168px] items-center justify-center overflow-hidden rounded-card-sm border border-line-soft bg-[linear-gradient(160deg,#f3f8f9_0%,#fff_70%)] p-4",
          stageClassName,
        )}
      >
        {stage}
      </div>
      <div className="flex flex-col gap-1.5 px-1">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[17px] leading-normal font-bold text-teal-900">
          {title}
          {badge}
        </h3>
        <p className="text-sm text-pretty text-ink-500">{body}</p>
      </div>
    </article>
  );
}

/** A small white chip used inside the mock-ups. */
function MockChip({ icon: Icon, children, className, style }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span style={style} className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap text-ink-700 shadow-soft", className)}>
      {Icon ? <Icon className="size-3.5 text-teal-700" /> : null}
      {children}
    </span>
  );
}

/** Delay and run time for one looping mock element. */
function loop(delay: number, run?: number): React.CSSProperties {
  return { "--mk-delay": `${delay}s`, ...(run ? { "--mk-run": `${run}s` } : {}) } as React.CSSProperties;
}

/** "All in one": a mini dashboard with the store's parts around it. */
async function PlatformStage() {
  const t = await getTranslations("home.bento.mock");
  const parts = [
    { icon: Store, label: t("store") },
    { icon: Package, label: t("products") },
    { icon: ShoppingBag, label: t("orders") },
    { icon: Banknote, label: t("payments") },
    { icon: Truck, label: t("shipping") },
    { icon: Mail, label: t("marketing") },
  ];
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 shadow-soft">
        <LayoutDashboard className="size-4 text-teal-700" />
        <span className="text-[12px] font-bold text-teal-900">{t("dashboard")}</span>
        <span className="ms-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#16a34a]">
          <span className="mk-pulse size-1.5 rounded-full bg-[#16a34a]" />
          {t("live")}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {parts.map((part, index) => (
          <span key={part.label} style={loop(index * 0.35, 6)} className="mk-seq flex flex-col items-center gap-1 rounded-xl border border-line bg-white px-1 py-2.5 shadow-soft">
            <part.icon className="size-[18px] text-amber-600" />
            <span className="text-[11px] font-semibold text-ink-700">{part.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Support: a chat with the team typing. */
async function SupportStage() {
  const t = await getTranslations("home.bento.mock");
  return (
    <div className="flex w-full max-w-[260px] flex-col gap-2">
      <span className="self-end rounded-2xl rounded-ee-sm bg-teal-700 px-3 py-1.5 text-[11.5px] text-white">{t("supportAsk")}</span>
      <span className="flex items-center gap-2 self-start">
        <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-amber-ink">
          <Headset className="size-3.5" />
        </span>
        <span className="flex gap-1 rounded-2xl rounded-es-sm border border-line bg-white px-3 py-2.5 shadow-soft">
          {[0, 0.15, 0.3].map((delay) => (
            <span key={delay} style={loop(delay)} className="mk-dot size-1.5 rounded-full bg-teal-500" />
          ))}
        </span>
      </span>
      <span className="mt-1 self-center">
        <Num className="rounded-full bg-teal-900 px-3 py-1 text-[13px] font-bold text-white">24/7</Num>
      </span>
    </div>
  );
}

/** Certified marketers: three profile rows with a badge, no photos of people. */
async function MarketersStage() {
  const t = await getTranslations("home.bento.mock");
  const rows = [t("marketer1"), t("marketer2"), t("marketer3")];
  return (
    <ul className="m-0 flex w-full max-w-[250px] list-none flex-col gap-2 p-0">
      {rows.map((row, index) => (
        <li key={row} style={loop(index * 0.5, 6)} className="mk-seq flex items-center gap-2 rounded-xl border border-line bg-white px-2.5 py-1.5 shadow-soft">
          <span className="grid size-6 place-items-center rounded-full bg-teal-50 text-teal-700">
            <Users className="size-3.5" />
          </span>
          <span className="text-[11.5px] font-semibold text-ink-700">{row}</span>
          <BadgeCheck className="ms-auto size-4 text-amber-600" />
        </li>
      ))}
    </ul>
  );
}

/** Selling abroad: the store's currency switching. */
async function WorldStage() {
  const t = await getTranslations("home.bento.mock");
  const currencies = ["EGP", "SAR", "AED", "USD"];
  return (
    <div className="flex flex-col items-center gap-3">
      <Globe className="size-7 text-teal-700" />
      <div className="flex flex-wrap justify-center gap-1.5">
        {currencies.map((currency, index) => (
          <MockChip key={currency} style={loop(index * 0.5)} className={cn("mk-bob font-latin", index === 0 && "border-amber-500")}>
            <Ltr>{currency}</Ltr>
          </MockChip>
        ))}
      </div>
      <span className="text-[11px] font-semibold text-ink-500">{t("shipTo")}</span>
    </div>
  );
}

/** Marketing: a campaign being sent. */
async function MarketingStage() {
  const t = await getTranslations("home.bento.mock");
  return (
    <div className="flex w-full max-w-[260px] flex-col gap-2.5 rounded-xl border border-line bg-white p-3 shadow-soft">
      <span className="flex items-center gap-2 text-[12px] font-bold text-teal-900">
        <Mail className="size-4 text-teal-700" />
        {t("campaign")}
      </span>
      <span className="h-2 overflow-hidden rounded-full bg-teal-50">
        <span style={loop(0, 4)} className="mk-fill block h-full rounded-full bg-amber-500" />
      </span>
      <span className="flex justify-between text-[11px] text-ink-500">
        <span>{t("sending")}</span>
        <Ltr className="font-latin font-semibold text-ink-700">-10%</Ltr>
      </span>
    </div>
  );
}

/** Ads: pixel events arriving one by one. */
function AdsStage() {
  const events = ["PageView", "AddToCart", "Purchase"];
  return (
    <div className="flex flex-col items-center gap-2">
      <BarChart3 className="mb-1 size-6 text-teal-700" />
      {events.map((event, index) => (
        <MockChip key={event} style={loop(index * 0.7, 5)} className="mk-seq font-latin">
          <span className="size-1.5 rounded-full bg-[#16a34a]" />
          <Ltr>{event}</Ltr>
        </MockChip>
      ))}
    </div>
  );
}

/** Your own link: a browser bar with the store's address. */
async function DomainStage() {
  const t = await getTranslations("home.bento.mock");
  return (
    <div className="flex w-full max-w-[460px] flex-col gap-3">
      <div className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 shadow-soft">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </span>
        <Ltr className="min-w-0 truncate font-latin text-[12.5px] font-semibold text-teal-900">
          yourbrand.tallaby.com
          <span className="animate-blink ms-px inline-block h-3.5 w-px translate-y-0.5 bg-teal-900" />
        </Ltr>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <MockChip icon={Store}>{t("yourLogo")}</MockChip>
        <MockChip icon={Sparkles}>{t("yourColors")}</MockChip>
        <MockChip>
          <Ltr className="font-latin">yourbrand.com</Ltr>
        </MockChip>
      </div>
    </div>
  );
}

/** Import: three sources flowing into the store. */
async function ImportStage() {
  const t = await getTranslations("home.bento.mock");
  const sources = ["Excel", "Shopify", t("productLink")];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-1.5">
        {sources.map((source, index) => (
          <MockChip key={source} style={loop(index * 0.6)} className="mk-bob">
            {source}
          </MockChip>
        ))}
      </div>
      <span className="h-6 w-px bg-line-strong" />
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-3 py-1.5 text-[12px] font-bold text-white">
        <Package className="size-4 text-amber-300" />
        {t("yourStore")}
      </span>
    </div>
  );
}

/**
 * "What is Tallaby?" as one bento of feature boxes (2026-11-25), each with a
 * small coded mock-up. It replaces the old point cards and feature grid and
 * keeps their anchors #what-is-tallaby, #features and #marketing (#ai is the Tallaby AI section).
 * The support and marketers boxes are the owner's claims (2026-11-25).
 */
export async function HomeBento() {
  const t = await getTranslations("home.bento");
  return (
    <Section id="what-is-tallaby" aria-labelledby="what-is-tallaby-title">
      <Container>
        <Reveal>
          <SectionHeading id="what-is-tallaby-title" kicker={t("kicker")} title={t("title")} description={t("lead")} centered />
        </Reveal>
        <div id="features" className="grid gap-3 min-[641px]:grid-cols-2 min-[641px]:gap-4 min-[1081px]:grid-cols-4">
          <BentoBox
            title={t("platform.title")}
            body={t("platform.body")}
            stage={<PlatformStage />}
            className="min-[641px]:col-span-2 min-[1081px]:row-span-2"
            stageClassName="min-[1081px]:h-auto min-[1081px]:flex-1"
          />
          <BentoBox title={t("support.title")} body={t("support.body")} stage={<SupportStage />} />
          <BentoBox title={t("marketers.title")} body={t("marketers.body")} stage={<MarketersStage />} />
          <BentoBox title={t("world.title")} body={t("world.body")} stage={<WorldStage />} />
          <BentoBox id="marketing" title={t("marketing.title")} body={t("marketing.body")} stage={<MarketingStage />} />
          <BentoBox title={t("import.title")} body={t("import.body")} stage={<ImportStage />} />
          <BentoBox title={t("ads.title")} body={t("ads.body")} stage={<AdsStage />} />
          <BentoBox
            title={t("domain.title")}
            body={t.rich("domain.body", { domain: (chunks) => <Ltr className="font-latin font-semibold text-ink-700">{chunks}</Ltr> })}
            stage={<DomainStage />}
            className="min-[641px]:col-span-2"
          />
        </div>
      </Container>
    </Section>
  );
}

export { BentoBox, MockChip, loop };
