/**
 * schema.org data for the tallaby.com pages. Only facts shown on the site:
 * never add ratings, reviews or user counts here unless they are real and
 * visible on the page.
 */
import { CONTACT, SITE_URL, SOCIAL_LINKS } from "./site.lib";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const BRAND = { name: "Tallaby", alternateName: "طلبي" };

export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        ...BRAND,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-mark.png`,
        sameAs: Object.values(SOCIAL_LINKS).map((s) => s.href),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT.email,
          telephone: `+20${CONTACT.phone.replace(/^0/, "")}`,
          areaServed: "EG",
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

/**
 * The product itself, for the home and pricing pages. The offer is the free
 * plan only, with the fee in `description` (from the page's own meta text), so
 * a pricing change in the messages carries over.
 */
export function softwareApplicationSchema({
  url,
  description,
  inLanguage,
}: {
  url: string;
  description: string;
  inLanguage: string;
}) {
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
    offers: { "@type": "Offer", price: "0", priceCurrency: "EGP", description },
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
