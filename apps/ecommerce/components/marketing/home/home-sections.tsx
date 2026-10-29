import {
  ChartColumn,
  Check,
  FileSpreadsheet,
  FileText,
  Images,
  Languages,
  LayoutPanelTop,
  LayoutTemplate,
  MonitorSmartphone,
  MousePointerClick,
  Newspaper,
  Package,
  Palette,
  Rocket,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TicketPercent,
  Timer,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Intro, IntroWords, Reveal, StaggerChildren } from "@workspace/motion";
import { Link } from "@/i18n/navigation";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { richTags } from "@/components/marketing/site/rich-text";
import { SignupTrigger, SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { TemplateCategories } from "@/components/marketing/templates/template-categories";
import { CONTACT } from "@/lib/marketing/site.lib";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import { BuilderStudio } from "./builder-studio.client";
import { FeatureTour } from "./feature-tour.client";
import { HeroStory } from "./hero-story.client";

export async function HomeHero() {
  const t = await getTranslations("home.hero");
  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden bg-teal-900 pt-[calc(44px+68px)] pb-[72px] text-white sm:pt-[calc(76px+68px)]">
      {/* The top padding includes the 68px home header, which overlays the hero. */}
      <div aria-hidden className="hero-glow-center pointer-events-none absolute inset-0" />
      {/* Intro: plain CSS from the first paint, so the headline (LCP) never waits for JavaScript. */}
      <Container className="relative flex flex-col items-center text-center">
        <Eyebrow data-intro="fade" className="mb-5 after:h-0.5 after:w-[22px] after:rounded-sm after:bg-amber-600 after:content-['']">
          {t("eyebrow")}
        </Eyebrow>
        <h1
          id="hero-title"
          className="display-tight max-w-[900px] text-[clamp(36px,5vw,64px)] leading-[1.2] font-extrabold text-balance text-white en:leading-[1.02]"
        >
          <IntroWords delay={0.05}>{t.rich("title", richTags)}</IntroWords>
        </h1>
        <Intro as="p" delay={0.3} className="mx-auto mt-5 mb-8 max-w-[600px] text-base text-pretty text-mist sm:text-lg">
          {t("lead")}
        </Intro>
        <HeroStory>
          <div className="mt-5 flex flex-wrap justify-center gap-x-[22px] gap-y-2.5 text-[13.5px] text-haze">
            {points.map((p, i) => (
              <Intro as="span" key={p} delay={0.5 + i * 0.07} className="flex items-center gap-[7px]">
                <Check className="size-[15px] text-amber-300" aria-hidden />
                {p}
              </Intro>
            ))}
          </div>
        </HeroStory>
      </Container>
    </section>
  );
}

