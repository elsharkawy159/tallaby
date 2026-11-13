import * as React from "react";
import Image from "next/image";
import { Bell, Check, CircleCheck, ShoppingBag, Sparkles, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BidiText, ClosingCta, FaqBlock, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { DeviceStage, type MockStore, type MockStoreProduct } from "@/components/marketing/pages/store-mock.client";
import { TemplateRailCard } from "@/components/marketing/pages/template-rail";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { BrandIcon } from "@/components/marketing/site/brand-icon";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { IconTile } from "@/components/marketing/site/site-card";
import { industryTemplates, STORE_KIND_LINKS, type Industry, type IndustryNeedVisual } from "@/lib/marketing/industries.lib";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import { cn } from "@workspace/ui/lib/utils";
import { CountdownBoxes, IndustryShowcase } from "./industry-showcase.client";

type StoreMessages = Omit<MockStore, "photo" | "products" | "heroCover"> & { products: Pick<MockStoreProduct, "name" | "price" | "was" | "note">[] };
/** One need's words; the optional fields feed its picture. */
export type NeedMessages = {
  title: string;
  pain: string;
  solution: string;
  stock?: string;
  offer?: string;
  lead?: string;
  handle?: string;
  tag?: string;
  viewProducts?: string;
  /** sizes, specs, offers, notes, alert, restock: the picture's small heading. */
  label?: string;
  /** sizes: each option and its price. */
  options?: { label: string; price: string }[];
  /** specs and zones: label and value rows. */
  rows?: { k: string; v: string }[];
  /** zones, reviews, notes: a line under the picture. */
  note?: string;
  /** offers: quantity tiers. */
  tiers?: { qty: string; price: string; save?: string }[];
  /** reviews: product reviews as the store shows them. */
  reviews?: { text: string }[];
  /** notes: what a customer wrote. */
  text?: string;
  /** alert: the phone notification. */
  app?: string;
  time?: string;
  body?: string;
  /** restock: the sold-out form. */
  button?: string;
  placeholder?: string;
};

/** Builds the mock store from the page's words and the entry's photo and swatches. */
export function buildMockStore(words: StoreMessages, industry: Pick<Industry, "photo" | "productFocus" | "productColors" | "productPhotos" | "heroCover">): MockStore {
  return {
    ...words,
    photo: industry.photo,
    heroCover: industry.heroCover,
    products: words.products.map((product, i) => ({
      ...product,
      focus: industry.productFocus[i] ?? "50% 50%",
      colors: industry.productColors[i] ?? [],
      ...(industry.productPhotos?.[i] ? { image: industry.productPhotos[i] } : {}),
    })),
  };
}

const ROW = "flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2 text-[13px] shadow-[0_0_0_1px_#e6eef0]";

function NeedVisual({ visual, need, store, labels }: { visual: IndustryNeedVisual; need: NeedMessages; store: MockStore; labels: { hours: string; minutes: string; seconds: string } }) {
  const product = store.products[0]!;
  // The first demo product with colours (the clothing page's first; others have them on the second).
  const swatches = store.products.find((item) => item.colors.length)?.colors ?? [];
  const views: Record<IndustryNeedVisual, () => React.ReactNode> = {
    variants: () => (
      <>
        <span className="text-xs font-semibold text-ink-400">{store.sizeLabel}</span>
        <div className="flex flex-wrap gap-1.5">
          {store.sizes.map((size, i) => (
            <span
              key={size}
              className={cn(
                "grid h-[34px] min-w-[38px] place-items-center rounded-[10px] border-[1.5px] border-line-strong bg-white px-2.5 font-latin text-[13px] font-bold text-ink-700",
                i === store.selectedSize && "border-teal-700 bg-teal-700 text-white",
              )}
            >
              {size}
            </span>
          ))}
        </div>
        {swatches.length ? <span className="text-xs font-semibold text-ink-400">{store.colorLabel}</span> : null}
        <div className="flex gap-2">
          {swatches.map((color, i) => (
            <i key={color} className={cn("block size-6 rounded-full", i === 0 ? "shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-teal-700)]" : "shadow-[0_0_0_2px_#fff,0_0_0_3px_#dfe8ea]")} style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#15803d]">
          <i className="size-[7px] rounded-full bg-[#16a34a]" />
          {need.stock}
        </span>
      </>
    ),
    gallery: () => (
      <div className="grid h-[170px] grid-cols-[2fr_1fr] grid-rows-3 gap-1.5">
        {store.products.map((item, i) => (
          <div key={item.name} className={cn("relative overflow-hidden rounded-[10px] bg-[#e8e1d6]", i === 0 && "row-span-3", i === 1 && "shadow-[0_0_0_2px_var(--color-teal-700)]")}>
            <Image src={item.image ?? store.photo} alt="" fill sizes="160px" className="object-cover" style={{ objectPosition: item.focus }} />
          </div>
        ))}
      </div>
    ),
    countdown: () => (
      <>
        <span className="self-center rounded-full bg-amber-600 px-3.5 py-1 text-sm font-bold text-teal-900">{need.offer}</span>
        <CountdownBoxes labels={[labels.hours, labels.minutes, labels.seconds]} />
        <span className="text-center text-xs font-semibold text-ink-400">{need.lead}</span>
      </>
    ),
    catalog: () => (
      <div dir="ltr" className="overflow-hidden rounded-[14px] border border-[#edf1f2] bg-white">
        <div className="flex items-center gap-2 px-2.5 py-2 font-latin text-xs font-bold">
          <span className="grid size-[22px] place-items-center rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
            <BrandIcon name="instagram" className="size-3" />
          </span>
          {need.handle}
        </div>
        <div className="relative h-24 overflow-hidden bg-[#e8e1d6]">
          <Image src={product.image ?? store.photo} alt="" fill sizes="240px" className="object-cover" style={{ objectPosition: product.image ? "50% 50%" : "60% 45%" }} />
          <span dir="auto" className="absolute start-2.5 bottom-2.5 z-[1] rounded-lg bg-white/95 px-2 py-1 text-[11.5px] font-bold text-[#1f2326]">
            {need.tag}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-[#f0f0f0] px-2.5 py-2 text-xs font-semibold">
          <span dir="auto">{need.viewProducts}</span>
          <ShoppingBag className="size-3.5" />
        </div>
      </div>
    ),
    sizes: () => (
      <>
        <span className="text-xs font-semibold text-ink-400">{need.label}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {need.options?.map((option, i) => (
            <span key={option.label} className={cn("rounded-[10px] border-[1.5px] border-line-strong bg-white px-1.5 py-2 text-center text-ink-700", i === 1 && "border-teal-700 bg-teal-700 text-white")}>
              <b className="block text-[13px]">{option.label}</b>
              <small className="text-[11.5px] opacity-80">
                {option.price} {store.currency}
              </small>
            </span>
          ))}
        </div>
      </>
    ),
    specs: () => (
      <>
        {need.label ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-100 px-2.5 py-0.5 text-[11.5px] font-bold text-[#7a4a00]">
            <Sparkles className="size-3" />
            {need.label}
          </span>
        ) : null}
        <dl className="grid gap-1">
          {need.rows?.map((row) => (
            <div key={row.k} className={ROW}>
              <dt className="text-ink-400">{row.k}</dt>
              <dd className="font-semibold text-teal-900">{row.v}</dd>
            </div>
          ))}
        </dl>
      </>
    ),
    zones: () => (
      <>
        <div className="grid gap-1">
          {need.rows?.map((row) => (
            <div key={row.k} className={ROW}>
              <span className="text-ink-700">{row.k}</span>
              <b className="text-teal-900">
                {row.v} {store.currency}
              </b>
            </div>
          ))}
        </div>
        {need.note ? <span className="text-center text-xs font-semibold text-[#15803d]">{need.note}</span> : null}
      </>
    ),
    offers: () => (
      <>
        <span className="text-xs font-semibold text-ink-400">{need.label}</span>
        <div className="grid gap-1.5">
          {need.tiers?.map((tier, i) => (
            <div key={tier.qty} className={cn(ROW, i === 1 && "shadow-[0_0_0_2px_var(--color-teal-700)]")}>
              <span className="flex items-center gap-2 font-semibold text-teal-900">
                <i className={cn("block size-3.5 rounded-full border-2 border-line-strong", i === 1 && "border-[4px] border-teal-700")} />
                {tier.qty}
              </span>
              <span className="flex items-center gap-1.5">
                {tier.save ? <small className="rounded-full bg-amber-100 px-2 text-[11px] font-bold text-[#7a4a00]">{tier.save}</small> : null}
                <b className="text-teal-900">
                  {tier.price} {store.currency}
                </b>
              </span>
            </div>
          ))}
        </div>
      </>
    ),
    reviews: () => (
      <>
        {need.reviews?.map((review) => (
          <div key={review.text} className="rounded-[12px] bg-white p-3 shadow-[0_0_0_1px_#e6eef0]">
            <span className="mb-1 flex text-amber-600">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3 fill-current" />
              ))}
            </span>
            <p className="text-[12.5px] text-ink-500">{review.text}</p>
          </div>
        ))}
        {need.note ? <span className="text-center text-xs font-semibold text-ink-400">{need.note}</span> : null}
      </>
    ),
    notes: () => (
      <>
        <span className="text-xs font-semibold text-ink-400">{need.label}</span>
        <div className="min-h-[76px] rounded-[12px] border-[1.5px] border-teal-700 bg-white p-3 text-[13px] text-ink-700">{need.text}</div>
        {need.note ? <span className="text-xs font-semibold text-[#15803d]">{need.note}</span> : null}
      </>
    ),
    alert: () => (
      <div className="rounded-[16px] bg-white p-3 shadow-[0_10px_26px_rgba(13,55,67,0.12)]">
        <div className="mb-1 flex items-center justify-between gap-2 text-[11.5px] text-ink-400">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="grid size-5 place-items-center rounded-md bg-teal-900 text-amber-600">
              <Bell className="size-3" />
            </span>
            {need.app}
          </span>
          {need.time}
        </div>
        <b className="block text-[14px] text-teal-900">{need.label}</b>
        <span className="text-[13px] text-ink-500">{need.body}</span>
      </div>
    ),
    restock: () => (
      <>
        <span className="self-start rounded-full bg-[#fde8e4] px-2.5 py-0.5 text-[11.5px] font-bold text-[#b4412f]">{need.label}</span>
        <span className="rounded-[10px] border-[1.5px] border-line-strong bg-white px-3 py-2 text-[13px] text-ink-400">{need.placeholder}</span>
        <span className="rounded-[10px] bg-teal-900 py-2 text-center text-[13px] font-bold text-white">{need.button}</span>
      </>
    ),
  };
  return (
    <div aria-hidden className="flex min-h-[190px] min-w-0 flex-col justify-center gap-2.5 rounded-[20px] border border-[#edf1f2] bg-gradient-to-b from-[#f2f7f8] to-white p-4">
      {views[visual]()}
    </div>
  );
}

/** Pages every industry page links to (SEO_PLAN.md §13.1): the hub, the how-to, the templates and pricing. */
const RELATED_LINKS = [
  { key: "hub", href: "/industries" },
  { key: "create", href: "/solutions/create-online-store" },
  { key: "templates", href: "/templates" },
  { key: "pricing", href: "/pricing" },
] as const;

/** One "store for X" page. Template cards come from the real catalog; everything else is an illustration. */
export async function IndustryPageView({ industry }: { industry: Industry }) {
  const [locale, t, shared, kinds] = await Promise.all([
    getLocale(),
    getTranslations(`industryPages.${industry.slug}`),
    getTranslations("industryPages.shared"),
    getTranslations("storeKinds"),
  ]);
  const path = `/industries/${industry.slug}`;
  const store = buildMockStore(t.raw("store") as StoreMessages, industry);
  const needs = t.raw("needs") as NeedMessages[];
  const steps = t.raw("steps") as { title: string; body: string }[];
  const faq = t.raw("faq") as FaqItem[];
  const checks = t.raw("checks") as string[];
  const floats = t.raw("floats") as string[];
  const callouts = t.raw("callouts") as { title: string; body: string }[];
  const templates = industryTemplates(industry, await getTemplateGallery(locale));
  const others = STORE_KIND_LINKS.filter((kind) => kind.href !== path);
  const Tag = industry.icon;

  return (
    <>
      <PageTrail path={path} items={[{ label: shared("crumbHub"), href: "/industries" }, { label: t("crumb") }]} />

      <section className="overflow-hidden pt-7 pb-14 sm:pt-10 sm:pb-20">
        <Container className="grid items-center gap-12 min-[1081px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="flex min-w-0 flex-col items-center gap-5 text-center min-[1081px]:items-start min-[1081px]:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e1eaec] bg-white py-[5px] ps-1.5 pe-3.5 text-[13.5px] font-bold text-teal-700">
              <span className="grid size-7 place-items-center rounded-full bg-amber-600 text-teal-900">
                <Tag className="size-[15px]" aria-hidden />
              </span>
              {t("tag")}
            </span>
            <h1 className="text-[clamp(32px,4.8vw,56px)] leading-[1.3] font-bold text-balance text-teal-900 en:leading-[1.12] en:tracking-[-0.015em] [&_em]:text-amber-700">{t.rich("title", richTags)}</h1>
            <p className="max-w-[600px] text-[clamp(16px,2vw,19px)] text-pretty text-ink-500">
              <BidiText text={t("lead")} />
            </p>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
              <SignupTrigger size="lg">{shared("createStore")}</SignupTrigger>
              <CtaButton asChild tone="outline" size="lg">
                <Link href="/templates">{shared("browseTemplates")}</Link>
              </CtaButton>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-500 min-[1081px]:justify-start">
              {checks.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-[#16a34a]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[760px] min-w-0">
            <DeviceStage
              store={store}
              floats={floats.map((text, i) => (
                <span
                  key={text}
                  className={cn(
                    "absolute z-[4] rounded-[14px] bg-white px-2.5 py-1.5 text-[11.5px] font-bold whitespace-nowrap text-teal-900 shadow-[0_12px_30px_rgba(13,55,67,0.18)] sm:px-3 sm:py-2 sm:text-[13px]",
                    i === 0 ? "start-[2%] top-10" : "start-[-2%] bottom-[70px] hidden sm:block",
                  )}
                >
                  {text}
                </span>
              ))}
            />
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeading kicker={shared("needsKicker")} title={t("needsTitle")} centered />
          <div className="grid gap-[18px] min-[761px]:grid-cols-2">
            {needs.map((need, i) => {
              const { visual, icon: Icon } = industry.needs[i]!;
              return (
                <Reveal as="article" key={need.title} className="grid items-center gap-[22px] rounded-[26px] border border-[#e6eef0] bg-white/90 p-[18px] sm:p-6 min-[1081px]:grid-cols-2">
                  <div className="min-w-0">
                    <h3 className="mb-2.5 flex items-center gap-2.5 text-[19px] leading-normal font-bold text-teal-900">
                      <IconTile className="size-10 rounded-xl">
                        <Icon aria-hidden />
                      </IconTile>
                      <span>
                        <BidiText text={need.title} />
                      </span>
                    </h3>
                    <p className="mb-2 text-sm text-pretty text-ink-500">{need.pain}</p>
                    <p className="flex gap-2 text-[15px] text-pretty text-ink-700">
                      <CircleCheck className="mt-[5px] size-[17px] flex-none text-[#16a34a]" aria-hidden />
                      <span>
                        <BidiText text={need.solution} />
                      </span>
                    </p>
                  </div>
                  <NeedVisual visual={visual} need={need} store={store} labels={{ hours: shared("hours"), minutes: shared("minutes"), seconds: shared("seconds") }} />
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {templates.length ? (
        <Section>
          <Container>
            <SectionHeading kicker={shared("templatesKicker")} title={t("templatesTitle")} description={shared("templatesLead")} centered />
            <div className="-mx-4 flex gap-3.5 overflow-x-auto scroll-smooth px-[11vw] pt-1.5 pb-[18px] no-scrollbar [scroll-snap-type:x_mandatory] motion-reduce:scroll-auto sm:-mx-5 min-[761px]:mx-0 min-[761px]:grid min-[761px]:grid-cols-3 min-[761px]:gap-5 min-[761px]:overflow-visible min-[761px]:p-0">
              {templates.map((entry) => (
                <TemplateRailCard key={entry.id} entry={entry} locale={locale} previewLabel={shared("preview")} className="flex-[0_0_78vw] min-[761px]:flex-auto" />
              ))}
            </div>
            <div className="mt-5 flex justify-center">
              <CtaButton asChild tone="outline">
                <Link href={`/templates?category=${industry.templateCategory}`}>
                  {shared("allTemplates")}
                  <ForwardArrow />
                </Link>
              </CtaButton>
            </div>
          </Container>
        </Section>
      ) : null}

      <Section>
        <Container>
          <SectionHeading kicker={shared("showKicker")} title={t("showTitle")} description={shared("showLead")} centered />
          <IndustryShowcase store={store} url={t("showUrl")} callouts={callouts} />
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading kicker={shared("stepsKicker")} title={t("stepsTitle")} centered />
          <div className="grid gap-4 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = industry.stepIcons[i]!;
              return (
                <Reveal as="article" key={step.title} className="relative flex flex-col gap-2.5 rounded-[26px] border border-[#e6eef0] bg-white/90 p-6">
                  <Num className="grid size-9 place-items-center rounded-full bg-amber-600 text-sm font-bold text-teal-900">{i + 1}</Num>
                  <Icon className="absolute end-6 top-6 size-[26px] text-teal-300" aria-hidden />
                  <h3 className="text-[17px] leading-normal font-bold text-teal-900">{step.title}</h3>
                  <p className="text-sm text-pretty text-ink-500">
                    <BidiText text={step.body} />
                  </p>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <FaqBlock items={faq} title={t("faqTitle")} />

      <Section>
        <Container>
          <SectionHeading title={shared("othersTitle")} centered />
          <div className="mx-auto flex max-w-[900px] flex-wrap justify-center gap-2.5">
            {others.map(({ key, icon: Icon, href }) => (
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
          <nav aria-label={shared("relatedLabel")} className="mx-auto mt-8 flex max-w-[900px] flex-wrap justify-center gap-x-6 gap-y-1 text-[15px] font-semibold">
            {RELATED_LINKS.map(({ key, href }) => (
              <Link key={key} href={href} className="inline-flex min-h-11 items-center text-teal-700 underline-offset-4 hover:underline">
                {shared(`related.${key}`)}
              </Link>
            ))}
          </nav>
        </Container>
      </Section>

      <ClosingCta title={t("closingTitle")} />
    </>
  );
}
