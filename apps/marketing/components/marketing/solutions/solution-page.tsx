import * as React from "react";
import Image from "next/image";
import { Banknote, CircleCheck, MessageCircle, Sparkles, UploadCloud } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildMockStore } from "@/components/marketing/industries/industry-page";
import { BidiText, ClosingCta, FaqBlock, FreeTermsNote, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { DashFrame, MockCard, MockCardHead, MockCode, MockPill, MockTable, MockToggle } from "@/components/marketing/pages/dash-mock";
import { DeviceStage } from "@/components/marketing/pages/store-mock.client";
import { SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { IconTile, SiteCard } from "@/components/marketing/site/site-card";
import { findIndustry, STORE_KIND_LINKS } from "@/lib/marketing/industries.lib";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { ROOT_DOMAIN } from "@/lib/marketing/site.lib";
import type { DashboardScene, Solution, SolutionStepVisual } from "@/lib/marketing/solutions.lib";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import { TemplateRail } from "./template-rail.client";

type Titled = { title: string; body: string };
type CostRow = { label: string; tallaby: string; other: string };

const CARD_KINDS = ["fa", "be", "el", "ho", "fo", "jw", "ki", "sp", "au", "ac"] as const;
/** How many cards a category shows before "All templates". */
const PER_CATEGORY = 6;

type DashboardWords = { title: string; greeting: string; sub: string; ordersTitle: string; ordersHead: string[]; orders: string[][] };

const bidi = (part: string) => <BidiText text={part} />;

/** The latest-orders table every scene ends with: product, governorate, total, status. */
function OrdersCard({ words }: { words: DashboardWords }) {
  return (
    <MockCard className="gap-0 overflow-hidden p-0">
      <div className="px-3.5 py-2.5 text-[13px] font-bold text-[#171717]">{words.ordersTitle}</div>
      <MockTable
        head={words.ordersHead}
        rows={words.orders.map(([product, governorate, total, status], i) => [
          product,
          governorate,
          <MockCode key="t">{total}</MockCode>,
          <MockPill key="s" tone={i === 0 ? "amber" : i === 1 ? "gray" : "green"}>
            {status}
          </MockPill>,
        ])}
      />
    </MockCard>
  );
}

/**
 * The dashboard behind the hero's phone, one scene per page (`Solution.stage`):
 * an illustration with made-up numbers, said so under it.
 */
async function DashboardScreen({ slug, scene }: { slug: string; scene: DashboardScene }) {
  const t = await getTranslations(`solutionPages.${slug}.dashboard`);
  const words: DashboardWords = {
    title: t("title"),
    greeting: t("greeting"),
    sub: t("sub"),
    ordersTitle: t("ordersTitle"),
    ordersHead: t.raw("ordersHead") as string[],
    orders: t.raw("orders") as string[][],
  };
  const active = scene === "zones" ? "shipping" : scene === "plan" ? "home" : "orders";
  return (
    <DashFrame active={active} title={words.title}>
      <div>
        <b className="block text-sm text-[#171717]">{words.greeting}</b>
        <small className="text-[11.5px] text-[#808080]">{words.sub}</small>
      </div>
      {scene === "orders" ? (
        <div className="grid grid-cols-2 gap-2.5 min-[861px]:grid-cols-4">
          {(t.raw("kpis") as { label: string; value: string; unit: string }[]).map((kpi) => (
            <MockCard key={kpi.label} className="gap-1 px-3 py-2.5">
              <span className="text-[11px] text-[#808080]">{kpi.label}</span>
              <span>
                <b className="font-latin text-[17px] text-[#171717]">{kpi.value}</b> <small className="text-[10.5px] text-[#808080]">{kpi.unit}</small>
              </span>
            </MockCard>
          ))}
        </div>
      ) : null}
      {scene === "plan" ? (
        <MockCard>
          <MockCardHead title={t("planName")} hint={t("planHint")} end={<MockPill>{t("planActive")}</MockPill>} />
          <div className="grid gap-1.5">
            {(t.raw("planRows") as { label: string; value: string }[]).map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 rounded-[9px] bg-[#f7faf9] px-2.5 py-[7px]">
                <span className="text-[#55605f]">{row.label}</span>
                <b className="text-[#171717]">{withPrices(row.value, bidi)}</b>
              </div>
            ))}
          </div>
        </MockCard>
      ) : null}
      {scene === "zones" ? (
        <MockCard className="gap-0 overflow-hidden p-0">
          <div className="px-3.5 pt-3 pb-1">
            <MockCardHead title={t("zonesTitle")} hint={t("zonesHint")} end={<MockToggle />} />
          </div>
          <MockTable
            head={t.raw("zonesHead") as string[]}
            rows={(t.raw("zones") as string[][]).map(([name, price, free]) => [name, <MockCode key="p">{price}</MockCode>, <MockCode key="f">{free}</MockCode>])}
          />
        </MockCard>
      ) : null}
      <OrdersCard words={words} />
    </DashFrame>
  );
}

/** The small picture above a step. Words are under `solutionPages.shared`. */
async function StepPicture({ visual, productName, photo }: { visual: SolutionStepVisual; productName: string; photo: string }) {
  const t = await getTranslations("solutionPages.shared");
  const pictures: Record<SolutionStepVisual, () => React.ReactNode> = {
    link: () => (
      <>
        <div dir="ltr" className="flex h-[38px] items-center rounded-full border-[1.5px] border-teal-700 bg-white px-3 font-latin text-[13px] font-semibold text-teal-900 shadow-[0_0_0_4px_rgba(20,81,99,0.08)]">
          glow<span className="font-medium text-[#8a989b]">.{ROOT_DOMAIN}</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#15803d]">
          <CircleCheck className="size-3.5" />
          {t("linkAvailable")}
        </span>
      </>
    ),
    template: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {["#f6f3ee", "#0f1315", "#f2e7dc"].map((color) => (
          <span key={color} className="grid h-[76px] place-items-end rounded-lg border border-[#e6eef0] p-1.5" style={{ backgroundColor: color }}>
            <i className="block h-1.5 w-full rounded-sm bg-amber-600" />
          </span>
        ))}
      </div>
    ),
    product: () => (
      <div className="grid grid-cols-[54px_1fr] items-center gap-2.5 rounded-[14px] border border-[#e6eef0] bg-white p-2">
        <span className="relative block size-[54px] overflow-hidden rounded-[10px] bg-[#f4f7f8]">
          <Image src={photo} alt="" fill sizes="54px" className="object-cover" style={{ objectPosition: "60% 45%" }} />
        </span>
        <div className="min-w-0">
          <b className="block truncate text-[13px] text-teal-900">{productName}</b>
          <small className="flex items-center gap-1 text-xs font-semibold text-teal-700">
            <Sparkles className="size-3 text-amber-700" />
            {t("aiDraft")}
          </small>
        </div>
      </div>
    ),
    publish: () => (
      <>
        <div className="flex flex-wrap gap-1.5">
          {(t.raw("publishTags") as string[]).map((tag) => (
            <span key={tag} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#e3ebed] bg-white px-2.5 text-xs font-semibold text-ink-700">
              <i className="size-[7px] rounded-full bg-[#16a34a]" />
              <bdi>{tag}</bdi>
            </span>
          ))}
        </div>
        <span className="inline-flex h-[30px] items-center gap-1.5 self-start rounded-[10px] bg-teal-900 px-3 text-xs font-bold text-white">
          <UploadCloud className="size-3.5" />
          {t("publish")}
        </span>
      </>
    ),
    cod: () => (
      <div className="flex items-center justify-between gap-2 rounded-[12px] border border-[#e6eef0] bg-white px-3 py-2.5 text-xs font-semibold text-teal-900">
        <span className="flex items-center gap-2">
          <Banknote className="size-4 text-teal-700" />
          {t("stepMock.cod")}
        </span>
        <MockToggle />
      </div>
    ),
    zones: () => (
      <div className="grid gap-1.5">
        {(t.raw("stepMock.zones") as string[][]).map(([name, price]) => (
          <div key={name} className="flex items-center justify-between gap-2 rounded-[10px] border border-[#e6eef0] bg-white px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-teal-900">{name}</span>
            <MockCode>{price}</MockCode>
          </div>
        ))}
      </div>
    ),
    confirm: () => (
      <>
        <span className="inline-flex h-[30px] items-center gap-1.5 self-start rounded-[10px] bg-[#16a34a] px-3 text-xs font-bold text-white">
          <MessageCircle className="size-3.5" />
          {t("stepMock.ask")}
        </span>
        <MockPill className="self-start">{t("stepMock.confirmed")}</MockPill>
      </>
    ),
  };
  return <>{pictures[visual]()}</>;
}

