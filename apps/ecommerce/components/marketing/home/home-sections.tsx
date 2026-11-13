import * as React from "react";
import { BellRing, Bike, BookOpen, Check, ChartNoAxesCombined, FileUp, ShieldCheck, Sparkles, Star, Store, Timer, Palette, Rocket, Truck, Users, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Kicker, Ltr, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { IconTile, SiteCard } from "@/components/marketing/site/site-card";
import { SignupTrigger, SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { PlanCards } from "@/components/marketing/pricing/plan-cards";
import { TemplateCarousel } from "@/components/marketing/templates/template-carousel.client";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { COPY_VARS, PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { selectStoreLine } from "@/lib/marketing/recent-stores.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { getRecentStores } from "@/lib/marketing/stores.server";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { ChatGptMark, ClaudeMark } from "./ai-brand-marks";
import { AiDemo } from "./ai-demo";
import { BuilderDemo } from "./builder-demo";
import { HeroDemo } from "./hero-demo";
import { LiveStoreLine } from "./live-store-line.client";
import { MarketingTools } from "./marketing-tools.client";
import { McpChatDemo } from "./mcp-chat-demo";
import { PaymentDemo, ShippingDemo } from "./shipping-payment-demos";

/** A small text link from a home section to its deeper page. */
function SectionLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={className ?? "text-sm font-bold text-teal-700 underline-offset-2 hover:underline"}>
      {children}
    </Link>
  );
}

/** A heading plus the small lead used in the home page's split sections. */
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

export async function HomeHero() {
  // Prices in the home copy (and the hero demo's wallet) are `{orderFee}`-style tokens or `Money`, shown in the visitor's currency.
  const [t, locale, recent] = await Promise.all([getTranslations("home.hero"), getLocale(), getRecentStores()]);
  const features = t.raw("marquee") as string[];
  const checks = [t("check1"), t("check2")];
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
            <li key={check} className="flex items-center gap-1.5">
              <Check className="size-4 text-[#16a34a]" aria-hidden />
              {check}
            </li>
          ))}
        </ul>
        {/* One muted line with both plans' prices, to the pricing section below (English shows USD only, like its other copy). */}
        <a href="#pricing" className="mt-3 max-w-[560px] text-[13px] text-balance text-ink-500 underline-offset-2 hover:text-teal-700 hover:underline min-[641px]:text-sm">
          {withPrices(t("priceLine", PRICE_TOKENS))}
        </a>
      </Container>

      {/* The first copy is a real list (visible text for readers and search engines); the second only closes the loop.
          Arabic pages move right, English left (owner, F-73). */}
      <div className="store-marquee mt-5 overflow-hidden min-[641px]:mt-7" dir="ltr" data-direction={locale === "ar" ? "rtl" : "ltr"}>
        <div className="store-marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-label={copy === 0 ? t("marqueeLabel") : undefined}
              aria-hidden={copy === 1 ? true : undefined}
              data-marquee-copy={copy === 1 ? "" : undefined}
              className="m-0 flex flex-none list-none gap-2.5 p-0 pe-2.5"
            >
              {features.map((label) => (
                <li key={label} dir={locale === "ar" ? "rtl" : "ltr"} className="inline-flex h-[38px] items-center gap-2 rounded-full border border-line bg-white/75 px-4 text-[13.5px] font-semibold whitespace-nowrap text-ink-700">
                  <i aria-hidden className="size-[7px] rounded-full bg-amber-600" />
                  {label}
                </li>
              ))}
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