export async function HowItWorks() {
  const t = await getTranslations("home.how");
  const steps = [
    { title: t("s1Title"), body: t("s1Body"), tag: t("s1Tag"), icon: Timer },
    { title: t("s2Title"), body: t("s2Body"), tag: t("s2Tag"), icon: Palette },
    { title: t("s3Title"), body: t("s3Body"), tag: t("s3Tag"), icon: Rocket },
  ];

  return (
    <Section id="how" aria-labelledby="how-title">
      {/* The steps simply fade up in turn (owner, 2026-10-29: no pinning). */}
      <Container>
        <Reveal>
          <SectionHeading id="how-title" kicker={t("kicker")} title={t("title")} />
        </Reveal>
        <div className="relative">
          <StaggerChildren as="ol" className="relative m-0 grid list-none gap-7 p-0 md:grid-cols-3 md:gap-10 md:before:absolute md:before:inset-x-14 md:before:top-[27px] md:before:h-0.5 md:before:bg-[repeating-linear-gradient(90deg,var(--color-teal-100)_0_8px,transparent_8px_14px)] md:before:content-['']">
            {steps.map((step, i) => (
              <li key={step.title} className="relative z-[2]">
                <span
                  className={`relative mb-[22px] grid size-14 place-items-center rounded-2xl font-latin text-[22px] font-extrabold ${
                    i === 0 ? "bg-amber-600 text-teal-900" : "bg-teal-900 text-white"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="mb-2 text-[21px] font-bold text-teal-900">{step.title}</h3>
                  <p className="text-[15px] text-slate-ink">{step.body}</p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[13px] font-semibold text-teal-700">
                    <step.icon className="size-3.5" aria-hidden />
                    {step.tag}
                  </span>
                </div>
              </li>
            ))}
          </StaggerChildren>
        </div>
        <Reveal className="mt-12 flex flex-wrap items-center gap-4">
          <SignupTrigger tone="teal" />
          <small className="text-sm text-neutral-600">{t("note")}</small>
        </Reveal>
      </Container>
    </Section>
  );
}

export async function TemplatesShowcase() {
  const locale = await getLocale();
  const [t, entries] = await Promise.all([getTranslations("home.templates"), getTemplateGallery(locale)]);
  return (
    <Section id="templates" aria-labelledby="tpl-title" className="border-y border-neutral-100 bg-white">
      <Container>
        <Reveal>
          <SectionHeading id="tpl-title" kicker={t("kicker")} title={t("title")} description={t("desc")} />
        </Reveal>
        <TemplateCategories entries={entries} />
      </Container>
    </Section>
  );
}

export async function BuilderSection() {
  const t = await getTranslations("home.builder");
  const features = [
    { icon: LayoutPanelTop, title: t("f1Title"), body: t("f1Body") },
    { icon: MousePointerClick, title: t("f2Title"), body: t("f2Body") },
    { icon: Languages, title: t("f3Title"), body: t("f3Body") },
    { icon: MonitorSmartphone, title: t("f4Title"), body: t("f4Body") },
    { icon: Sparkles, title: t("f5Title"), body: t("f5Body") },
  ];

  return (
    <Section id="builder" aria-labelledby="builder-title">
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <Reveal>
            <SectionHeading id="builder-title" kicker={t("kicker")} title={t("title")} description={t("desc")} className="mb-7" />
          </Reveal>
          <StaggerChildren as="ul" className="m-0 grid list-none gap-1 p-0">
            {features.map((f) => (
              <li key={f.title} className="grid grid-cols-[40px_1fr] gap-3.5 border-t border-neutral-200 py-4 last:border-b">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <f.icon className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <b className="block text-base text-teal-900">{f.title}</b>
                  <span className="text-sm text-slate-ink">{f.body}</span>
                </div>
              </li>
            ))}
          </StaggerChildren>
        </div>
        <Reveal variant="scale-in">
          <BuilderStudio />
        </Reveal>
      </Container>
    </Section>
  );
}

/** "Also in your dashboard": the areas the tour above doesn't act out. */
const MORE = [
  { key: "coupons", icon: TicketPercent },
  { key: "reviews", icon: Star },
  { key: "templates", icon: LayoutTemplate },
  { key: "forms", icon: FileText },
  { key: "blog", icon: Newspaper },
  { key: "media", icon: Images },
  { key: "reports", icon: FileSpreadsheet },
  { key: "stores", icon: Store },
] as const;

export async function FeaturesSection() {
  const t = await getTranslations("home.features");
  return (
    <Section id="features" aria-labelledby="features-title" className="border-y border-neutral-100 bg-white">
      <Container>
        <Reveal>
          <SectionHeading id="features-title" kicker={t("kicker")} title={t("title")} description={t("desc")} />
        </Reveal>
        <Reveal>
          <FeatureTour />
        </Reveal>
        <div className="mt-16">
          <Reveal as="h3" className="mb-[18px] text-xl font-bold text-teal-900">
            {t("moreTitle")}
          </Reveal>
          {/* Two columns from phone width: icon over the text on phones, beside it from sm. */}
          <StaggerChildren as="ul" stagger={0.06} className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:gap-3 lg:grid-cols-4">
            {MORE.map((m) => (
              <li
                key={m.key}
                className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-paper p-3.5 transition-[border-color,box-shadow] duration-300 hover:border-teal-100 hover:shadow-soft sm:flex-row sm:items-start sm:gap-3.5 sm:p-[18px]"
              >
                <span className="grid size-9 flex-none place-items-center rounded-xl bg-white text-teal-700 shadow-card ring-1 ring-teal-50 sm:size-10">
                  <m.icon className="size-[17px] sm:size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <b className="block text-[14px] leading-snug text-teal-900 sm:text-[15px]">{t(`more.${m.key}.title`)}</b>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-slate-ink sm:text-[13.5px]">{t(`more.${m.key}.body`)}</span>
                </div>
              </li>
            ))}
          </StaggerChildren>
        </div>
      </Container>
    </Section>
  );
}

export async function PricingTeaser() {
  const t = await getTranslations("home.pricing");
  const items = [
    { icon: Users, label: t("i1") },
    { icon: Package, label: t("i2") },
    { icon: ShoppingBag, label: t("i3") },
    { icon: MousePointerClick, label: t("i4") },
    { icon: LayoutTemplate, label: t("i5") },
    { icon: TicketPercent, label: t("i6") },
    { icon: Sparkles, label: t("i7") },
    { icon: ChartColumn, label: t("i8") },
    { icon: Star, label: t("i9") },
  ];

  return (
    <Section id="pricing" aria-labelledby="pricing-title">
      <Container>
        <Reveal>
          <SectionHeading id="pricing-title" centered kicker={t("kicker")} title={t("title")} />
        </Reveal>
        <Reveal variant="scale-in" className="mx-auto max-w-[460px] overflow-hidden rounded-[28px] border border-neutral-200 bg-white text-center shadow-lift">
          <div className="relative overflow-hidden bg-teal-900 px-[22px] pt-7 pb-8 text-white sm:px-8 sm:pt-9">
            <div aria-hidden className="absolute -top-[120px] size-[260px] rounded-full border-[40px] border-amber-600/10 ltr:-right-[110px] rtl:-left-[110px]" />
            <span className="relative inline-block rounded-full bg-amber-600/15 px-3.5 py-[5px] text-[13px] font-bold text-amber-300">{t("tag")}</span>
            <p className="relative mt-[18px] text-[64px] leading-none font-extrabold tracking-[-0.03em] text-amber-600 sm:text-[80px]">{t("price")}</p>
            <p className="relative mt-3.5 mb-3 inline-block rounded-full bg-white/10 px-3.5 py-1 text-[14px] font-semibold text-white">{t("commission")}</p>
            <p className="relative mx-auto max-w-[340px] text-[15px] text-mist">{t("desc")}</p>
          </div>
          <StaggerChildren as="ul" stagger={0.06} className="m-0 grid list-none px-[22px] pt-[18px] pb-1 text-start sm:px-8 sm:pt-6 sm:pb-2">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 border-b border-neutral-100 py-2 text-[13.5px] font-semibold text-[#2a3a3f] last:border-0">
                <span className="grid size-[26px] flex-none place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <item.icon className="size-3.5" aria-hidden />
                </span>
                {item.label}
              </li>
            ))}
          </StaggerChildren>
          <div className="px-[22px] pt-3.5 pb-[22px] sm:px-8 sm:pt-4 sm:pb-7">
            <SignupTrigger size="lg" className="h-[54px] w-full rounded-[14px] text-base" />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export async function HomeFaq() {
  const t = await getTranslations("home.faq");
  const tf = await getTranslations("faq");
  const tc = await getTranslations("common");
  const items = tf.raw("home") as FaqEntry[];

  return (
    <Section aria-labelledby="faq-title" className="pt-6 md:pt-6">
      <Container className="grid items-start gap-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <Reveal variant="fade" className="lg:sticky lg:top-[100px]">
          <SectionHeading id="faq-title" kicker={t("kicker")} title={t("title")} description={t("desc", { email: CONTACT.email })} className="mb-0">
            <CtaButton asChild tone="outline" size="sm" className="mt-5">
              <Link href="/faq">{tc("allQuestions")}</Link>
            </CtaButton>
          </SectionHeading>
        </Reveal>
        <Reveal variant="fade" delay={0.1}>
          <FaqAccordion items={items} />
        </Reveal>
      </Container>
    </Section>
  );
}

export async function FinalCta() {
  const t = await getTranslations("home.final");
  const tc = await getTranslations("common");
  return (
    <section id="final" aria-labelledby="final-title" className="pb-24">
      <Container>
        <Reveal className="relative grid grid-cols-1 items-center gap-12 overflow-hidden rounded-[22px] bg-amber-600 px-[22px] py-9 text-teal-900 sm:rounded-[28px] md:p-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div aria-hidden className="absolute -bottom-[280px] size-[520px] rounded-full bg-amber-500 ltr:-right-[200px] rtl:-left-[200px]" />
          <div aria-hidden className="absolute -top-[140px] size-[300px] rounded-full border-[48px] border-teal-900/10 ltr:-left-[120px] rtl:-right-[120px]" />
          <div className="relative">
            <span className="mb-2.5 block text-[13px] font-bold text-teal-800 en:text-xs en:tracking-[0.1em] en:uppercase">{t("kicker")}</span>
            <h2 id="final-title" className="display-tight text-[clamp(30px,4.2vw,50px)] leading-[1.2] font-extrabold en:leading-[1.06] en:tracking-[-0.025em]">
              {t("title")}
            </h2>
            <p className="mt-3.5 max-w-[460px] text-[17px] text-amber-ink">{t("desc")}</p>
          </div>
          <div className="relative rounded-[22px] bg-teal-900 p-5 text-white sm:p-7">
            <h3 className="mb-4 text-[17px] font-bold">{t("boxTitle")}</h3>
            <SlugClaimForm flat className="max-w-none" submitLabel={tc("createStore")} />
            <ul className="m-0 mt-[18px] grid list-none gap-2.5 p-0 text-sm text-mist">
              {[t("b1"), t("b2"), t("b3")].map((b) => (
                <li key={b} className="flex items-center gap-2.5">
                  <Check className="size-4 text-amber-600" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
