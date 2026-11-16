import { getTranslations } from "next-intl/server";
import { aiConfigured } from "@workspace/ai";
import { and, db, desc, eq, isNull, products, sellers, storeDesignSystems } from "@workspace/db";
import { parsePriceJson, parseStoreCurrency } from "@workspace/lib";
import { isProActive } from "@workspace/lib/billing";
import { getBillingState } from "@workspace/lib/billing/server";
import { placeLabel } from "@workspace/lib/places";
import { gatewaySupportsCurrency, parseStorePayments } from "@workspace/lib/payments/store-methods";
import { STORE_GATEWAY_PROVIDERS } from "@workspace/lib/payments/store-gateways";
import { getStoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { getStoreShipping } from "@workspace/lib/stores/server";
import { effectiveStoreNiche, industryOfCategory, nicheForIndustry, parseStoreNiche } from "@workspace/lib/stores/niche";
import type { StoreRow } from "@workspace/lib/stores/server";
import { designSystemSchema } from "@workspace/store-sections";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { findIndustry, STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { nicheChoices } from "@/lib/stores/niche-choices.lib";
import { getAllCategories } from "@/actions/categories";
import { getSetupPromptRow } from "../../../_components/home.queries";
import type { CategoryOption } from "../products/add/add-product.schema";
import { quickProductTitle, type QuickProductCard } from "../products/add/ai/ai-product-uploader.lib";
import { loadSellerPricing } from "../products/add/seller-pricing.data";
import { welcomeShippingDefault, welcomeWallet } from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

/**
 * Read-only loader of the welcome page, for a store `loadStorePage` already
 * checked (rule 5: it belongs to the session seller). Never `getStoreForEditor`,
 * which writes the site scaffold. One round of queries; nothing cached (rule 8).
 * The order lock and billing state are the seller's (session) ones, never a
 * client value.
 */
export async function loadWelcomeData(store: StoreRow, locale: string): Promise<WelcomeData | null> {
  const themesAvailable = storeBuilderEnabled(store.sellerId);
  const aiEnabled = aiConfigured();
  const promptRowPromise = getSetupPromptRow(store.sellerId, store.id);
  // The first-product step needs one of two things, picked by its done flag without waiting on the other queries.
  const productPromise = promptRowPromise.then(async (row) => ({
    latest: row?.flags.product ? await loadLatestProduct(store, locale) : null,
    uploader: row && !row.flags.product && aiEnabled ? await loadUploaderContext() : null,
  }));
  const [promptRow, product, designRows, shipping, gateways, tAr, tEn, lock, billing, planRows, customDomain] = await Promise.all([
    promptRowPromise,
    productPromise,
    themesAvailable
      ? db
          .select({
            colors: storeDesignSystems.colors,
            typography: storeDesignSystems.typography,
            spacing: storeDesignSystems.spacing,
            motion: storeDesignSystems.motion,
            version: storeDesignSystems.version,
          })
          .from(storeDesignSystems)
          .where(eq(storeDesignSystems.storeId, store.id))
          .limit(1)
      : Promise.resolve([]),
    getStoreShipping(store.sellerId, store.id),
    getStoreGatewayOverview(store.sellerId, store.id),
    // Zone names are saved in both languages, as the shipping page builds them.
    getTranslations({ locale: "ar" }),
    getTranslations({ locale: "en" }),
    currentOrderLock(),
    getBillingState(),
    db
      .select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil })
      .from(sellers)
      .where(eq(sellers.id, store.sellerId))
      .limit(1),
    // The link to share: the store's own domain once it is live. A failed read falls back to the Tallaby address.
    findActiveCustomDomainForSubdomain(store.subdomain).catch(() => null),
  ]);
  if (!promptRow || !shipping) return null;

  const money = parseStoreCurrency(store.settings);
  const suggested = welcomeShippingDefault(money.currency);
  const zoneNames =
    suggested.kind === "egypt_flat"
      ? { nameAr: tAr("storeShipping.templates.egyptFlat.zoneName"), nameEn: tEn("storeShipping.templates.egyptFlat.zoneName") }
      : suggested.kind === "country"
        ? {
            nameAr: tAr("storeWelcome.steps.shipping.countryZoneName", { country: placeLabel(suggested.country, "ar") }),
            nameEn: tEn("storeWelcome.steps.shipping.countryZoneName", { country: placeLabel(suggested.country, "en") }),
          }
        : null;
  const zoneLabel = suggested.kind === "none" ? null : (locale.startsWith("ar") ? zoneNames?.nameAr : zoneNames?.nameEn) ?? null;

  const category = { en: store.storeCategory ?? "", ar: store.storeCategoryAr ?? "" };
  const industry = findIndustry(category);
  const industryId = industryOfCategory(category);

  // As Website › Design reads it: a null motion column means "defaults" (the key is left out).
  const row = designRows[0];
  const parsed = row
    ? designSystemSchema.safeParse({
        colors: row.colors,
        typography: row.typography,
        spacing: row.spacing,
        ...(row.motion != null && { motion: row.motion }),
      })
    : null;
  const designSystem = row && parsed?.success ? { value: parsed.data, version: row.version } : null;

  const planRow = planRows[0];

  const locales = store.supportedLocales.filter((l): l is "ar" | "en" => l === "ar" || l === "en");

  return {
    storeId: store.id,
    storeName: store.name,
    readOnly: store.status !== "active",
    flags: promptRow.flags,
    themesAvailable,
    aiEnabled,
    product,
    industry: {
      id: industry?.id ?? null,
      category,
      savedNiche: nicheForIndustry(parseStoreNiche(store.settings), industryId) ?? "",
      shownNiche: effectiveStoreNiche(store, industry?.id),
      nicheOptions: nicheChoices(
        STORE_INDUSTRIES.map((option) => option.id),
        locale,
      ),
    },
    brand: {
      logoUrl: store.logoUrl ?? "",
      faviconUrl: store.faviconUrl ?? "",
      defaultLocale: store.defaultLocale === "en" ? "en" : "ar",
      supportedLocales: locales.length ? locales : [store.defaultLocale === "en" ? "en" : "ar"],
      designSystem,
    },
    share: {
      url: storeUrl(store.subdomain, customDomain),
      subdomain: store.subdomain,
      customDomain,
      siteStatus: store.siteStatus,
    },
    wallet: welcomeWallet({ lock, usdLive: billing.usdLive, isPro: planRow ? isProActive(planRow) : false }),
    delivery: {
      money,
      shipping: {
        settings: shipping.settings,
        zones: shipping.zones,
        suggested,
        zoneNames,
        country: suggested.kind === "egypt_flat" ? "EG" : suggested.kind === "country" ? suggested.country : null,
        zoneLabel,
      },
      payments: {
        methods: parseStorePayments((store.settings as Record<string, unknown> | null)?.payments),
        gateway: gateways?.connected?.provider ?? null,
        gatewayProviders: STORE_GATEWAY_PROVIDERS.filter((provider) => gatewaySupportsCurrency(provider, money.currency)),
      },
    },
  };
}