/** A keyword landing page. Prices and capabilities match the product; templates come from the real catalog. */
export async function SolutionPageView({ solution }: { solution: Solution }) {
  const [locale, t, kinds] = await Promise.all([getLocale(), getTranslations(`solutionPages.${solution.slug}`), getTranslations("storeKinds")]);
  const shared = await getTranslations("solutionPages.shared");
  const path = `/solutions/${solution.slug}`;

  // Price tokens stay in the copy; `withPrices` shows them in the visitor's currency.
  const trust = t.raw("trust") as string[];
  const intro = t.raw("intro") as string[];
  const steps = t.raw("steps") as Titled[];
  const features = t.raw("features") as Titled[];
  const cost = solution.cost ? (t.raw("cost") as CostRow[]) : [];
  const faq = t.raw("faq") as FaqItem[];
  const related = t.raw("related") as Titled[];
  const gallery = await getTemplateGallery(locale);
  // The phone's store follows the page (`Solution.stage`), and falls back to clothing until that industry has an entry.
  const industry = findIndustry(solution.stage.store) ?? findIndustry("clothing-store")!;
  const store = buildMockStore((await getTranslations(`industryPages.${industry.slug}`)).raw("store") as Parameters<typeof buildMockStore>[0], industry);

  return (
    <>
      <PageTrail path={path} items={[{ label: shared("crumbHub"), href: "/solutions" }, { label: t("crumb") }]} />

      <section className="pt-8 pb-10 text-center sm:pt-11">
        <Container>
          <h1 className="mx-auto max-w-[900px] text-[clamp(34px,5.6vw,60px)] leading-[1.25] font-bold text-balance text-teal-900 en:leading-[1.1] en:tracking-[-0.02em] [&_em]:text-amber-700">{t.rich("title", richTags)}</h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[clamp(16px,2vw,19px)] text-pretty text-ink-500">
            {withPrices(t("lead", PRICE_TOKENS), bidi)}
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <SlugClaimForm className="w-full sm:w-[480px]" submitLabel={shared("createStore")} />
            <Link href="/pricing" className="text-sm font-bold text-teal-700">
              {shared("seePricing")}
            </Link>
            <FreeTermsNote className="mx-auto max-w-[560px]" />
          </div>
          <div className="mx-auto mt-10 max-w-[1040px] text-start">
            <DeviceStage store={store}>
              <DashboardScreen slug={solution.slug} scene={solution.stage.dashboard} />
            </DeviceStage>
            <p className="mt-9 text-center text-xs text-ink-400">{shared("illustration")}</p>
          </div>
        </Container>
      </section>

      <section className="pt-6 pb-2">
        <Container>
          <Reveal as="ul" className="grid rounded-card border border-[#e3ebed] bg-white shadow-[0_10px_30px_rgba(13,55,67,0.05)] min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {trust.map((item, i) => {
              const Icon = solution.trustIcons[i]!;
              return (
                <li key={item} className="flex items-center gap-3 border-[#edf1f2] px-[18px] py-3.5 text-[15px] font-semibold text-teal-900 not-first:border-t min-[641px]:even:border-s min-[641px]:[&:nth-child(2)]:border-t-0 min-[1081px]:border-t-0 min-[1081px]:not-first:border-s min-[1081px]:px-[22px] min-[1081px]:py-5">
                  <IconTile className="size-10 rounded-xl">
                    <Icon aria-hidden />
                  </IconTile>
                  {withPrices(item, bidi)}
                </li>
              );
            })}
          </Reveal>
        </Container>
      </section>

      <Section>
        <Container className="grid items-start gap-5 min-[1081px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[1081px]:gap-14">
          <h2 className="text-[clamp(28px,4vw,40px)] leading-[1.35] font-bold text-balance text-teal-900 min-[1081px]:sticky min-[1081px]:top-24">{t("introTitle")}</h2>
          <Reveal className="grid gap-[18px] text-[17px] leading-[1.95] text-[#3d5055]">
            {intro.map((paragraph) => (
              <p key={paragraph} className="text-pretty">
                {withPrices(paragraph, bidi)}
              </p>
            ))}
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading kicker={shared("stepsKicker")} title={t("stepsTitle")} centered />
          <div className="grid gap-4 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal as="article" key={step.title} className="flex flex-col gap-3 rounded-[26px] border border-[#e6eef0] bg-white/90 p-5">
                <div aria-hidden className="flex h-[120px] flex-col justify-center gap-2 overflow-hidden rounded-[18px] border border-[#edf1f2] bg-gradient-to-b from-[#f2f7f8] to-white p-3.5">
                  <StepPicture visual={solution.stepVisuals[i]!} productName={store.products[0]!.name} photo={industry.photo} />
                </div>
                <Num className="grid size-[34px] place-items-center rounded-full bg-amber-600 text-sm font-bold text-teal-900">{i + 1}</Num>
                <h3 className="text-[17px] leading-normal font-bold text-teal-900">{step.title}</h3>
                <p className="text-sm text-pretty text-ink-500">
                  {withPrices(step.body, bidi)}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading kicker={shared("featuresKicker")} title={shared("featuresTitle")} centered />
          <div className="grid gap-4 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {features.map((item, i) => {
              const Icon = solution.featureIcons[i]!;
              const href = solution.featureHrefs?.[i];
              return (
                <Reveal key={item.title}>
                  <SiteCard className="h-full p-[22px]">
                    <IconTile className="mb-3.5">
                      <Icon aria-hidden />
                    </IconTile>
                    <h3 className="mb-1.5 text-[17px] font-bold text-teal-900">
                      {href ? (
                        <Link href={href} className="text-inherit underline decoration-teal-300 underline-offset-4 hover:decoration-teal-700">
                          <BidiText text={item.title} />
                        </Link>
                      ) : (
                        <BidiText text={item.title} />
                      )}
                    </h3>
                    <p className="text-sm text-pretty text-ink-500">
                      {withPrices(item.body, bidi)}
                    </p>
                  </SiteCard>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section id="templates" className="bg-white/50">
        <Container>
          <SectionHeading kicker={shared("templatesKicker")} title={shared("templatesTitle")} description={shared("templatesLead")} centered />
          <TemplateRail
            entries={CARD_KINDS.flatMap((code) => gallery.filter((entry) => entry.category === code).slice(0, PER_CATEGORY))}
            categories={CARD_KINDS.filter((code) => gallery.some((entry) => entry.category === code)).map((code) => ({ id: code, label: shared(`categories.${code}`) }))}
            locale={locale}
            ariaLabel={shared("templatesKicker")}
            previewLabel={shared("preview")}
          />
          <div className="mt-7 flex justify-center">
            <CtaButton asChild tone="outline">
              <Link href="/templates">
                {shared("allTemplates")}
                <ForwardArrow />
              </Link>
            </CtaButton>
          </div>
        </Container>
      </Section>

      {solution.cost ? (
        <Section>
          <Container>
            <SectionHeading kicker={shared("costKicker")} title={t("costTitle")} description={shared("costLead")} centered />
            <Reveal className="grid grid-cols-2 overflow-hidden rounded-card-lg border border-[#e3ebed] bg-white shadow-[0_18px_44px_rgba(13,55,67,0.06)] min-[761px]:grid-cols-3">
              <div className="hidden p-5 min-[761px]:block" />
              <div className="flex items-center bg-[rgba(20,81,99,0.05)] px-4 py-5 min-[761px]:px-[22px]">
                <Image src="/logo-primary.png" alt="طلبي" width={94} height={24} className="h-6 w-auto" />
              </div>
              <div className="flex items-center px-4 py-5 min-[761px]:px-[22px]">
                <span className="inline-flex min-h-8 items-center rounded-[14px] bg-[#eef0f1] px-3.5 py-1 text-sm font-bold text-balance text-[#4a5558]">{shared("costOther")}</span>
              </div>
              {cost.map((row) => (
                <div key={row.label} className="contents">
                  <div className="col-span-2 border-t border-[#edf1f2] px-4 pt-3.5 pb-0.5 text-[15px] font-semibold text-ink-700 min-[761px]:col-span-1 min-[761px]:border-[#f0f3f4] min-[761px]:px-[22px] min-[761px]:py-[15px]">{row.label}</div>
                  <div className="bg-[rgba(20,81,99,0.05)] px-4 pt-1 pb-3.5 text-[15px] font-semibold text-teal-900 min-[761px]:border-t min-[761px]:border-[#f0f3f4] min-[761px]:px-[22px] min-[761px]:py-[15px]">
                    {withPrices(row.tallaby, bidi)}
                  </div>
                  <div className="px-4 pt-1 pb-3.5 text-[15px] text-[#4a5c61] min-[761px]:border-t min-[761px]:border-[#f0f3f4] min-[761px]:px-[22px] min-[761px]:py-[15px]">{row.other}</div>
                </div>
              ))}
            </Reveal>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-500">
              <span>{shared("costNote")}</span>
              <Link href="/pricing" className="inline-flex items-center gap-1.5 font-bold text-teal-700">
                {shared("costPricing")}
                <ForwardArrow />
              </Link>
            </div>
            <FreeTermsNote className="mt-2" />
          </Container>
        </Section>
      ) : null}

      <Section>
        <Container>
          <SectionHeading kicker={shared("kindsKicker")} title={shared("kindsTitle")} description={shared("kindsLead")} centered />
          <div className="mx-auto flex max-w-[900px] flex-wrap justify-center gap-2.5">
            {STORE_KIND_LINKS.map(({ key, icon: Icon, href }) => (
              <Link
                key={key}
                href={href}
                className="group inline-flex h-12 items-center gap-2 rounded-full border border-[#e3ebed] bg-white px-5 text-[15px] font-semibold text-teal-900 transition-colors duration-150 hover:border-teal-700 hover:bg-teal-900 hover:text-white hover:no-underline"
              >
                <Icon className="size-[17px] text-teal-700 group-hover:text-amber-600" aria-hidden />
                {kinds(key)}
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <FaqBlock items={faq} title={t("faqTitle")} />

      <Section>
        <Container>
          <SectionHeading title={shared("relatedTitle")} centered />
          <div className="grid gap-3.5 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {related.map((item, i) => {
              const { href, icon: Icon } = solution.related[i]!;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col gap-2 rounded-[22px] border border-[#e3ebed] bg-white p-5 text-inherit transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-teal-300 hover:no-underline hover:shadow-[0_14px_32px_rgba(13,55,67,0.08)] motion-reduce:hover:translate-y-0"
                >
                  <IconTile className="mb-1">
                    <Icon aria-hidden />
                  </IconTile>
                  <b className="flex items-center justify-between gap-2 text-base text-teal-900">
                    {item.title}
                    <ForwardArrow className="flex-none text-teal-500" />
                  </b>
                  <p className="text-sm text-ink-500">{item.body}</p>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <ClosingCta title={t("closingTitle")} />
    </>
  );
}
