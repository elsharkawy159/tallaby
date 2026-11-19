import { getLocale, getTranslations } from "next-intl/server";
import { getMarketingPriceVars } from "@/lib/marketing/exchange-rate.server";
import { fillPriceTokens, metaUsdPriceVars } from "@/lib/marketing/pricing.lib";
import { localizedUrl } from "@/lib/marketing/seo.lib";
import { faqSchema, serializeJsonLd, softwareApplicationSchema } from "@/lib/marketing/structured-data.lib";

/** Structured data for search engines; renders nothing visible. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

/** The product's SoftwareApplication data on the home and pricing pages. */
export async function ProductJsonLd({ page, path }: { page: "home" | "pricing"; path: string }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  const prices = await getMarketingPriceVars(locale, { isolate: false });
  return (
    <JsonLd
      data={softwareApplicationSchema({
        url: localizedUrl(locale, path),
        description: t(`${page}.description`, { ...prices, ...metaUsdPriceVars(locale) }),
        inLanguage: locale,
      })}
    />
  );
}

/**
 * FAQPage data for the questions a page shows from `<namespace>.items` (the
 * same strings its FaqAccordion renders). `values` fills the page's own
 * non-price tokens first, as the page does; prices are then filled in EGP.
 */
export async function FaqJsonLd({ namespace, values }: { namespace: string; values?: Record<string, string> }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations(namespace)]);
  const prices = await getMarketingPriceVars(locale, { isolate: false });
  const items = (t.raw("items") as { q: string; a: string }[]).map((item) => ({
    q: String(item.q),
    a: values ? fillPriceTokens(String(item.a), values) : String(item.a),
  }));
  return <JsonLd data={faqSchema(items, prices)} />;
}
