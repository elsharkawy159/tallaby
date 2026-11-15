import * as React from "react";
import {
  Activity,
  Banknote,
  Bot,
  Check,
  ChartNoAxesCombined,
  CreditCard,
  FileUp,
  Globe,
  Import,
  LayoutTemplate,
  Mail,
  MessageCircle,
  MousePointerClick,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TicketPercent,
  Truck,
  Users,
  Wallet,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Kicker, Ltr, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { IconTile } from "@/components/marketing/site/site-card";
import { SignupTrigger, SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { PlanCards } from "@/components/marketing/pricing/plan-cards";
// Grid instead of carousel on the home page (owner, 2026-11-13); the carousel file stays so it can come back.
// import { TemplateCarousel } from "@/components/marketing/templates/template-carousel.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { TemplateThumb } from "@/components/marketing/templates/template-thumb";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { selectStoreLine } from "@/lib/marketing/recent-stores.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { selectLogoStrip } from "@/lib/marketing/store-directory.lib";
import { getDirectoryStores, getRecentStores } from "@/lib/marketing/stores.server";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import { templateFrameSrc, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { ChatGptMark, ClaudeMark } from "./ai-brand-marks";
import { HeroDemo } from "./hero-demo";
import { pickHomeTemplates } from "./home-templates.lib";
import { LiveStoreLine } from "./live-store-line.client";
import { McpChatDemo } from "./mcp-chat-demo";
import { StoreLogoStrip } from "./store-logo-strip";

/** A heading plus the small lead used in the home page's split section. */
function SplitHeading({ id, kicker, title, body }: { id: string; kicker: string; title: string; body: string }) {
  return (
    <>
      <Kicker>{kicker}</Kicker>
      <h2 id={id} className="text-[clamp(28px,4vw,44px)] leading-[1.3] font-bold text-balance text-teal-900 en:leading-[1.15] en:tracking-[-0.01em]">
        {title}
      </h2>
      <p className="max-w-[620px] text-[17px] text-pretty text-ink-500">{body}</p>
    </>
  );
}

/** One icon per `home.hero.marquee` item, by position (same order in ar and en; keep in step with the JSON). */
const MARQUEE_ICONS: readonly LucideIcon[] = [
  MousePointerClick, // Drag & Drop builder
  WandSparkles, // Tallaby AI writes your products
  Bot, // Claude and ChatGPT
  LayoutTemplate, // 100+ templates
  Banknote, // Cash on delivery
  CreditCard, // Paymob and Kashier
  Truck, // Bosta
  Mail, // Email campaigns
  MessageCircle, // WhatsApp follow-up
  ShoppingCart, // Unfinished orders
  ShieldCheck, // Fake order protection
  TicketPercent, // Discount codes
  Activity, // Meta Pixel and Conversions API
  PackageOpen, // Meta and Google catalogs
  Globe, // Your own domain
  Import, // Import from Shopify
];

export async function HomeHero() {
  // Prices in the home copy (and the hero demo's wallet) are `{orderFee}`-style tokens or `Money`, shown in the visitor's currency.
  const [t, locale, recent] = await Promise.all([getTranslations("home.hero"), getLocale(), getRecentStores()]);
  const features = t.raw("marquee") as string[];
  // The third check is the Free plan's per-order fee as fixed copy (owner, 2026-11-15), a link to the pricing section below.
  const checks: { key: string; label: React.ReactNode; href?: string }[] = [
    { key: "check1", label: t("check1") },
    { key: "check2", label: t("check2") },
    { key: "check3", label: t("check3"), href: "#pricing" },
  ];
  const checkIcon = <Check className="size-4 shrink-0 text-[#16a34a]" aria-hidden />;
  const showLine = selectStoreLine(recent.stores, recent.readAt).kind !== "none";

  return (
    <section id="top" aria-labelledby="home-h1" className="relative overflow-hidden pt-10 pb-24 min-[641px]:pt-16">
      <Container className="relative flex flex-col items-center text-center">
        {/* First thing in the hero, above the title (owner, 2026-11-06; was after the call to action),
            in a slot of fixed height so nothing moves when it changes. */}
        {showLine ? (
          <div className="mb-5 flex h-[38px] max-w-full justify-center min-[641px]:mb-6">
            <LiveStoreLine stores={recent.stores} readAt={recent.readAt} />
          </div>
        ) : null}
        <h1
          id="home-h1"
          className="max-w-[900px] text-[clamp(34px,6.2vw,68px)] leading-[1.25] font-bold text-balance text-teal-900 en:leading-[1.08] en:tracking-[-0.02em] [&_em]:text-amber-700 [&_em]:not-italic"
        >
          {t.rich("title", richTags)}
        </h1>
        <p className="mx-auto mt-4 mb-6 max-w-[640px] text-[clamp(16px,2vw,19px)] text-pretty text-ink-500 min-[641px]:mt-5 min-[641px]:mb-8">{t("lead")}</p>
        {/* A plain signup button; the AI composer that stood here is no longer shown (owner, 2026-11-10). */}
        <SignupTrigger className="h-[58px] max-w-full px-6 text-[17px] min-[400px]:px-10">{t("cta")}</SignupTrigger>
        <ul className="m-0 mt-7 flex list-none flex-wrap justify-center gap-x-3.5 gap-y-1.5 p-0 text-[13px] text-ink-500 min-[641px]:gap-x-[22px] min-[641px]:gap-y-2 min-[641px]:text-sm">
          {checks.map((check) => (
            <li key={check.key} className="flex items-center gap-1.5">
              {check.href ? (
                <a
                  href={check.href}
                  className="flex items-center gap-1.5 rounded-sm underline-offset-2 hover:text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  {checkIcon}
                  <span>{check.label}</span>
                </a>
              ) : (
                <>
                  {checkIcon}
                  {check.label}
                </>
              )}
            </li>
          ))}
        </ul>
      </Container>

      {/* The first copy is a real list (visible text for readers and search engines); the second only closes the loop.
          Arabic pages move right, English left (owner, F-73). 120s (was the 60s default) so each item is easy to read. */}
      <div
        className="store-marquee mt-5 overflow-hidden min-[641px]:mt-7"
        dir="ltr"
        data-direction={locale === "ar" ? "rtl" : "ltr"}
        style={{ "--marquee-duration": "120s" } as React.CSSProperties}
      >
        <div className="store-marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-label={copy === 0 ? t("marqueeLabel") : undefined}
              aria-hidden={copy === 1 ? true : undefined}
              data-marquee-copy={copy === 1 ? "" : undefined}
              className="m-0 flex flex-none list-none gap-2.5 p-0 pe-2.5"
            >
              {features.map((label, index) => {
                const Icon = MARQUEE_ICONS[index] ?? Sparkles;
                return (
                  <li key={label} dir={locale === "ar" ? "rtl" : "ltr"} className="inline-flex h-[38px] items-center gap-2 rounded-full border border-line bg-white/75 px-4 text-[13.5px] font-semibold whitespace-nowrap text-ink-700">
                    <Icon aria-hidden className="size-4 shrink-0 text-amber-600" strokeWidth={2} />
                    {label}
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>

      <Container>
        <HeroDemo />
        <p className="mt-[76px] text-center text-xs text-ink-400 min-[641px]:mt-16">{t("sample")}</p>
      </Container>
    </section>
  );
}

/** Real store logos right after the hero (owner, 2026-11-14); hidden until enough stores qualify (selectLogoStrip). */
export async function TrustedStoresSection() {
  const stores = selectLogoStrip(await getDirectoryStores());
  if (stores.length === 0) return null;
  const [t, locale] = await Promise.all([getTranslations("home.trusted"), getLocale()]);
  return <StoreLogoStrip stores={stores} labels={{ title: t("title"), all: t("all"), listLabel: t("listLabel") }} rtl={locale === "ar"} />;
}

/**
 * "What is Tallaby?" right after the hero: one plain sentence, who it is for, and four facts (owner, 2026-11-08).
 * Payments and shipping live here only (their own home sections were cut, owner 2026-11-15); "free" is the pricing section's.
 */
export async function WhatIsTallabySection() {
  const t = await getTranslations("home.what");
  const points = [
    { key: "store", icon: Store },
    { key: "money", icon: Wallet },
    { key: "shipping", icon: Truck },
    { key: "world", icon: Globe },
  ] as const;

  return (
    <Section id="what-is-tallaby" aria-labelledby="what-is-tallaby-title">
      <Container className="grid items-center gap-8 min-[1081px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[1081px]:gap-14">
        <Reveal className="flex flex-col items-start gap-[18px]">
          <SplitHeading id="what-is-tallaby-title" kicker={t("kicker")} title={t("title")} body={t("lead")} />
          <p className="flex max-w-[620px] items-start gap-2.5 rounded-2xl border border-[#e6eef0] bg-white/80 px-4 py-3 text-[15px] text-pretty text-ink-700">
            <Users className="mt-0.5 size-[18px] flex-none text-teal-700" aria-hidden />
            {t("who")}
          </p>
        </Reveal>
        <ul className="m-0 grid list-none gap-3 p-0 min-[641px]:grid-cols-2 min-[641px]:gap-4">
          {points.map((point) => (
            <Reveal
              as="li"
              key={point.key}
              className="grid grid-cols-[38px_minmax(0,1fr)] content-start gap-x-3 gap-y-0.5 rounded-[26px] border border-[#e6eef0] bg-white/85 px-4 py-3.5 min-[641px]:flex min-[641px]:flex-col min-[641px]:gap-2.5 min-[641px]:p-[26px]"
            >
              <IconTile className="row-span-2 size-[38px] rounded-xl min-[641px]:mb-1.5 min-[641px]:size-11 min-[641px]:rounded-[14px]">
                <point.icon aria-hidden />
              </IconTile>
              <h3 className="text-[15.5px] leading-normal font-bold text-teal-900 min-[641px]:text-[17px]">{t(`points.${point.key}.title`)}</h3>
              <p className="text-sm text-pretty text-ink-500">
                {t.rich(`points.${point.key}.body`, {
                  domain: (chunks) => <Ltr className="font-latin font-semibold text-ink-700">{chunks}</Ltr>,
                })}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/**
 * The page's one feature overview: AI, marketing, import and ads in one grid (owner, 2026-11-15: they had a section each).
 * The AI and marketing cards keep the old sections' ids, so the header's "/#ai" and "/#marketing" links still land on them.
 */
export async function FeaturesSection() {
  const t = await getTranslations("home.features");
  const cards = [
    { id: "ai", icon: Sparkles, title: t("aiTitle"), body: t("aiBody") },
    { id: "marketing", icon: Mail, title: t("marketingTitle"), body: t("marketingBody") },
    { icon: FileUp, title: t("importTitle"), body: t("importBody") },
    { icon: ChartNoAxesCombined, title: t("adsTitle"), body: t("adsBody") },
  ];

  return (
    <Section id="features" aria-labelledby="features-title">
      <Container>
        <Reveal>
          <SectionHeading id="features-title" kicker={t("kicker")} title={t("title")} centered />
        </Reveal>
        <div className="grid gap-3 min-[641px]:grid-cols-2 min-[641px]:gap-4 min-[1081px]:grid-cols-4 min-[1081px]:grid-rows-[272px_272px]">
          <Reveal as="article" className="flex h-[540px] min-h-0 flex-col gap-5 overflow-hidden rounded-[26px] border border-[#e6eef0] bg-[linear-gradient(160deg,#f3f8f9_0%,#fff_60%)] p-5 min-[641px]:col-span-2 min-[641px]:p-[26px] min-[1081px]:row-span-2 min-[1081px]:h-auto">
            <div className="flex flex-col items-start gap-2.5">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11.5px] font-bold text-[#8a5300]">{t("mcpTag")}</span>
              <h3 className="text-[clamp(20px,2.4vw,26px)] leading-[1.4] font-bold text-teal-900">
                {t.rich("mcpTitle", {
                  claude: () => (
                    <Ltr className="mx-0.5 inline-flex items-center gap-1.5 align-baseline font-latin">
                      <ClaudeMark className="size-[0.9em] flex-none self-center" />
                      Claude
                    </Ltr>
                  ),
                  chatgpt: () => (
                    <Ltr className="mx-0.5 inline-flex items-center gap-1.5 align-baseline font-latin">
                      <ChatGptMark className="size-[0.9em] flex-none self-center text-[#0d0d0d]" />
                      ChatGPT
                    </Ltr>
                  ),
                })}
              </h3>
              <p className="text-[15px] text-pretty text-ink-500">{t("mcpBody")}</p>
            </div>
            <McpChatDemo />
          </Reveal>
          {cards.map((card) => (
            <Reveal key={card.title} id={card.id} as="article" className="grid grid-cols-[38px_minmax(0,1fr)] content-start gap-x-3 gap-y-0.5 rounded-[26px] border border-[#e6eef0] bg-white/85 px-4 py-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(13,55,67,0.08)] min-[641px]:flex min-[641px]:flex-col min-[641px]:gap-2.5 min-[641px]:p-[26px]">
              <IconTile className="row-span-2 size-[38px] rounded-xl min-[641px]:mb-1.5 min-[641px]:size-11 min-[641px]:rounded-[14px]">
                <card.icon aria-hidden />
              </IconTile>
              <h3 className="text-[15.5px] leading-normal font-bold text-teal-900 min-[641px]:text-[17px]">{card.title}</h3>
              <p className="text-sm text-pretty text-ink-500">{card.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/**
 * The home page's templates as a grid (owner, 2026-11-13: grid instead of
 * carousel): 2 columns up to tablets, 4 on desktop, so the 8 cards always fill
 * whole rows. Each card holds what the carousel's centre card holds, with the
 * same buttons and links; in narrow columns the category tag and the buttons stack.
 */
async function TemplateGrid({ entries, locale }: { entries: GalleryEntry[]; locale: string }) {
  const t = await getTranslations("templates");
  if (!entries.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 min-[641px]:gap-5 min-[1081px]:grid-cols-4">
      {entries.map((entry) => {
        const href = entry.shot?.edition ? `/templates/${entry.id}?edition=${encodeURIComponent(entry.shot.edition)}` : `/templates/${entry.id}`;
        return (
          <li key={entry.id} className="min-w-0">
            <article
              aria-label={entry.name}
              className="tpl-shot-trigger flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_14px_36px_rgba(13,55,67,0.09)] min-[641px]:rounded-[30px]"
            >
              <div className="flex flex-col items-start gap-1.5 px-3 pt-3 pb-2.5 min-[641px]:px-[18px] min-[641px]:pt-4 min-[641px]:pb-3 min-[1081px]:flex-row min-[1081px]:items-center min-[1081px]:justify-between min-[1081px]:gap-2.5">
                <div className="w-full min-w-0">
                  <h3 className="truncate font-latin text-[15px] font-bold text-teal-900 min-[641px]:text-base">{entry.name}</h3>
                  <small className="line-clamp-1 text-[12px] text-ink-400 min-[641px]:text-[12.5px]">{entry.description ?? ""}</small>
                </div>
                <span className="max-w-full flex-none truncate rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-teal-700 min-[641px]:text-[11.5px]">
                  {t(`categories.${entry.category}`)}
                </span>
              </div>
              <div className="mx-2 overflow-hidden rounded-[14px] border border-[#edf1f2] min-[641px]:mx-3 min-[641px]:rounded-[18px]">
                <TemplateThumb shot={entry.shot} liveSrc={templateFrameSrc(locale, entry.id, undefined, true)} sizes="(min-width: 1081px) 25vw, 50vw" />
              </div>
              {entry.palette.length ? (
                <div className="flex items-center gap-1.5 px-3 pt-2.5 text-xs text-ink-400 min-[641px]:px-[18px] min-[641px]:pt-3">
                  <span className="max-[640px]:sr-only">{t("colors")}</span>
                  {entry.palette.slice(0, 4).map((color, c) => (
                    <i key={`${c}-${color}`} className="size-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_#dfe8ea] min-[641px]:size-4" style={{ background: color }} />
                  ))}
                </div>
              ) : null}
              <div className="mt-auto flex flex-col gap-2 px-3 pt-3 pb-3 min-[641px]:px-[18px] min-[641px]:pt-3.5 min-[641px]:pb-[18px] min-[1081px]:flex-row">
                <SignupTrigger size="sm" className="h-11 w-full flex-1 shadow-none!">
                  {t("use")}
                </SignupTrigger>
                <CtaButton asChild tone="outline" size="sm" className="h-11 w-full min-[1081px]:w-auto">
                  <Link href={href}>{t("preview")}</Link>
                </CtaButton>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Templates and the builder in one section: 8 templates (pickHomeTemplates), then a link to the full gallery (owner, 2026-11-15).
 * The heading keeps the old builder section's id for the "/#builder" links in the footer and feature pages.
 */
export async function TemplatesSection() {
  const locale = await getLocale();
  const [t, entries] = await Promise.all([getTranslations("home.templates"), getTemplateGallery(locale)]);
  return (
    <section id="templates" aria-labelledby="templates-title" className="py-14 min-[861px]:py-[72px]">
      <Container>
        <Reveal id="builder">
          <SectionHeading id="templates-title" kicker={t("kicker")} title={t("title")} description={t("body", { count: entries.length })} centered />
        </Reveal>
        {/* Grid instead of carousel (owner, 2026-11-13). */}
        {/* <TemplateCarousel entries={pickHomeTemplates(entries)} /> */}
        <TemplateGrid entries={pickHomeTemplates(entries)} locale={locale} />
        <div className="mt-8 flex justify-center">
          <CtaButton asChild tone="outline">
            <Link href="/templates">{t("more")}</Link>
          </CtaButton>
        </div>
      </Container>
    </section>
  );
}

export async function PricingTeaser() {
  const t = await getTranslations("home.pricing");
  return (
    <Section id="pricing" aria-labelledby="pricing-title">
      <Container>
        <Reveal>
          <SectionHeading id="pricing-title" kicker={t("kicker")} title={t("title")} description={t("body")} centered />
        </Reveal>
        <PlanCards />
      </Container>
    </Section>
  );
}

export async function HomeFaq() {
  const t = await getTranslations("home.faq");
  const items = (t.raw("items") as FaqEntry[]).map((item) => ({ q: item.q, a: withPrices(String(item.a)) }));
  return (
    <Section id="faq" aria-labelledby="faq-title">
      <Container className="grid gap-7 min-[1081px]:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] min-[1081px]:gap-14">
        <Reveal>
          <SectionHeading id="faq-title" kicker={t("kicker")} title={t("title")} className="mb-0" description={t.rich("desc", { link: (chunks) => <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 underline-offset-2 hover:underline">{chunks}</a> })} />
        </Reveal>
        <Reveal>
          <FaqAccordion items={items} />
        </Reveal>
      </Container>
    </Section>
  );
}

export async function FinalCta() {
  const t = await getTranslations("home.final");
  return (
    <div id="final">
      {/* Same verb as the hero's button: one call to action on the page. */}
      <CtaBand title={t("title")} body={t("body")} action={<SlugClaimForm className="w-full sm:w-[420px]" submitLabel={t("cta")} />} />
    </div>
  );
}
