import { Lightbulb } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { BidiText, ClosingCta, FaqBlock, FreeTermsNote, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { Container, Eyebrow, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { richTags } from "@/components/marketing/site/rich-text";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { getMarketingEgpPerUsd, getMarketingPriceVars } from "@/lib/marketing/exchange-rate.server";
import { PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { calculateMargin, DEFAULT_MARGIN_INPUT, markupPct, TARGET_MARGIN } from "@/lib/marketing/margin-calculator.lib";
import { localizedUrl } from "@/lib/marketing/seo.lib";
import { cn } from "@workspace/ui/lib/utils";
import { MarginCalculator } from "./margin-calculator.client";
import { ToolRelated } from "./tool-related";

const SLUG = "profit-margin-calculator";
const FAQ_KEYS = ["markup", "healthy", "shipping", "ads", "saved", "fee"] as const;
const FORMULA_KEYS = ["cost", "profit", "margin", "suggested"] as const;

const money = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
const percent = (value: number) => `${value.toFixed(1)}%`;

/** The page's worked example comes from the same function as the calculator, so the two can't disagree. */
export async function MarginToolPage() {
  const [locale, t, egpPerUsd] = await Promise.all([getLocale(), getTranslations(`toolPages.${SLUG}`), getMarketingEgpPerUsd()]);
  // The calculator works in pounds, so its fee notes and worked example quote EGP.
  const prices = await getMarketingPriceVars(locale);
  const path = `/tools/${SLUG}`;

  // The fee at the live rate (owner, 2026-11-09: prices show in EGP).
  const example = { ...DEFAULT_MARGIN_INPUT, egpPerUsd };
  const result = calculateMargin(example);
  const margin = result.marginPct ?? 0;
  const values = {
    profit: money(result.profit),
    margin: percent(margin),
    markup: percent(markupPct(result.profit, result.cost)),
    fee: money(result.fee),
    ...prices,
  };

  const faq: FaqItem[] = FAQ_KEYS.map((key) => ({ q: t(`faq.${key}.q`), a: t(`faq.${key}.a`, values) }));
  const steps = t.raw("how.steps") as { title: string; body: string }[];
  const unit = t("calculator.currency");

  const rows: { label: string; value: string; currency?: boolean; tone?: "sub" | "result" | "suggested" }[] = [
    { label: t("example.buy"), value: money(example.buy), currency: true },
    { label: t("example.ship"), value: money(example.ship), currency: true },
    { label: t("example.ad"), value: money(example.ad), currency: true },
    { label: t("example.fee", prices), value: money(result.fee), currency: true },
    { label: t("example.cost"), value: money(result.cost), currency: true, tone: "sub" },
    { label: t("example.sell"), value: money(example.sell), currency: true },
    { label: t("example.profit", { sell: money(example.sell), cost: money(result.cost) }), value: money(result.profit), currency: true, tone: "result" },
    { label: t("example.margin", { profit: money(result.profit), sell: money(example.sell) }), value: percent(margin), tone: "result" },
    {
      label: t("example.suggested", { cost: money(result.cost), keep: String(1 - TARGET_MARGIN) }),
      value: money(result.suggestedPrice ?? 0),
      currency: true,
      tone: "suggested",
    },
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
        <h1 className="text-[clamp(28px,4.4vw,48px)] leading-[1.3] font-bold text-balance text-teal-900 en:leading-[1.15] en:tracking-[-0.01em]">
          {t.rich("title", richTags)}
        </h1>
        <p className="mt-3 text-[clamp(16px,1.8vw,18px)] text-pretty text-ink-500">{t("lead")}</p>
      </Container>

      <section className="pb-14">
        <Container>
          <MarginCalculator egpPerUsd={egpPerUsd} prices={prices} />
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
          <SectionHeading title={t("how.title")} centered />
          <div className="grid gap-4 min-[961px]:grid-cols-3">
            {steps.map((step, i) => (
              <article key={step.title} className="rounded-card border border-line bg-white p-6">
                <Num className="mb-3.5 grid size-[38px] place-items-center rounded-full bg-amber-600 text-[15px] font-bold text-teal-900">{i + 1}</Num>
                <h3 className="mb-1.5 text-[17px] font-bold text-teal-900">{step.title}</h3>
                <p className="text-[14.5px] text-pretty text-ink-500">{step.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("formula.title")} centered />
          <div className="grid items-start gap-5 min-[961px]:grid-cols-2 min-[961px]:gap-6">
            <div>
              <p className="mb-3.5 text-[16.5px] leading-[1.95] text-pretty text-[#3d5055]">{t("formula.body")}</p>
              <div className="mt-1.5 grid gap-3 rounded-[22px] bg-teal-900 px-6 py-[22px] text-white">
                {FORMULA_KEYS.map((key) => (
                  <div key={key} className="flex flex-wrap items-center gap-2 text-[15.5px] leading-[1.6]">
                    {t(`formula.${key}.result`)}
                    <span className="font-latin text-lg font-extrabold text-amber-600">=</span>
                    {t(`formula.${key}.expression`)}
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-card border border-line bg-white">
              <h3 className="flex items-center gap-2 border-b border-line-soft px-5 py-4 text-base font-bold text-teal-900">
                <Lightbulb className="size-5 text-amber-700" aria-hidden />
                {t("example.title")}
              </h3>
              <table className="w-full border-collapse text-[15px]">
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.label}
                      className={cn(
                        "border-t border-[#f0f3f4] first:border-t-0",
                        row.tone === "sub" && "bg-[#f8fbfb] font-bold text-teal-900",
                        row.tone === "result" && "bg-[#e9f7ee] font-bold text-[#166534]",
                        row.tone === "suggested" && "bg-teal-50 font-bold",
                      )}
                    >
                      <td className="px-4 py-[11px] sm:px-5">
                        <BidiText text={row.label} />
                      </td>
                      <td className="px-4 py-[11px] text-end whitespace-nowrap sm:px-5">
                        <Num className="font-bold">{row.value}</Num>
                        {row.currency ? <span className="ms-1 text-[13px] font-semibold text-ink-400">{unit}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </Section>

      <FaqBlock items={faq} />
      <ToolRelated slug={SLUG} />

      <ClosingCta title={t("closing.title")} body={withPrices(t("closing.body", PRICE_TOKENS))} secondary="pricing" />
    </>
  );
}
