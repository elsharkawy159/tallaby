import {
  BadgePercent,
  CreditCard,
  Headset,
  Languages,
  Megaphone,
  Palette,
  Rocket,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { COMPETITOR_PRICES, type CompetitorPriceKey } from "./pricing.lib";

/**
 * /compare, /compare/[slug] and /alternatives/[id] (`SEO_PLAN.md` §4.2, §9.2–9.3, S-06).
 *
 * THE SWITCH: the owner hasn't decided about naming competitors. While this is
 * false, these pages are noindex, stay out of the sitemap and aren't linked
 * from the header or footer. Set it to true to make the pages of every
 * competitor with `publish: true` public; nothing else needs to change.
 */
export const COMPARE_PUBLIC = false;

/** y = yes, n = no, p = partly. An unverified fact has no value at all: its row isn't shown. */
export type CellStatus = "y" | "n" | "p";

/**
 * Where a fact comes from. Only `official` (the competitor's own product, pricing
 * or help pages) and `official-blog` count toward `MIN_VERIFIED_FACTS`.
 * `descriptive` is what a thing plainly is (a Facebook page has no domain), shown but not counted.
 */
export type FactMark = "official" | "official-blog" | "third-party" | "descriptive";

export type CompareRowId =
  | "freePlan"
  | "monthly"
  | "orderFee"
  | "salesShare"
  | "activation"
  | "limits"
  | "signup"
  | "noCode"
  | "dragDrop"
  | "import"
  | "domain"
  | "arabicAdmin"
  | "templates"
  | "changeTemplate"
  | "bilingual"
  | "cod"
  | "fakeOrders"
  | "egyptGateways"
  | "transfer"
  | "installments"
  | "egyptCarriers"
  | "riders"
  | "zones"
  | "abandoned"
  | "email"
  | "feeds"
  | "landingPages"
  | "apps"
  | "aiProductCopy"
  | "aiStoreBuilder"
  | "support"
  | "language"
  | "currencies"
  | "egpPricing"
  | "availableInEgypt";

/**
 * The rows, in page order. Tallaby's value comes from the code (the comment
 * says where), never from a competitor page; its text is `comparePage.rows.<id>.tallaby`.
 * Rows where Tallaby is `n` stay visible (§4.2: honest tables).
 */
export const COMPARE_GROUPS: readonly { id: string; icon: LucideIcon; rows: readonly { id: CompareRowId; tallaby: CellStatus }[] }[] = [
  {
    id: "pricing",
    icon: BadgePercent,
    rows: [
      { id: "freePlan", tallaby: "y" }, // PLANS.free, FREE_ORDER_FEE_USD_CENTS
      { id: "monthly", tallaby: "y" }, // PRO_MONTHLY_USD_CENTS
      { id: "orderFee", tallaby: "y" }, // Free pays per order, Pro doesn't
      { id: "salesShare", tallaby: "y" }, // flat fee, no % of the order value
      { id: "activation", tallaby: "p" }, // F-84 grace window, ORDER_GRACE_DAYS + TOP_UP_MIN
      { id: "limits", tallaby: "y" }, // PLANS.*.maxStores
    ],
  },
  {
    id: "setup",
    icon: Rocket,
    rows: [
      { id: "signup", tallaby: "y" },
      { id: "noCode", tallaby: "y" },
      { id: "dragDrop", tallaby: "y" }, // element-tree builder (rule 17)
      { id: "import", tallaby: "y" }, // Excel, URL and Shopify import
      { id: "domain", tallaby: "y" }, // PLANS.*.customDomain
      { id: "arabicAdmin", tallaby: "y" }, // dashboard default locale ar
    ],
  },
  {
    id: "design",
    icon: Palette,
    rows: [
      { id: "templates", tallaby: "y" },
      { id: "changeTemplate", tallaby: "y" },
      { id: "bilingual", tallaby: "y" },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    rows: [
      { id: "cod", tallaby: "y" },
      { id: "fakeOrders", tallaby: "y" }, // F-02 blocklist + WhatsApp confirm
      { id: "egyptGateways", tallaby: "y" }, // seller's own Paymob / Kashier (F-39)
      { id: "transfer", tallaby: "y" }, // F-21p
      { id: "installments", tallaby: "n" },
    ],
  },
  {
    id: "shipping",
    icon: Truck,
    rows: [
      { id: "egyptCarriers", tallaby: "y" }, // Bosta, Wassalha sheet
      { id: "riders", tallaby: "y" },
      { id: "zones", tallaby: "y" },
    ],
  },
  {
    id: "marketing",
    icon: Megaphone,
    rows: [
      { id: "abandoned", tallaby: "y" }, // F-03 missed orders
      { id: "email", tallaby: "y" }, // PLANS.*.emailsMonthly
      { id: "feeds", tallaby: "y" }, // F-11
      { id: "landingPages", tallaby: "n" }, // F-08 delayed
      { id: "apps", tallaby: "p" },
    ],
  },
  {
    id: "ai",
    icon: Sparkles,
    rows: [
      { id: "aiProductCopy", tallaby: "y" }, // PLANS.*.aiCreditsMonthly
      { id: "aiStoreBuilder", tallaby: "n" }, // F-82 off (STORE_BUILDER_AI_ENABLED)
    ],
  },
  { id: "support", icon: Headset, rows: [{ id: "support", tallaby: "y" }] },
  {
    id: "language",
    icon: Languages,
    rows: [
      { id: "language", tallaby: "y" },
      { id: "currencies", tallaby: "n" },
      { id: "egpPricing", tallaby: "p" }, // USD prices shown ≈ EGP, top-ups in EGP
      { id: "availableInEgypt", tallaby: "y" },
    ],
  },
];

/** One fact about a competitor, with the page that proves it (`SEO_PLAN.md` §4.2). Its text is `competitors.<id>.cells.<row>`. */
export type CompetitorFact = {
  status: CellStatus;
  /** The page the fact was read on: an https URL, or a short note for a `descriptive` fact. */
  source: string;
  /** ISO date the source was read. */
  checkedOn: string;
  mark: FactMark;
};

export type Competitor = {
  id: string;
  category: "eg" | "global" | "other";
  featured?: boolean;
  /** Latin name for the search box and the page's chip. */
  latin: string;
  /** How sellers spell it in Arabic (§14.2), for the hub search; never a keyword list in copy. */
  arabicNames: readonly string[];
  /**
   * Public when `COMPARE_PUBLIC` is on. Off keeps a finished page in preview
   * (noindex, out of the sitemap) so the owner can release one competitor at a time.
   */
  publish: boolean;
  /** Only facts we can back up. No entry means the row isn't shown. */
  facts: Partial<Record<CompareRowId, CompetitorFact>>;
  /** Price tokens the competitor's copy uses (each in `COMPETITOR_PRICES`, with its own source). */
  prices: readonly CompetitorPriceKey[];
  /** Also build /alternatives/<id> (same gate). */
  alternative?: boolean;
  /** Drives the "How to move" step 2: Shopify has a direct import; the others go through Excel or a product link. */
  moveSteps: "shopify-import" | "excel-import";
};

/** Below this many official facts a comparison isn't worth a page. */
export const MIN_VERIFIED_FACTS = 4;

/** Facts older than this fail `compare-facts-age.test.ts`: re-read the source before stale prices ship. */
export const MAX_FACT_AGE_DAYS = 90;

const counts = (fact: CompetitorFact | undefined) => fact?.mark === "official" || fact?.mark === "official-blog";

/** The day the six comparisons were researched (raw notes: `docs/seo-research/04-compare-2026-11-10.md`). */
const READ_ON = "2026-11-10";

/** A fact read on the competitor's own page (or its own blog, roadmap or docs). */
const official = (status: CellStatus, source: string, checkedOn: string = READ_ON): CompetitorFact => ({ status, source, checkedOn, mark: "official" });
/** A fact from someone else's page (a partner's docs): shown, never counted. */
const thirdParty = (status: CellStatus, source: string, checkedOn: string = READ_ON): CompetitorFact => ({ status, source, checkedOn, mark: "third-party" });

const EO = {
  pricing: "https://www.easyorders.eg/pricing.md",
  ai: "https://www.easyorders.eg/create-ecommerce-store-with-ai.md",
  index: "https://www.easyorders.eg/index.md",
  themes: "https://www.easyorders.eg/themes.md",
  roadmap: "https://roadmap.easyorders.ai/ar",
  api: "https://public-api-docs.easy-orders.net",
};

const SHOPIFY = {
  pricing: "https://www.shopify.com/eg/pricing",
  builder: "https://www.shopify.com/website/builder",
  import: "https://help.shopify.com/en/manual/products/import-export/import-products",
  adminLanguages: "https://help.shopify.com/en/manual/your-account/languages",
  storeLanguages: "https://help.shopify.com/en/manual/international/languages/requirements",
  themes: "https://themes.shopify.com/themes?price%5B%5D=free",
  manualPayments: "https://help.shopify.com/en/manual/payments/manual-payments",
  fraud: "https://help.shopify.com/en/manual/fulfillment/managing-orders/protecting-orders/fraud-analysis",
  paymentsCountries: "https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries",
  paymobDocs: "https://developers.paymob.com/paymob-docs/integration-paths/plugins/shopify",
  bostaApp: "https://apps.shopify.com/bosta-shipping-app",
  zones: "https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/shipping-zones",
  email: "https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/email/pricing",
  googleApp: "https://apps.shopify.com/google",
  apps: "https://www.shopify.com/compare/shopify-vs-wix",
  magic: "https://www.shopify.com/magic",
};

const WOO = {
  pricing: "https://woocommerce.com/pricing/",
  vsShopify: "https://woocommerce.com/woocommerce-vs-shopify/",
  siteEditor: "https://wordpress.org/documentation/article/site-editor/",
  csv: "https://woocommerce.com/document/product-csv-importer-exporter/",
  wpcomPricing: "https://wordpress.com/pricing/",
  translation: "https://translate.wordpress.org/projects/wp-plugins/woocommerce/",
  themes: "https://api.wordpress.org/themes/info/1.2/?action=query_themes&request%5Btag%5D=e-commerce",
  polylang: "https://wordpress.org/plugins/polylang/",
  cod: "https://woocommerce.com/document/woocommerce-features/cash-on-delivery/",
  gateways: "https://woocommerce.com/document/premium-payment-gateway-extensions/",
  wooPaymentsCountries: "https://woocommerce.com/document/woopayments/compatibility/countries/",
  paymob: "https://wordpress.org/plugins/paymob-for-woocommerce/",
  bosta: "https://wordpress.org/plugins/bosta-woocommerce/",
  zones: "https://woocommerce.com/document/setting-up-shipping-zones/",
  automateWoo: "https://woocommerce.com/products/automatewoo/",
  mailpoet: "https://wordpress.org/plugins/mailpoet/",
  google: "https://wordpress.org/plugins/google-listings-and-ads/",
  marketplace: "https://woocommerce.com/products/",
  aiBeta: "https://developer.woocommerce.com/2026/05/25/improve-product-listings/",
  wpcomAi: "https://wordpress.com/blog/2026/10/31/changelog-site-store-ai/",
  support: "https://woocommerce.com/support-policy/",
};

const EC = {
  pricing: "https://expandcart.com/ar/الاسعار/",
  home: "https://expandcart.com/ar/",
  egypt: "https://expandcart.com/ar/ultimate-plan-eg/",
};

const SALLA = {
  plans: "https://salla.com/plans",
  planPrices: "https://help.salla.sa/article/أسعار-باقات-سلة-على-أجهزة-الهاتف/c4t9zj8cnotfaa1a2opd8n0f",
  planHelp: "https://help.salla.sa/article/إدارة-باقة-المتجر/rhzl2dh5f5f9uz0qo813nttb",
  paymentsHelp: "https://help.salla.sa/article/تفعيل-طرق-الدفع-في-المتجر/dcrwxldslve7spa8eqdgii8g",
  import: "https://help.salla.sa/article/استيراد-المنتجات-من-منصات-أخرى/mtdg1com53fnlfgt14twklrm",
  aiInfo: "https://salla.com/ai-info/",
  payments: "https://salla.com/payments",
  marketing: "https://salla.com/marketing",
  landingPages: "https://help.salla.sa/article/صفحات-الهبوط-بوابتك-لتحويل-النقرات-إلى-مبيعات/gn0ej4ydhbabd1m9qwnv9pvv",
  chatgpt: "https://help.salla.sa/article/ربط-متجرك-مع-chatgpt/ptsfc31snxw704refay9v2ry",
};

const ZID = {
  pricing: "https://zid.eg/ar/pricing/",
  saudiPricing: "https://zid.sa/ar/pricing/",
  home: "https://zid.eg/ar/",
  faq: "https://help.zid.sa/ar/getting-started/faq",
  themeEditor: "https://help.zid.sa/ar/online-store/theme-editor",
  move: "https://help.zid.sa/ar/getting-started/move-to-zid",
  help: "https://help.zid.sa/ar",
  languages: "https://help.zid.sa/ar/settings/languages-currencies",
  abandoned: "https://help.zid.sa/ar/communications/abandoned-carts",
  ai: "https://help.zid.sa/ar/getting-started/ai-assistant",
};

/**
 * Every competitor with its sourced facts. Add a fact only with the page that
 * proves it (`official`); a fact we couldn't verify is left out, so its row
 * isn't shown. `publish` is the owner's per-competitor release (S-06):
 * EasyOrders and Shopify go first when `COMPARE_PUBLIC` flips (SEO_PLAN §1.1 D5).
 */
export const COMPETITORS: readonly Competitor[] = [
  {
    id: "easyorders",
    category: "eg",
    featured: true,
    latin: "EasyOrders",
    arabicNames: ["ايزي اوردرز", "ايزي اوردر", "إيزي أوردرز", "easy orders"],
    publish: true,
    alternative: true,
    moveSteps: "excel-import",
    prices: ["eoOrderFee", "eoPro", "eoActivation"],
    facts: {
      freePlan: official("p", EO.ai),
      monthly: official("y", EO.pricing),
      orderFee: official("y", EO.pricing),
      salesShare: official("y", EO.ai),
      activation: official("p", EO.ai),
      limits: official("y", EO.pricing),
      noCode: official("y", EO.index),
      dragDrop: official("y", EO.index),
      domain: official("p", EO.pricing),
      arabicAdmin: official("y", EO.ai),
      templates: official("y", EO.themes),
      // Its public roadmap lists these as merchant requests, not built yet.
      bilingual: official("n", EO.roadmap),
      cod: official("y", EO.pricing),
      fakeOrders: official("y", EO.index),
      egyptGateways: official("p", EO.index),
      egyptCarriers: official("p", EO.index),
      zones: official("y", EO.api),
      abandoned: official("n", EO.roadmap),
      feeds: official("y", EO.index),
      landingPages: official("y", EO.index),
      apps: official("n", EO.roadmap),
      aiProductCopy: official("y", EO.ai),
      aiStoreBuilder: official("p", EO.ai),
      support: official("y", EO.index),
      currencies: official("y", EO.index),
      egpPricing: official("n", EO.pricing),
      availableInEgypt: official("y", EO.index),
    },
  },
  {
    id: "shopify",
    category: "global",
    featured: true,
    latin: "Shopify",
    arabicNames: ["شوبيفاي", "شوبيفاى", "شوبيفي"],
    publish: true,
    alternative: true,
    moveSteps: "shopify-import",
    prices: ["shopifyBasic", "shopifyGrow", "shopifyAdvanced", "shopifyGatewayFee"],
    facts: {
      freePlan: official("n", SHOPIFY.pricing),
      monthly: official("y", SHOPIFY.pricing),
      orderFee: official("n", SHOPIFY.pricing),
      salesShare: official("p", SHOPIFY.pricing),
      limits: official("y", SHOPIFY.pricing),
      noCode: official("y", SHOPIFY.builder),
      dragDrop: official("y", SHOPIFY.builder),
      import: official("y", SHOPIFY.import),
      domain: official("y", SHOPIFY.pricing),
      arabicAdmin: official("y", SHOPIFY.adminLanguages),
      templates: official("y", SHOPIFY.themes),
      bilingual: official("y", SHOPIFY.storeLanguages),
      cod: official("y", SHOPIFY.manualPayments),
      fakeOrders: official("p", SHOPIFY.fraud),
      egyptGateways: official("p", SHOPIFY.paymentsCountries),
      transfer: official("p", SHOPIFY.manualPayments),
      // From Paymob's own Shopify docs, not Shopify's: shown, not counted.
      installments: thirdParty("p", SHOPIFY.paymobDocs),
      egyptCarriers: official("p", SHOPIFY.bostaApp),
      zones: official("y", SHOPIFY.zones),
      abandoned: official("y", SHOPIFY.email),
      email: official("y", SHOPIFY.email),
      feeds: official("y", SHOPIFY.googleApp),
      landingPages: official("p", SHOPIFY.builder),
      apps: official("y", SHOPIFY.apps),
      aiProductCopy: official("y", SHOPIFY.magic),
      aiStoreBuilder: official("y", SHOPIFY.builder),
      support: official("y", SHOPIFY.pricing),
      egpPricing: official("n", SHOPIFY.pricing),
      availableInEgypt: official("y", SHOPIFY.paymentsCountries),
    },
  },
  {
    id: "woocommerce",
    category: "global",
    latin: "WooCommerce",
    arabicNames: ["ووكومرس", "ووكوميرس", "woo commerce"],
    publish: false,
    moveSteps: "excel-import",
    prices: ["wooHostingMin", "wooHostingMax", "wooExtMin", "wooExtMax"],
    facts: {
      freePlan: official("y", WOO.pricing),
      monthly: official("p", WOO.pricing),
      orderFee: official("n", WOO.pricing),
      salesShare: official("y", WOO.pricing),
      limits: official("y", WOO.vsShopify),
      noCode: official("p", WOO.siteEditor),
      dragDrop: official("p", WOO.siteEditor),
      import: official("y", WOO.csv),
      domain: official("p", WOO.wpcomPricing),
      arabicAdmin: official("y", WOO.translation),
      templates: official("y", WOO.themes),
      bilingual: official("p", WOO.polylang),
      cod: official("y", WOO.gateways),
      fakeOrders: official("n", WOO.cod),
      egyptGateways: official("y", WOO.paymob),
      transfer: official("p", WOO.paymob),
      installments: official("y", WOO.paymob),
      egyptCarriers: official("p", WOO.bosta),
      zones: official("y", WOO.zones),
      abandoned: official("p", WOO.automateWoo),
      email: official("p", WOO.mailpoet),
      feeds: official("y", WOO.google),
      apps: official("y", WOO.marketplace),
      landingPages: official("y", WOO.siteEditor),
      aiProductCopy: official("p", WOO.aiBeta),
      aiStoreBuilder: official("p", WOO.wpcomAi),
      support: official("p", WOO.support),
      egpPricing: official("n", WOO.pricing),
      availableInEgypt: official("y", WOO.wooPaymentsCountries),
    },
  },
  {
    id: "expandcart",
    category: "eg",
    latin: "ExpandCart",
    arabicNames: ["اكسباند كارت", "إكسباند كارت", "expand cart"],
    publish: false,
    moveSteps: "excel-import",
    prices: ["ecStandard", "ecUltimate"],
    facts: {
      freePlan: official("p", EC.pricing),
      monthly: official("y", EC.pricing),
      orderFee: official("n", EC.pricing),
      salesShare: official("y", EC.pricing),
      limits: official("p", EC.pricing),
      noCode: official("y", EC.home),
      import: official("p", EC.pricing),
      domain: official("y", EC.pricing),
      templates: official("p", EC.pricing),
      bilingual: official("y", EC.pricing),
      // Paymob, Fawry, Bosta and Mylerz appear only as logos on its 2021 Egypt page (modified 2022).
      egyptGateways: official("p", EC.pricing),
      egyptCarriers: official("p", EC.egypt),
      abandoned: official("p", EC.pricing),
      email: official("p", EC.pricing),
      feeds: official("p", EC.pricing),
      landingPages: official("p", EC.pricing),
      apps: official("y", EC.home),
      support: official("p", EC.pricing),
      egpPricing: official("y", EC.pricing),
      availableInEgypt: official("y", EC.egypt),
    },
  },
  {
    id: "salla",
    category: "other",
    latin: "Salla",
    arabicNames: ["سلة", "منصة سلة"],
    publish: false,
    moveSteps: "excel-import",
    prices: ["sallaPlus", "sallaPro"],
    facts: {
      freePlan: official("y", SALLA.plans),
      monthly: official("y", SALLA.planPrices),
      orderFee: official("n", SALLA.planHelp),
      salesShare: official("p", SALLA.paymentsHelp),
      limits: official("y", SALLA.plans),
      noCode: official("y", SALLA.plans),
      import: official("y", SALLA.import),
      domain: official("p", SALLA.plans),
      arabicAdmin: official("y", SALLA.aiInfo),
      templates: official("p", SALLA.aiInfo),
      bilingual: official("y", SALLA.aiInfo),
      cod: official("y", SALLA.paymentsHelp),
      fakeOrders: official("p", SALLA.payments),
      egyptGateways: official("n", SALLA.payments),
      transfer: official("p", SALLA.paymentsHelp),
      installments: official("p", SALLA.payments),
      abandoned: official("y", SALLA.marketing),
      email: official("y", SALLA.marketing),
      feeds: official("y", SALLA.marketing),
      landingPages: official("y", SALLA.landingPages),
      apps: official("y", SALLA.aiInfo),
      aiProductCopy: official("p", SALLA.chatgpt),
      support: official("y", SALLA.aiInfo),
      egpPricing: official("n", SALLA.plans),
      availableInEgypt: official("n", SALLA.plans),
    },
  },
  {
    id: "zid",
    category: "eg",
    latin: "Zid",
    arabicNames: ["زد", "منصة زد"],
    publish: false,
    moveSteps: "excel-import",
    prices: ["zidRise", "zidGrowth"],
    facts: {
      freePlan: official("y", ZID.pricing),
      monthly: official("y", ZID.pricing),
      orderFee: official("n", ZID.pricing),
      salesShare: official("p", ZID.saudiPricing),
      limits: official("y", ZID.pricing),
      noCode: official("y", ZID.home),
      dragDrop: official("y", ZID.themeEditor),
      import: official("y", ZID.move),
      domain: official("p", ZID.faq),
      arabicAdmin: official("y", ZID.help),
      templates: official("y", ZID.home),
      bilingual: official("y", ZID.languages),
      cod: official("y", ZID.pricing),
      // Egyptian partners appear as logos on zid.eg; some of its Egypt pages are copies of the Saudi site.
      egyptGateways: official("p", ZID.home),
      transfer: official("p", ZID.pricing),
      installments: official("p", ZID.home),
      egyptCarriers: official("p", ZID.home),
      abandoned: official("p", ZID.abandoned),
      email: official("p", ZID.help),
      feeds: official("p", ZID.faq),
      landingPages: official("p", ZID.pricing),
      apps: official("y", ZID.home),
      aiProductCopy: official("p", ZID.ai),
      aiStoreBuilder: official("p", ZID.themeEditor),
      support: official("p", ZID.home),
      egpPricing: official("y", ZID.pricing),
      availableInEgypt: official("y", ZID.home),
    },
  },
  {
    id: "facebook-only",
    category: "other",
    latin: "Facebook page only",
    arabicNames: ["صفحة فيسبوك", "فيس بوك"],
    publish: false,
    moveSteps: "excel-import",
    prices: [],
    // Only "a Page is free" is on Meta's own page; the rest is what a Page plainly is,
    // so this stays below MIN_VERIFIED_FACTS (no page) until Meta's own pages back more of it.
    facts: {
      freePlan: official("y", "https://www.facebook.com/business/tools/facebook-pages"),
      domain: { status: "n", source: "A Facebook Page has no store address of its own", checkedOn: READ_ON, mark: "descriptive" },
      templates: { status: "n", source: "A Facebook Page uses Facebook's own layout", checkedOn: READ_ON, mark: "descriptive" },
      egyptCarriers: { status: "n", source: "A Facebook Page connects to no shipping company", checkedOn: READ_ON, mark: "descriptive" },
      zones: { status: "n", source: "Shipping is agreed with each customer in messages", checkedOn: READ_ON, mark: "descriptive" },
    },
  },
];

export const compareSlug = (competitor: Pick<Competitor, "id">) => `tallaby-vs-${competitor.id}`;

/** Official facts only: what `MIN_VERIFIED_FACTS` counts. */
export function verifiedFactCount(competitor: Pick<Competitor, "facts">): number {
  return Object.values(competitor.facts).filter(counts).length;
}

/** Competitors with enough official facts to deserve a page (built, but noindex until public). */
export function publishableCompetitors(list: readonly Competitor[] = COMPETITORS): Competitor[] {
  return list.filter((competitor) => verifiedFactCount(competitor) >= MIN_VERIFIED_FACTS);
}

/** True when this competitor's pages are public: the switch is on, it has its facts, and the owner released it. */
export function isComparePublic(competitor: Competitor, comparePublic: boolean = COMPARE_PUBLIC): boolean {
  return comparePublic && competitor.publish && verifiedFactCount(competitor) >= MIN_VERIFIED_FACTS;
}

/** The competitors whose pages are public (sitemap, footer, links from public pages). */
export function publicCompetitors(comparePublic: boolean = COMPARE_PUBLIC, list: readonly Competitor[] = COMPETITORS): Competitor[] {
  return publishableCompetitors(list).filter((competitor) => isComparePublic(competitor, comparePublic));
}

/** True when the /compare hub is public: the switch is on and at least one comparison is released. */
export const isCompareHubPublic = (comparePublic: boolean = COMPARE_PUBLIC) => publicCompetitors(comparePublic).length > 0;

/** Robots for a compare or alternatives page (or the hub, with no competitor); undefined leaves the indexable default. */
export function compareRobots(competitor?: Competitor) {
  const open = competitor ? isComparePublic(competitor) : isCompareHubPublic();
  return open ? undefined : { index: false, follow: false };
}

/**
 * Which comparisons a page may link: a public page links only public ones (never
 * a gated URL from a public page, §12.5); a preview page links every built one.
 */
export function compareLinkTargets(from?: Competitor): Competitor[] {
  const open = from ? isComparePublic(from) : isCompareHubPublic();
  return open ? publicCompetitors() : publishableCompetitors();
}

export function findCompetitorBySlug(slug: string): Competitor | undefined {
  return publishableCompetitors().find((competitor) => compareSlug(competitor) === slug);
}

/** Every https source behind the shown facts and prices, first use first, each with the oldest day it was read. */
export function competitorSources(competitor: Pick<Competitor, "facts" | "prices">): { url: string; checkedOn: string }[] {
  const seen = new Map<string, string>();
  const add = (url: string, checkedOn: string) => {
    if (!url.startsWith("https://")) return;
    const before = seen.get(url);
    if (!before || checkedOn < before) seen.set(url, checkedOn);
  };
  for (const group of COMPARE_GROUPS) for (const row of group.rows) {
    const fact = competitor.facts[row.id];
    if (fact) add(fact.source, fact.checkedOn);
  }
  for (const key of competitor.prices) add(COMPETITOR_PRICES[key].source, COMPETITOR_PRICES[key].checkedOn);
  return [...seen].map(([url, checkedOn]) => ({ url, checkedOn }));
}

/** The date the page shows: the oldest read among its facts and prices, so it never overstates freshness. */
export function factsCheckedOn(competitor: Pick<Competitor, "facts" | "prices">): string {
  const dates = [
    ...Object.values(competitor.facts).map((fact) => fact!.checkedOn),
    ...competitor.prices.map((key) => COMPETITOR_PRICES[key].checkedOn),
  ];
  return dates.sort()[0] ?? "";
}

/** The table for one competitor: only rows with a fact, and no empty groups. */
export function comparisonTable(competitor: Pick<Competitor, "facts">) {
  return COMPARE_GROUPS.map((group) => ({
    id: group.id,
    icon: group.icon,
    rows: group.rows.flatMap((row) => {
      const fact = competitor.facts[row.id];
      return fact ? [{ id: row.id, tallaby: row.tallaby, competitor: fact.status, source: fact.source }] : [];
    }),
  })).filter((group) => group.rows.length > 0);
}

export const COMPARE_CATEGORIES = ["eg", "global", "other"] as const;

/** Competitors with an /alternatives/<id> page (same facts threshold and gate as their comparison). */
export function alternativeCompetitors(): Competitor[] {
  return publishableCompetitors().filter((competitor) => competitor.alternative);
}

/** The /alternatives page for a competitor, when it exists and this page may link it. */
export function alternativesPath(competitor: Competitor): string | null {
  return competitor.alternative && publishableCompetitors().includes(competitor) ? `/alternatives/${competitor.id}` : null;
}

/** True when the competitor can be recommended to a seller in Egypt (§9.3: no Salla on an Egypt shortlist). */
export const worksInEgypt = (competitor: Competitor) => competitor.facts.availableInEgypt?.status !== "n";

/**
 * The /alternatives/<id> shortlist after Tallaby: other built comparisons that
 * work for sellers in Egypt, Egyptian platforms first, at most `max`.
 */
export function alternativesShortlist(competitor: Competitor, max = 4): Competitor[] {
  const order = { eg: 0, global: 1, other: 2 } as const;
  return compareLinkTargets(competitor)
    .filter((other) => other.id !== competitor.id && worksInEgypt(other) && other.category !== "other")
    .sort((a, b) => order[a.category] - order[b.category])
    .slice(0, max);
}
