import { FREE_ORDER_FEE_USD_CENTS, PRO_MONTHLY_USD_CENTS, TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { PLANS } from "@workspace/lib/plans";
import { COMPARE_PUBLIC, compareSlug, publicCompetitors } from "./compare.lib";
import { FEATURE_PAGES, INTEGRATION_PAGES } from "./detail-pages.lib";
import { INDUSTRIES } from "./industries.lib";
import { formatNumber, formatUsd } from "./pricing.lib";
import { localizedUrl } from "./seo.lib";
import { SITE_URL } from "./site.lib";
import { SOLUTIONS } from "./solutions.lib";
import { TOOL_SLUGS } from "./tools.lib";

/**
 * tallaby.com's /llms.txt (llmstxt.org): a plain English summary of Tallaby
 * for AI assistants, with links to the main pages. Served only on the
 * marketing host (proxy.ts); a store host never reaches app/llms.txt.
 *
 * Every number comes from the billing and plans modules, and every claim
 * follows the content-writer FACTS (.claude/skills/content-writer/FACTS.md):
 * Tallaby doesn't deliver, storefront payments go to the seller, stores sell
 * in their own currency. Link titles are the pages' own English meta titles.
 */
export { LLMS_TXT_PATH } from "./llms-txt-path.lib";

/** One link: a locale-free path and the `meta.<key>` whose title names it. */
export type LlmsLink = { path: string; metaKey: string };
export type LlmsSection = { heading: string; links: LlmsLink[] };

/** The linked pages, by section. Comparisons only while public (never a hidden or stale one). */
export function llmsTxtSections(comparePublic: boolean = COMPARE_PUBLIC, now: number = Date.now()): LlmsSection[] {
  const open = publicCompetitors(comparePublic, undefined, now);
  const alternatives = open.filter((competitor) => competitor.alternative);
  const sections: LlmsSection[] = [
    {
      heading: "Product and pricing",
      links: [
        { path: "/", metaKey: "home" },
        { path: "/pricing", metaKey: "pricing" },
        { path: "/features", metaKey: "features" },
        ...FEATURE_PAGES.map((page) => ({ path: `/features/${page.slug}`, metaKey: `feature-${page.slug}` })),
        { path: "/templates", metaKey: "templates" },
      ],
    },
    {
      heading: "Integrations",
      links: [
        { path: "/integrations", metaKey: "integrations" },
        ...INTEGRATION_PAGES.map((page) => ({ path: `/integrations/${page.slug}`, metaKey: `integration-${page.slug}` })),
      ],
    },
    {
      heading: "Guides by store type and goal",
      links: [
        { path: "/industries", metaKey: "industries" },
        ...INDUSTRIES.map((industry) => ({ path: `/industries/${industry.slug}`, metaKey: `industry-${industry.slug}` })),
        { path: "/solutions", metaKey: "solutions" },
        ...SOLUTIONS.map((solution) => ({ path: `/solutions/${solution.slug}`, metaKey: `solution-${solution.slug}` })),
        { path: "/tools", metaKey: "tools" },
        ...TOOL_SLUGS.map((slug) => ({ path: `/tools/${slug}`, metaKey: `tool-${slug}` })),
      ],
    },
  ];
  if (open.length) {
    sections.push({
      heading: "Comparisons",
      links: [
        { path: "/compare", metaKey: "compare" },
        ...open.map((competitor) => ({ path: `/compare/${compareSlug(competitor)}`, metaKey: `compare-${competitor.id}` })),
        ...(alternatives.length ? [{ path: "/alternatives", metaKey: "alternatives" }] : []),
        ...alternatives.map((competitor) => ({ path: `/alternatives/${competitor.id}`, metaKey: `alternatives-${competitor.id}` })),
      ],
    });
  }
  sections.push({
    heading: "Help and company",
    links: [
      { path: "/faq", metaKey: "faq" },
      { path: "/blog", metaKey: "blog" },
      { path: "/stores", metaKey: "stores" },
      { path: "/about", metaKey: "about" },
      { path: "/contact", metaKey: "contact" },
    ],
  });
  return sections;
}

/** The facts paragraph list, numbers from code. */
function keyFacts(): string[] {
  const free = PLANS.free;
  const pro = PLANS.pro;
  return [
    `Free plan: no monthly fee and no percentage of sales; ${formatUsd(FREE_ORDER_FEE_USD_CENTS)} per created order, taken from the store's prepaid wallet. Includes ${formatNumber(free.aiCreditsMonthly)} AI credits and ${formatNumber(free.emailsMonthly)} campaign emails a month.`,
    `Pro plan: ${formatUsd(PRO_MONTHLY_USD_CENTS)} a month from the store wallet, no order fee, ${formatNumber(pro.aiCreditsMonthly)} AI credits and ${formatNumber(pro.emailsMonthly)} campaign emails a month. Both plans have the same store features.`,
    `A store takes orders from day one with no card. A first wallet top-up (from ${formatUsd(TOP_UP_MIN_USD_CENTS)}, payable in Egyptian pounds) is needed soon after to keep seeing new orders and to send campaigns.`,
    "Payments go to the seller: cash on delivery, InstaPay and mobile wallets pay the seller's own details, and cards go through the seller's own Paymob or Kashier account. Tallaby takes no cut of sales.",
    "Tallaby does not deliver orders. Sellers ship with their own riders or a shipping company; Bosta is the built-in carrier integration.",
    "Sell in Egypt and worldwide: each store chooses its own currency and the countries it ships to.",
    "Live integrations: Bosta, Paymob, Kashier, Meta Pixel and Conversions API, Google Analytics 4, Google Tag Manager, Google Sheets, Shopify product import and product feeds.",
    "Stores are built from ready-made templates and edited in a visual builder, in Arabic and English. AI writes product titles and descriptions in both languages.",
    "Every store gets a free yourbrand.tallaby.com address and can connect its own domain.",
  ];
}

/** The whole file. `title(metaKey)` gives a page's English meta title. */
export function buildLlmsTxt(title: (metaKey: string) => string, sections: LlmsSection[] = llmsTxtSections()): string {
  const lines = [
    "# Tallaby (طلبي)",
    "",
    "> Tallaby is an online store builder. Sellers open their own branded online store, with no code, and sell in Egypt and worldwide. The free plan has no monthly fee and charges a small flat fee per order; Pro is a fixed monthly price with no order fee.",
    "",
    "Tallaby is for small sellers and brands, mostly in Egypt and the Arab world, who sell on Instagram, Facebook or WhatsApp and want a store of their own. The site and the dashboard are in Arabic (default) and English.",
    "",
    "## Key facts",
    "",
    ...keyFacts().map((fact) => `- ${fact}`),
    "",
    ...sections.flatMap((section) => [
      `## ${section.heading}`,
      "",
      ...section.links.map((link) => `- [${title(link.metaKey)}](${localizedUrl("en", link.path)})`),
      "",
    ]),
    "## Languages",
    "",
    `- The English pages above live under ${SITE_URL}/en; the same pages in Arabic are at the same path without /en (for example ${localizedUrl("ar", "/pricing")}).`,
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ];
  return lines.join("\n");
}
