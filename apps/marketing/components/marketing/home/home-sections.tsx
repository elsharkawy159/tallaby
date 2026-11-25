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
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
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
import { HeroDemo } from "./hero-demo";
import { HomeTemplateCarousel, type HomeCarouselCard } from "./home-template-carousel.client";
import { pickHomeTemplates } from "./home-templates.lib";
import { LiveStoreLine } from "./live-store-line.client";
import { StoreLogoStrip } from "./store-logo-strip";

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
        {/* The top margin clears the phone, which hangs below the dashboard (HeroDemo). */}
        <p className="mt-[200px] text-center text-xs text-ink-400 min-[641px]:mt-[92px] min-[1081px]:mt-[134px]">{t("sample")}</p>
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

/**
 * A home card's width, so the browser picks the 600 px or 1200 px desktop shot: three across the
 * 1400 px container (40 px gutters, 32 px gaps) from 1081 px, so the 9 cards fill three rows; two
 * (24 px gutters, 24 px gap) from 641 px. Phones show the carousel (slides about 80vw) and get the
 * phone shot.
 */
const HOME_TEMPLATE_CARD_SIZES = "(min-width: 1081px) calc((min(100vw, 1400px) - 144px) / 3), (min-width: 641px) calc(50vw - 36px), 80vw";

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
      <div className="hidden grid-cols-2 gap-x-6 gap-y-10 min-[641px]:grid min-[1081px]:grid-cols-3 min-[1081px]:gap-x-8 min-[1081px]:gap-y-12">
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
 * Templates and the builder in one section: 9 random industries, one design each (pickHomeTemplates), then a link to the full gallery (owner, 2026-11-17).
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
