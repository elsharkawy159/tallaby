import { getLocale, getTranslations } from "next-intl/server";
import { BidiText, ClosingCta, FaqBlock, FreeTermsNote, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { Container, Eyebrow, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { richTags } from "@/components/marketing/site/rich-text";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { getMarketingEgpPerUsd, getMarketingPriceVars } from "@/lib/marketing/exchange-rate.server";
import { PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { localizedUrl } from "@/lib/marketing/seo.lib";
import { calculateStoreCost, DEFAULT_STORE_COST_INPUT } from "@/lib/marketing/store-cost.lib";
import { StoreCostCalculator } from "./store-cost-calculator.client";
import { ToolRelated } from "./tool-related";

const SLUG = "store-cost-calculator";
const FAQ_KEYS = ["total", "free", "pro", "domain", "gateway", "shipping", "topUp"] as const;
const money = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** The worked example and the calculator run the same function, so the page and the tool can't disagree. */
export async function StoreCostToolPage() {
  const [locale, t, egpPerUsd] = await Promise.all([getLocale(), getTranslations(`toolPages.${SLUG}`), getMarketingEgpPerUsd()]);
  const prices = await getMarketingPriceVars(locale);
  const path = `/tools/${SLUG}`;
  const bidi = (part: string) => <BidiText text={part} />;

  const example = calculateStoreCost({ ...DEFAULT_STORE_COST_INPUT, egpPerUsd });
  const values = {
    orders: money(DEFAULT_STORE_COST_INPUT.orders),
    average: money(DEFAULT_STORE_COST_INPUT.averageOrder),
    cardShare: money(DEFAULT_STORE_COST_INPUT.cardShare),
    gatewayPct: money(DEFAULT_STORE_COST_INPUT.gatewayPct),
    freeTotal: money(example.free.total),
    proTotal: money(example.pro.total),
    breakEven: money(example.breakEvenOrders),
    ...prices,
  };
  const faq: FaqItem[] = FAQ_KEYS.map((key) => {
    const outside = t.has(`faq.${key}.aOutsideEgypt`) ? (t.raw(`faq.${key}.aOutsideEgypt`) as string) : undefined;
    return { q: t(`faq.${key}.q`), a: t.raw(`faq.${key}.a`) as string, ...(outside && { aOutsideEgypt: outside }) };
  });
  const costs = t.raw("costs.items") as { title: string; body: string }[];
  const unit = t("calculator.currency");
  const rows = [
    { label: t("example.orders"), free: money(DEFAULT_STORE_COST_INPUT.orders), pro: money(DEFAULT_STORE_COST_INPUT.orders), currency: false },
    { label: t("example.platform"), free: money(example.free.platform), pro: money(example.pro.platform), currency: true },
    { label: t("example.gateway"), free: money(example.free.gateway), pro: money(example.pro.gateway), currency: true },
    { label: t("example.total"), free: money(example.free.total), pro: money(example.pro.total), currency: true },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("name"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: locale,
          url: localizedUrl(locale, path),
          offers: { "@type": "Offer", price: "0", priceCurrency: "EGP" },
        }}
      />
      <PageTrail path={path} items={[{ label: t("crumbHub"), href: "/tools" }, { label: t("crumb") }]} />

      <Container className="pt-8 pb-7 text-center">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="text-[clamp(28px,4.4vw,48px)] leading-[1.3] font-bold text-balance text-teal-900 en:leading-[1.15] en:tracking-[-0.01em]">{t.rich("title", richTags)}</h1>
        <p className="mx-auto mt-3 max-w-[680px] text-[clamp(16px,1.8vw,18px)] text-pretty text-ink-500">{withPrices(t("lead", PRICE_TOKENS), bidi)}</p>
      </Container>

      <section className="pb-14">
        <Container>
          <StoreCostCalculator egpPerUsd={egpPerUsd} />
          <div className="mt-[18px] flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-dashed border-teal-300 bg-white p-4 sm:px-[22px] sm:py-[18px]">
            <div className="min-w-0 flex-1 basis-[320px]">
              <b className="text-base text-teal-900">{t("soft.title")}</b>
              <span className="block text-sm text-ink-500">{t("soft.body")}</span>
              <FreeTermsNote className="mt-1" />
            </div>
            <SignupTrigger className="w-full sm:w-auto">{t("soft.cta")}</SignupTrigger>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeading title={t("costs.title")} description={t("costs.lead")} centered />
          <div className="grid gap-4 min-[761px]:grid-cols-2 min-[1081px]:grid-cols-3">
            {costs.map((item) => (
              <article key={item.title} className="rounded-card border border-line bg-white p-6">
                <h3 className="mb-1.5 text-[17px] font-bold text-teal-900">
                  <BidiText text={item.title} />
                </h3>
                <p className="text-[14.5px] text-pretty text-ink-500">{withPrices(item.body, bidi)}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-[860px]">
          <SectionHeading title={t("example.title")} description={t("example.lead", values)} centered />
          <div className="overflow-x-auto rounded-card border border-line bg-white">
            <table className="w-full border-collapse text-[15px]">
              <caption className="sr-only">{t("example.title")}</caption>
              <thead>
                <tr className="bg-[#f8fbfb] text-teal-900">
                  <th scope="col" className="px-4 py-3 text-start sm:px-5">
                    <span className="sr-only">{t("example.item")}</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-latin sm:px-5">
                    Free
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-latin sm:px-5">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i === rows.length - 1 ? "border-t border-line bg-teal-50 font-bold text-teal-900" : "border-t border-[#f0f3f4]"}>
                    <th scope="row" className="px-4 py-[11px] text-start font-semibold sm:px-5">
                      {row.label}
                    </th>
                    {[row.free, row.pro].map((value, j) => (
                      <td key={j} className="px-4 py-[11px] text-end whitespace-nowrap sm:px-5">
                        <Num className="font-bold">{value}</Num>
                        {row.currency ? <span className="ms-1 text-[13px] font-semibold text-ink-400">{unit}</span> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-[13.5px] text-pretty text-ink-500">{t("example.note", values)}</p>
        </Container>
      </Section>

      <FaqBlock items={faq} title={t("faqTitle")} />
      <ToolRelated slug={SLUG} />
      <ClosingCta title={t("closing.title")} body={withPrices(t("closing.body", PRICE_TOKENS), bidi)} secondary="pricing" />
    </>
  );
}