/** The store's newest live product, for the done step's card (rule 5: this store, this seller). */
async function loadLatestProduct(store: StoreRow, locale: string): Promise<QuickProductCard | null> {
  const row = await db.query.products.findFirst({
    where: and(eq(products.sellerId, store.sellerId), eq(products.storeId, store.id), eq(products.status, "active"), isNull(products.deletedAt)),
    columns: { id: true, images: true, price: true, status: true },
    with: { productTranslations: { columns: { locale: true, title: true } } },
    orderBy: [desc(products.createdAt)],
  });
  if (!row) return null;
  const titles = Object.fromEntries(row.productTranslations.map((t) => [t.locale, { title: t.title }]));
  const price = parsePriceJson(row.price);
  const image = Array.isArray(row.images) ? row.images.find((path): path is string => typeof path === "string" && path.length > 0) : undefined;
  return {
    id: row.id,
    title: quickProductTitle(titles, locale),
    image: image ?? null,
    price: price.final ?? price.base ?? null,
    status: row.status ?? "active",
  };
}

/** The category tree (cached) and the seller's pricing, as the add page loads them. */
async function loadUploaderContext(): Promise<{ categories: CategoryOption[]; sellerPricing: Awaited<ReturnType<typeof loadSellerPricing>> }> {
  const [categories, sellerPricing] = await Promise.all([getAllCategories(), loadSellerPricing()]);
  return { categories: (categories.data || []) as CategoryOption[], sellerPricing };
}
