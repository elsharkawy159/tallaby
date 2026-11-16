import * as React from "react";
import {
  Activity,
  Banknote,
  Bot,
  Check,
  CreditCard,
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
  TicketPercent,
  Truck,
  Users,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Kicker, Ltr, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { SignupTrigger, SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { PlanCards } from "@/components/marketing/pricing/plan-cards";
// Grid instead of carousel on the home page (owner, 2026-11-13); the carousel file stays so it can come back.
// import { TemplateCarousel } from "@/components/marketing/templates/template-carousel.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { TemplatePreviewCard } from "@/components/marketing/templates/template-preview-card";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { selectStoreLine } from "@/lib/marketing/recent-stores.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { selectLogoStrip } from "@/lib/marketing/store-directory.lib";
import { getDirectoryStores, getRecentStores } from "@/lib/marketing/stores.server";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import { templateFrameSrc, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { ChatGptMark, ClaudeMark } from "./ai-brand-marks";
import { HeroDemo } from "./hero-demo";
import { HomeTemplateCarousel, type HomeCarouselCard } from "./home-template-carousel.client";
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
    <section id="top" aria-labelledby="home-h1" className="relative isolate overflow-hidden pt-10 pb-24 min-[641px]:pt-16">
      {/* A soft, near-white pattern over the fog (home-hero-pattern, 4 KB). A CSS background, so it never
          competes with the title for bandwidth; it fades out before the demo ends. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(100%,1100px)] bg-[url(/marketing/home/home-hero-pattern.webp)] bg-cover bg-top opacity-70 [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]"
      />
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
  return <StoreLogoStrip stores={stores} labels={{ title: t("title"), all: t("all"), listLabel: t("listLabel") }} locale={locale} />;
}

/** A point card: the spot beside the text on phones, above it from 641 px. */
const SPOT_CARD_CLASS =
  "grid grid-cols-[64px_minmax(0,1fr)] content-start gap-x-3.5 gap-y-0.5 rounded-[26px] border border-[#e6eef0] bg-white/85 px-4 py-3.5 min-[641px]:flex min-[641px]:flex-col min-[641px]:gap-2 min-[641px]:p-[22px] min-[641px]:pt-4";

/**
 * A card's spot illustration (the owner's 3D set, 2026-11-16, in place of an icon tile): 64 px on
 * phones, 88 px from 641 px. Decorative: the card's title says it. `mirror` flips a picture
 * that moves left to right for Arabic.
 */
function Spot({ src, mirror }: { src: string; mirror?: boolean }) {
  return (
    <Image
      src={src}
      alt=""
      width={192}
      height={192}
      unoptimized
      className={cn("row-span-2 size-16 min-[641px]:-ms-1.5 min-[641px]:size-[88px]", mirror && "rtl:-scale-x-100")}
    />
  );
}

/**
 * "What is Tallaby?" right after the hero: one plain sentence, who it is for, and four facts (owner, 2026-11-08).
 * Payments and shipping live here only (their own home sections were cut, owner 2026-11-15); "free" is the pricing section's.
 */
export async function WhatIsTallabySection() {
  const t = await getTranslations("home.what");
  const points = ["store", "money", "shipping", "world"] as const;

  return (
    <Section id="what-is-tallaby" aria-labelledby="what-is-tallaby-title">
      <Container className="grid items-center gap-8 min-[1081px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[1081px]:gap-14">
        <Reveal className="flex flex-col items-start gap-[18px]">
          <SplitHeading id="what-is-tallaby-title" kicker={t("kicker")} title={t("title")} body={t("lead")} />
          <p className="flex max-w-[620px] items-start gap-2.5 rounded-2xl border border-[#e6eef0] bg-white/80 px-4 py-3 text-[15px] text-pretty text-ink-700">
            <Users className="mt-0.5 size-[18px] flex-none text-teal-700" aria-hidden />
            {t("who")}
          </p>
          {/* Fills the heading column's empty height on wide screens; the cards say the same on phones. */}
          <Image
            src="/marketing/home/home-what.webp"
            alt=""
            width={880}
            height={621}
            unoptimized
            className="mt-2 hidden h-auto w-[440px] max-w-full self-center min-[1081px]:block"
          />
        </Reveal>
        <ul className="m-0 grid list-none gap-3 p-0 min-[641px]:grid-cols-2 min-[641px]:gap-4">
          {points.map((point) => (
            <Reveal
              as="li"
              key={point}
              className={SPOT_CARD_CLASS}
            >
              <Spot src={`/marketing/home/home-point-${point}.webp`} />
              <h3 className="text-[15.5px] leading-normal font-bold text-teal-900 min-[641px]:text-[17px]">{t(`points.${point}.title`)}</h3>
              <p className="text-sm text-pretty text-ink-500">
                {t.rich(`points.${point}.body`, {
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
    // The AI and import pictures move left to right, so Arabic mirrors them.
    { id: "ai", spot: "ai", mirror: true, title: t("aiTitle"), body: t("aiBody") },
    { id: "marketing", spot: "marketing", title: t("marketingTitle"), body: t("marketingBody") },
    { spot: "import", mirror: true, title: t("importTitle"), body: t("importBody") },
    { spot: "ads", title: t("adsTitle"), body: t("adsBody") },
  ];

  return (
    <Section id="features" aria-labelledby="features-title">
      <Container>
        <Reveal>
          <SectionHeading id="features-title" kicker={t("kicker")} title={t("title")} centered />
        </Reveal>
        <div className="grid gap-3 min-[641px]:grid-cols-2 min-[641px]:gap-4 min-[1081px]:grid-cols-4 min-[1081px]:grid-rows-[272px_272px]">
          <Reveal as="article" className="flex h-[540px] min-h-0 flex-col gap-5 overflow-hidden rounded-[26px] border border-[#e6eef0] bg-[linear-gradient(160deg,#f3f8f9_0%,#fff_60%)] p-5 min-[641px]:col-span-2 min-[641px]:p-[26px] min-[1081px]:row-span-2 min-[1081px]:h-auto">
            <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
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
            {/* A chat wired to a store, at the card's end corner from 641 px (the brand marks stay in the title). */}
            <Image src="/marketing/home/home-mcp.webp" alt="" width={400} height={232} unoptimized className="hidden h-auto w-[176px] flex-none min-[641px]:block min-[1081px]:w-[200px]" />
            </div>
            <McpChatDemo />
          </Reveal>
          {cards.map((card) => (
            <Reveal key={card.title} id={card.id} as="article" className={cn(SPOT_CARD_CLASS, "transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(13,55,67,0.08)]")}>
              <Spot src={`/marketing/home/home-${card.spot}.webp`} mirror={card.mirror} />
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
 * A home card's width, so the browser picks the 600 px or 1200 px desktop shot: five across the
 * 1400 px container (40 px gutters, 24 px gaps) from 1280 px, so the 10 cards fill two rows; two
 * (24 px gutters, 24 px gap) from 641 px. Phones show the carousel (slides about 80vw) and get the
 * phone shot.
 */
const HOME_TEMPLATE_CARD_SIZES = "(min-width: 1280px) calc((min(100vw, 1400px) - 176px) / 5), (min-width: 641px) calc(50vw - 36px), 80vw";

/**
 * The home page's templates (2026-11-16): the /templates gallery's tall full-page cards
 * (TemplatePreviewCard). Phones get a centred carousel (HomeTemplateCarousel); from 641 px a grid,
 * 2 across up to 1080 px and 3 on desktop, so the 6 cards fill whole rows. Both are in the HTML and
 * CSS shows one; both use the same `sizes`, so the hidden copy's images resolve to the files the
 * visible copy loads (one download each), and its live frames never mount.
 * Each card is one link to its template page, with the name and category under it and no buttons.
 */
async function TemplateGrid({ entries, locale }: { entries: GalleryEntry[]; locale: string }) {
  const [t, th] = await Promise.all([getTranslations("templates"), getTranslations("home.templates")]);
  if (!entries.length) return null;
  const cards: HomeCarouselCard[] = entries.map((entry) => {
    const edition = entry.shot?.edition ?? null;
    return {
      id: entry.id,
      href: edition ? `/templates/${entry.id}?edition=${encodeURIComponent(edition)}` : `/templates/${entry.id}`,
      name: entry.name,
      tag: t(`categories.${entry.category}`),
      linkLabel: t("previewNamed", { name: entry.name }),
      badge: entry.price ? null : t("detail.free"),
      shot: entry.shot,
      liveSrc: templateFrameSrc(locale, entry.id, undefined, true, edition),
    };
  });
  return (
    <>
      <div className="min-[641px]:hidden">
        <HomeTemplateCarousel
          cards={cards}
          rtl={locale === "ar"}
          sizes={HOME_TEMPLATE_CARD_SIZES}
          labels={{
            region: th("carousel"),
            prev: th("prev"),
            next: th("next"),
            slides: cards.map((_, index) => th("slide", { index: index + 1, total: cards.length })),
          }}
        />
      </div>
      <div className="hidden grid-cols-2 gap-x-6 gap-y-10 min-[641px]:grid min-[1280px]:grid-cols-5 min-[1280px]:gap-x-6 min-[1280px]:gap-y-12">
        {cards.map((card) => (
          <TemplatePreviewCard
            key={card.id}
            href={card.href}
            name={card.name}
            tag={card.tag}
            linkLabel={card.linkLabel}
            badge={card.badge}
            shot={card.shot}
            liveSrc={card.liveSrc}
            sizes={HOME_TEMPLATE_CARD_SIZES}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Templates and the builder in one section: 6 templates (pickHomeTemplates), then a link to the full gallery (owner, 2026-11-15).
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
        <div className="mt-10 flex justify-center min-[641px]:mt-12">
          <CtaButton asChild tone="outline">
            <Link href="/templates" aria-label={t("moreCount", { count: entries.length })}>
              {t("more")}
              {/* The whole gallery's size, as a small badge (owner, 2026-11-16). Numbers stay LTR in Arabic. */}
              <span aria-hidden dir="ltr" className="ms-2 inline-flex min-w-9 items-center justify-center rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold leading-5 text-white tabular-nums">
                +{entries.length}
              </span>
            </Link>
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
        <Reveal className="flex flex-col">
          <SectionHeading id="faq-title" kicker={t("kicker")} title={t("title")} className="mb-0" description={t.rich("desc", { link: (chunks) => <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 underline-offset-2 hover:underline">{chunks}</a> })} />
          {/* Fills the empty height under the heading on wide screens only. */}
          <Image src="/marketing/home/home-faq.webp" alt="" width={440} height={440} unoptimized className="mt-6 hidden h-auto w-[220px] self-center min-[1081px]:block" />
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
      <CtaBand
        title={t("title")}
        body={t("body")}
        art={<Image src="/marketing/home/home-cta.webp" alt="" width={440} height={325} unoptimized className="h-auto w-[220px]" />}
        action={<SlugClaimForm className="w-full sm:w-[420px]" submitLabel={t("cta")} />}
      />
    </div>
  );
}