/** "What is Tallaby?" right after the hero: one plain sentence, who it is for, and four facts (owner, 2026-11-08). */
export async function WhatIsTallabySection() {
  const t = await getTranslations("home.what");
  const points = [
    { key: "store", icon: Store },
    { key: "money", icon: Wallet },
    { key: "shipping", icon: Truck },
    { key: "free", icon: Rocket },
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
                  ...COPY_VARS,
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

export async function FeaturesSection() {
  const t = await getTranslations("home.features");
  const cards = [
    { icon: Sparkles, title: t("aiTitle"), body: t("aiBody"), link: { href: "#ai", label: t("aiLink") } },
    { icon: Truck, title: t("shipTitle"), body: t("shipBody") },
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
            <Reveal key={card.title} as="article" className="grid grid-cols-[38px_minmax(0,1fr)] content-start gap-x-3 gap-y-0.5 rounded-[26px] border border-[#e6eef0] bg-white/85 px-4 py-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(13,55,67,0.08)] min-[641px]:flex min-[641px]:flex-col min-[641px]:gap-2.5 min-[641px]:p-[26px]">
              <IconTile className="row-span-3 size-[38px] rounded-xl min-[641px]:mb-1.5 min-[641px]:size-11 min-[641px]:rounded-[14px]">
                <card.icon aria-hidden />
              </IconTile>
              <h3 className="text-[15.5px] leading-normal font-bold text-teal-900 min-[641px]:text-[17px]">{card.title}</h3>
              <p className="text-sm text-pretty text-ink-500">{card.body}</p>
              {card.link ? (
                <a href={card.link.href} className="mt-1 text-sm font-bold text-teal-700 min-[641px]:mt-auto">
                  {card.link.label}
                </a>
              ) : null}
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export async function AiSection() {
  const t = await getTranslations("home.ai");
  return (
    <Section id="ai" aria-labelledby="ai-title">
      <Container>
        <AiDemo>
          <SplitHeading id="ai-title" kicker={t("kicker")} title={t("title")} body={t("body")} />
        </AiDemo>
      </Container>
    </Section>
  );
}

export async function BuilderSection() {
  const t = await getTranslations("home.builder");
  return (
    <Section id="builder" aria-labelledby="builder-title">
      <Container>
        <Reveal>
          <SectionHeading id="builder-title" kicker={t("kicker")} title={t("title")} description={t("body")} centered />
        </Reveal>
        <Reveal>
          <BuilderDemo />
        </Reveal>
      </Container>
    </Section>
  );
}

/** One template per category, in the catalog's order. */
function onePerCategory(entries: readonly GalleryEntry[]): GalleryEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.category)) return false;
    seen.add(entry.category);
    return true;
  });
}

export async function TemplatesSection() {
  const locale = await getLocale();
  const [t, entries] = await Promise.all([getTranslations("home.templates"), getTemplateGallery(locale)]);
  return (
    <section id="templates" aria-labelledby="templates-title" className="py-14 min-[861px]:py-[72px]">
      <Container>
        <Reveal>
          <SectionHeading id="templates-title" kicker={t("kicker")} title={t("title")} description={t("body", { count: entries.length })} centered />
        </Reveal>
      </Container>
      <TemplateCarousel entries={onePerCategory(entries)} />
      <Container className="mt-6 text-center">
        <SectionLink href="/industries/clothing-store">{t("industryLink")}</SectionLink>
      </Container>
    </section>
  );
}

