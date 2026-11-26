/**
 * schema.org data for the tallaby.com pages. Only facts shown on the site:
 * never add ratings, reviews or user counts here unless they are real and
 * visible on the page.
 */
import { FREE_ORDER_FEE_USD_CENTS, PRO_MONTHLY_USD_CENTS } from "@workspace/lib/billing";
import { fillPriceTokens, stripBidiIsolates } from "./pricing.lib";
import { CONTACT, SITE_URL, SOCIAL_LINKS } from "./site.lib";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const BRAND = { name: "Tallaby", alternateName: "طلبي" };
const LOGO_URL = `${SITE_URL}/logo-mark.png`;

/**
 * The Organization as another node names it (a blog post's publisher): the
 * same @id and names as `siteGraph`, so both describe one entity.
 */
export function organizationReference() {
  return { "@type": "Organization", "@id": ORGANIZATION_ID, ...BRAND, logo: { "@type": "ImageObject", url: LOGO_URL } };
}

/**
 * Organization and WebSite for every marketing page. `description` and
 * `knowsAbout` come from the page's language (`site.schema` messages). No
 * founder or founding date: the repo states neither.
 */
export function siteGraph({ description, knowsAbout }: { description: string; knowsAbout: readonly string[] }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        ...BRAND,
        url: SITE_URL,
        logo: LOGO_URL,
        description,
        // Based in Cairo (the About page), serving sellers anywhere.
        address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
        areaServed: "Worldwide",
        knowsAbout: [...knowsAbout],
        sameAs: Object.values(SOCIAL_LINKS).map((s) => s.href),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT.email,
          telephone: CONTACT.phoneTel,
          availableLanguage: ["ar", "en"],
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        ...BRAND,
        url: SITE_URL,
        inLanguage: ["ar", "en"],
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

/** A USD price as schema.org text: "0.03", "29" (from integer cents). */
const usdPrice = (cents: number) => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));

/**
 * The product itself, for the home and pricing pages. Both plans in USD, the
 * currency sellers are billed in (`@workspace/lib/billing`), so the data does
 * not move with the daily EGP rate: Free is 0 a month plus a fee per delivered order,
 * Pro a monthly price and no order fee.
 */
export function softwareApplicationSchema({ url, description, inLanguage }: { url: string; description: string; inLanguage: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    ...BRAND,
    url,
    description,
    inLanguage,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    publisher: { "@id": ORGANIZATION_ID },
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: usdPrice(FREE_ORDER_FEE_USD_CENTS),
          priceCurrency: "USD",
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "delivered order" },
        },
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: usdPrice(PRO_MONTHLY_USD_CENTS),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: usdPrice(PRO_MONTHLY_USD_CENTS),
          priceCurrency: "USD",
          billingDuration: "P1M",
        },
      },
    ],
  };
}

/**
 * FAQPage data from the same strings the accordion shows; price tokens are
 * filled with `prices` (one currency, EGP), bidi isolates removed.
 */
export function faqSchema(items: readonly { q: string; a: string }[], prices: Record<string, string> = {}) {
  const plain = (text: string) => stripBidiIsolates(fillPriceTokens(text, prices));
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: plain(item.q),
      acceptedAnswer: { "@type": "Answer", text: plain(item.a) },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** JSON for a `<script type="application/ld+json">`: `<` escaped so text can never close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