export async function MarketingSection() {
  const t = await getTranslations("home.marketing");
  const extras = [
    { icon: BellRing, label: t("extras.popups") },
    { icon: Users, label: t("extras.subscribers") },
    { icon: BookOpen, label: t("extras.catalog") },
    { icon: ShieldCheck, label: t("extras.fake") },
    { icon: Star, label: t("extras.reviews") },
  ];
  return (
    <Section id="marketing" aria-labelledby="marketing-title">
      <Container>
        <Reveal>
          <SectionHeading id="marketing-title" kicker={t("kicker")} title={t("title")} description={t("body")} centered />
        </Reveal>
        <Reveal>
          <MarketingTools />
        </Reveal>
        <Reveal className="mt-7 flex flex-wrap justify-center gap-2.5">
          {extras.map((extra) => (
            <span key={extra.label} className="inline-flex h-[42px] items-center gap-2 rounded-full border border-line bg-white/80 px-4 text-sm font-semibold text-ink-700">
              <extra.icon className="size-4 text-teal-700" aria-hidden />
              {extra.label}
            </span>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

export async function ShippingSection() {
  const t = await getTranslations("home.shipping");
  const carriers = [
    { name: "Bosta", note: t("bostaNote"), latin: true, dot: "#e30613" },
    { name: "Wassalha", note: t("wassalhaNote"), latin: true, dot: "#0f9d58" },
    { name: t("ridersName"), note: t("ridersNote"), icon: Bike },
  ];
  return (
    <Section id="shipping" aria-labelledby="shipping-title">
      <Container className="grid items-center gap-12 min-[1081px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[1081px]:gap-[72px]">
        <Reveal className="flex flex-col items-start gap-[18px]">
          <SplitHeading id="shipping-title" kicker={t("kicker")} title={t("title")} body={t("body")} />
          <div className="mt-1.5 grid w-full gap-2.5 min-[641px]:grid-cols-3">
            {carriers.map((carrier) => (
              <div key={carrier.name} className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#e6eef0] bg-white px-2.5 py-3 text-center">
                <span className="flex items-center gap-2">
                  {carrier.icon ? <carrier.icon className="size-4 text-teal-700" aria-hidden /> : <span className="size-2.5 flex-none rounded-[3px]" style={{ background: carrier.dot }} />}
                  <b className={carrier.latin ? "font-latin text-[15px] font-extrabold text-[#26393e]" : "text-[13.5px] font-bold text-[#26393e]"}>{carrier.name}</b>
                </span>
                <small className="text-xs text-ink-500">{carrier.note}</small>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal className="flex justify-center">
          <ShippingDemo />
        </Reveal>
      </Container>
    </Section>
  );
}

export async function PaymentsSection() {
  const t = await getTranslations("home.payments");
  const groups = [
    { label: t("groups.cod"), items: [t("cod")] },
    { label: t("groups.transfer"), items: ["InstaPay", "Vodafone Cash", "e& Cash"] },
    { label: t("groups.cards"), items: ["Paymob", "Kashier"] },
  ];
  return (
    <Section id="payments" aria-labelledby="payments-title">
      <Container className="grid items-center gap-12 min-[1081px]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] min-[1081px]:gap-[72px]">
        <Reveal className="order-2 flex justify-center min-[1081px]:order-1">
          <PaymentDemo />
        </Reveal>
        <Reveal className="order-1 flex flex-col items-start gap-[18px] min-[1081px]:order-2">
          <SplitHeading id="payments-title" kicker={t("kicker")} title={t("title")} body={t("body")} />
          <div className="mt-1.5 flex w-full flex-col gap-3.5">
            {groups.map((group) => (
              <div key={group.label}>
                <small className="mb-1.5 block text-xs font-semibold text-ink-500">{group.label}</small>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="inline-flex h-10 items-center rounded-xl border border-[#e6eef0] bg-white px-3.5 text-[13.5px] font-bold text-[#26393e]" dir="auto">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-pretty text-ink-500">{t("note")}</p>
          <SectionLink href="/solutions/create-online-store">{t("solutionLink")}</SectionLink>
        </Reveal>
      </Container>
    </Section>
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

export async function HowItWorks() {
  const t = await getTranslations("home.how");
  const steps = [
    { title: t("s1Title"), body: t("s1Body"), tag: t("s1Tag"), icon: Timer },
    { title: t("s2Title"), body: t("s2Body"), tag: t("s2Tag"), icon: Palette },
    { title: t("s3Title"), body: withPrices(t("s3Body", PRICE_TOKENS)), tag: t("s3Tag"), icon: Rocket },
  ];
  return (
    <Section id="how" aria-labelledby="how-title">
      <Container>
        <Reveal>
          <SectionHeading id="how-title" kicker={t("kicker")} title={t("title")} centered />
        </Reveal>
        <ol className="m-0 grid list-none gap-4 p-0 min-[861px]:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title}>
              <SiteCard className="flex h-full flex-col items-start gap-2.5 p-[26px]">
                <span className="grid size-11 place-items-center rounded-[14px] bg-teal-900 font-latin text-lg font-extrabold text-white">{i + 1}</span>
                <h3 className="text-[19px] font-bold text-teal-900">{step.title}</h3>
                <p className="text-[15px] text-pretty text-ink-500">{step.body}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[13px] font-semibold text-teal-700">
                  <step.icon className="size-3.5" aria-hidden />
                  {step.tag}
                </span>
              </SiteCard>
            </Reveal>
          ))}
        </ol>
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
      <CtaBand title={t("title")} body={t("body")} action={<SlugClaimForm className="w-full sm:w-[420px]" />} />
    </div>
  );
}
