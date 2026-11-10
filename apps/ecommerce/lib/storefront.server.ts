/**
 * Seller storefronts ({subdomain}.tallaby.com, or the seller's own domain)
 * on the server side.
 *
 * The request host decides which cart a shopper is using: the marketplace
 * cart on tallaby.com, or that seller's own cart on their subdomain. Every
 * cart / checkout / coupon lookup goes through `activeCartWhere`, so server
 * actions pick the right cart without callers passing anything.
 */

import { headers } from "next/headers";
import { parseStoreCurrency, type CurrencyLabel, type StoreCurrency } from "@workspace/lib";
import { unstable_cache } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  db,
  carts,
  sellers,
  sellerSubdomainRedirects,
  sellerCustomDomains,
  stores,
  eq,
  and,
  isNull,
  sql,
} from "@workspace/db";
import { categoryTags, productTags, sellerTags, storeTags } from "@workspace/cache";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import {
  hostnameOf,
  isPlatformHost,
  storeSubdomainFromHost,
  storeUrl,
} from "@workspace/lib/storefront";
import { findSubdomainForCustomDomain } from "@workspace/lib/storefront/server";
import { normalizeGovernorate } from "@workspace/lib/shipping";
import { publicStoreSocialLinks } from "@workspace/lib/stores";
import { parseStoreSeo } from "@workspace/lib/stores";
import { storeHasVisibleProducts } from "@workspace/lib/stores/server";
import type { StoreCatalogScope } from "@workspace/lib/stores/scope/server";
import { isSwitchOn } from "@/lib/platform-switches.server";
import { getStorefrontGateway } from "@workspace/lib/payments/store-gateways/server";
import { storeCategoryGroups, type StoreCategoryFilter } from "@workspace/lib/store-sites/catalog-data";
import { parseStoreApp } from "@workspace/lib/stores/app";
import { parseStoreSalesPopup } from "@workspace/lib/stores/sales-popup";
import { parseStoreMinOrder } from "@workspace/lib/stores/min-order";
import {
  parseStorePayments,
  storefrontCheckoutMethods,
  storeProfilePaymentMethods,
  type StorefrontCheckoutPayments,
} from "@workspace/lib/payments/store-methods";

/**
 * The storefront subdomain of the current request, or null on tallaby.com.
 * On a seller's own domain (faster-eg.com) it is that store's subdomain.
 */
export async function getRequestStoreSubdomain(): Promise<string | null> {
  const host = (await headers()).get("host");
  const subdomain = storeSubdomainFromHost(host);
  if (subdomain || isPlatformHost(host)) return subdomain;
  return getSubdomainForCustomDomain(hostnameOf(host));
}

/**
 * Origin to send shoppers back to after leaving the site (payment pages):
 * the store they bought from (faster-eg.com, faster.tallaby.com), or the
 * marketplace. Only hosts that resolve to a store are trusted.
 */
export async function getRequestSiteUrl(): Promise<string> {
  const host = (await headers()).get("host");
  if (host && (await getRequestStoreSubdomain())) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/** Cached `faster-eg.com` → "faster" for active custom domains. */
function getSubdomainForCustomDomain(domain: string) {
  return unstable_cache(
    () => findSubdomainForCustomDomain(domain),
    [`storefront-domain-${domain}`],
    { tags: ["sellers", sellerTags.customDomain(domain)], revalidate: 300 },
  )();
}

export type StoreSiteStatus = "draft" | "published" | "unpublished";

/**
 * The store's website is offline: never published yet ('draft', every new
 * store) or switched off by the seller ('unpublished', "Website live" off).
 * Visitors only ever see a published site (owner, 2026-10-21).
 */
export function isStorefrontOffline(store: Pick<Storefront, "siteStatus">): boolean {
  return store.siteStatus !== "published";
}

export type Storefront = NonNullable<
  Awaited<ReturnType<typeof getStorefrontBySubdomain>>
>;

/** What the store sells in the page's language, falling back to the other one. */
export function storeCategoryLabel(
  store: Pick<Storefront, "storeCategory" | "storeCategoryAr">,
  locale: string,
): string | null {
  const label =
    locale === "ar"
      ? store.storeCategoryAr || store.storeCategory
      : store.storeCategory || store.storeCategoryAr;
  return label?.trim() || null;
}

/**
 * A store's public storefront profile, by its current subdomain (PLAN.md
 * P5-00). The host resolves to a STORE (active, not deleted, seller approved);
 * a seller can own several. The shape is unchanged for the storefront pages:
 * `id` is still the owning SELLER (products and categories are per seller),
 * `storeId` is the store itself.
 */
export function getStorefrontBySubdomain(subdomain: string) {
  return unstable_cache(
    async () => {
      const [row] = await db
        .select({
          storeId: stores.id,
          isPrimaryStore: stores.isPrimary,
          catalogMode: stores.catalogMode,
          name: stores.name,
          subdomain: stores.subdomain,
          description: stores.description,
          logoUrl: stores.logoUrl,
          faviconUrl: stores.faviconUrl,
          bannerUrl: stores.bannerUrl,
          contact: stores.contact,
          storeCategory: stores.storeCategory,
          storeCategoryAr: stores.storeCategoryAr,
          seo: stores.seo,
          settings: stores.settings,
          siteStatus: stores.siteStatus,
          supportedLocales: stores.supportedLocales,
          sellerId: sellers.id,
          slug: sellers.slug,
          storeRating: sellers.storeRating,
          positiveRatingPercent: sellers.positiveRatingPercent,
          totalRatings: sellers.totalRatings,
          isVerified: sellers.isVerified,
          joinDate: sellers.joinDate,
          freeDelivery: sellers.freeDelivery,
          legalAddress: sellers.legalAddress,
        })
        .from(stores)
        .innerJoin(sellers, eq(sellers.id, stores.sellerId))
        .where(
          and(
            eq(stores.subdomain, subdomain),
            eq(stores.status, "active"),
            isNull(stores.deletedAt),
            eq(sellers.status, "approved"),
          ),
        )
        .limit(1);
      if (!row) return null;

      const [domain] = await db
        .select({ domain: sellerCustomDomains.domain })
        .from(sellerCustomDomains)
        .where(and(eq(sellerCustomDomains.storeId, row.storeId), eq(sellerCustomDomains.status, "active")))
        .limit(1);

      const contact = (row.contact ?? {}) as { email?: string; phone?: string; whatsapp?: string };
      // Only the governorate is public; the rest of the legal address is not.
      const state = (row.legalAddress as { state?: string } | null)?.state;
      return {
        id: row.sellerId,
        storeId: row.storeId,
        isPrimaryStore: row.isPrimaryStore,
        catalogMode: row.catalogMode,
        displayName: row.name,
        slug: row.slug,
        subdomain: row.subdomain,
        description: row.description,
        storeDescription: row.description,
        logoUrl: row.logoUrl,
        faviconUrl: row.faviconUrl,
        bannerUrl: row.bannerUrl,
        storeRating: row.storeRating,
        positiveRatingPercent: row.positiveRatingPercent,
        totalRatings: row.totalRatings,
        isVerified: row.isVerified,
        joinDate: row.joinDate,
        freeDelivery: row.freeDelivery,
        supportEmail: contact.email ?? null,
        supportPhone: contact.phone ?? null,
        /** Store settings WhatsApp number; sections fall back to the phone. */
        supportWhatsapp: contact.whatsapp ?? null,
        storeCategory: row.storeCategory,
        storeCategoryAr: row.storeCategoryAr,
        /** Website › Domain & SEO (P4-14), re-validated field by field. */
        seo: parseStoreSeo(row.seo),
        /** Store settings › General: the label (symbol) of the store's website currency, "EGP" by default. */
        currencyLabel: parseStoreCurrency(row.settings).label,
        /** The store's currency: what its orders are placed in (ROADMAP.md F-61). */
        currency: parseStoreCurrency(row.settings).currency,
        governorate: normalizeGovernorate(state),
        /** The store's own domain once live (faster-eg.com), else null. */
        customDomain: domain?.domain ?? null,
        /** Enabled social links (Website › Social media, P4-15), read live from the store row. */
        social: publicStoreSocialLinks(row.contact),
        /** Checkout methods (Store settings › Payment methods; cash on delivery by default), for footer payment rows. */
        /** Store settings › App (ROADMAP.md F-36): the footer's Download application button. */
        app: parseStoreApp(row.settings),
        /** Store settings › Sales pop-up (ROADMAP.md F-22): on/off, delay and pages. */
        salesPopup: parseStoreSalesPopup(row.settings),
        /** Store settings › Checkout › Minimum order (ROADMAP.md F-13b), for the cart's "add X more". Checkout reads it fresh. */
        minOrder: parseStoreMinOrder(row.settings),
        // + the connected card gateway's logos (Visa, Mastercard, Meeza…; ROADMAP.md F-39).
        paymentMethods: storeProfilePaymentMethods(row.settings, await getStorefrontGateway(row.storeId, row.sellerId)).map((m) => m.key),
        /**
         * Builder site state: "draft" (never published), "published", or
         * "unpublished" (the seller took the website offline). Both "draft"
         * and "unpublished" show "store offline" on every storefront route.
         */
        siteStatus: row.siteStatus as StoreSiteStatus,
        /** Store settings › Languages: more than one means the header gets a language switcher. */
        supportedLocales: row.supportedLocales,
      };
    },
    // v16: paymentMethods include the card gateway's logos. v15: + currency. v14: + minOrder (F-13b). v13: + salesPopup (F-22). v12: + app (store app download button). v11: + paymentMethods (footer payment rows). v10: + supportedLocales (header language switcher). v9: + siteStatus (offline stores). v6: + seo (P4-14) and social links (P4-15). v4: resolves through stores (P5-00).
    [`storefront-v16-${subdomain}`],
    { tags: ["sellers", sellerTags.subdomain(subdomain)], revalidate: 3600 },
  )();
}

/** The current subdomain of the store a replaced subdomain belonged to. */
export function getRenamedStoreSubdomain(oldSubdomain: string) {
  return unstable_cache(
    async () => {
      const [row] = await db
        .select({ subdomain: stores.subdomain })
        .from(sellerSubdomainRedirects)
        .innerJoin(stores, eq(stores.id, sellerSubdomainRedirects.storeId))
        .where(and(eq(sellerSubdomainRedirects.subdomain, oldSubdomain), isNull(stores.deletedAt)))
        .limit(1);
      return row?.subdomain ?? null;
    },
    [`storefront-redirect-v2-${oldSubdomain}`],
    { tags: ["sellers", sellerTags.subdomain(oldSubdomain)], revalidate: 3600 },
  )();
}

/** The storefront a cart belongs to: the store, and the seller who owns it. */
export type CartScope = { storeId: string; sellerId: string; currency: StoreCurrency };

/**
 * The store whose cart the current request uses, or null for the marketplace
 * cart. Resolved from the request HOST only, never from the request body. An
 * unknown subdomain also yields null; its pages 404.
 */
export async function getCartScope(): Promise<CartScope | null> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return null;
  const store = await getStorefrontBySubdomain(subdomain);
  return store ? { storeId: store.storeId, sellerId: store.id, currency: store.currency } : null;
}

/**
 * Seller id whose storefront the current request is on, or null on the
 * marketplace. Kept for callers that only need "storefront or not".
 */
export async function getCartStoreSellerId(): Promise<string | null> {
  return (await getCartScope())?.sellerId ?? null;
}

/**
 * Whether this cart belongs to a store whose website is offline. Checked
 * from the cart row (not the request host), so an offline store takes no
 * orders whatever host the request comes from. Read fresh, never cached.
 */
export async function isCartStoreOffline(cartId: string): Promise<boolean> {
  const [row] = await db
    .select({ siteStatus: stores.siteStatus })
    .from(carts)
    .innerJoin(stores, eq(stores.id, carts.storeId))
    .where(eq(carts.id, cartId))
    .limit(1);
  return row ? isStorefrontOffline({ siteStatus: row.siteStatus as StoreSiteStatus }) : false;
}

/**
 * Whether the current request is on the host of a store whose website is
 * offline (checkout and other pass-through pages on a store host).
 */
export async function isRequestStoreOffline(): Promise<boolean> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return false;
  const store = await getStorefrontBySubdomain(subdomain);
  return store ? isStorefrontOffline(store) : false;
}

/**
 * The checkout methods of the storefront this request is on (Store settings ›
 * Payment methods), or null on the marketplace. Read fresh on every call, not
 * from the cached storefront profile, so a seller's change applies at once.
 */
export async function getStorefrontCheckoutPayments(): Promise<StorefrontCheckoutPayments | null> {
  const scope = await getCartScope();
  if (!scope) return null;
  const [row] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.id, scope.storeId), eq(stores.sellerId, scope.sellerId)))
    .limit(1);
  const settings = row?.settings as Record<string, unknown> | null | undefined;
  // The seller's own card gateway, when connected (ROADMAP.md F-39).
  const gateway = row ? await getStorefrontGateway(scope.storeId, scope.sellerId) : null;
  return storefrontCheckoutMethods(parseStorePayments(settings?.payments), gateway, parseStoreCurrency(settings).currency);
}

/** The label a store's checkout shows prices with, read fresh. */
export async function getStoreCurrencyLabel(storeId: string): Promise<CurrencyLabel> {
  const [row] = await db.select({ settings: stores.settings }).from(stores).where(eq(stores.id, storeId)).limit(1);
  return parseStoreCurrency(row?.settings).label;
}

/**
 * WHERE clause for a user's active cart in the given storefront scope. Each
 * STORE has its own cart (a seller's two stores do not share one); the
 * marketplace cart has no store.
 */
export function activeCartWhere(userId: string, scope: { storeId: string; sellerId?: string } | null) {
  return and(
    eq(carts.userId, userId),
    eq(carts.status, "active"),
    scope ? eq(carts.storeId, scope.storeId) : isNull(carts.storeSellerId),
  );
}

export type StorefrontCategory = {
  /** The seller category id; for a Tallaby root group, its slug (or id when slugless). */
  key: string;
  /** The seller's own category (0068); null for a Tallaby root group. */
  sellerCategoryId: string | null;
  /** The Tallaby category the seller category was picked from. */
  sourceCategoryId: string | null;
  name: string | null;
  nameAr: string | null;
  productCount: number;
  /** The Tallaby categories (`products.category_id`) of its products; filter with `storeCategoryFilter`. */
  categoryIds: string[];
  /**
   * Public URL of the category photo: the seller's own category image when
   * they added one, else the first image of their best-rated product in it.
   */
  coverImage: string | null;
};

/** The `getProducts` filter for one store category's products. */
export function storeCategoryFilter(category: StorefrontCategory): StoreCategoryFilter {
  return { sellerCategoryId: category.sellerCategoryId, sourceCategoryId: category.sourceCategoryId, categoryIds: category.categoryIds };
}

/**
 * The store id to narrow product lists by: set only when the store shows a
 * selected catalog (D24, `store_products`), else undefined (all the seller's
 * active products). Only the feed and sitemap still use it (F-87c slice 6);
 * every other storefront read takes `storefrontCatalog(store)`.
 */
export function catalogStoreId(store: Pick<Storefront, "storeId" | "catalogMode">): string | undefined {
  return store.catalogMode === "selected" ? store.storeId : undefined;
}

/**
 * The catalog scope of a store host (F-87c): its store and the
 * `stores_catalog_split` switch, read once per request and never inside a
 * cached function. A cached read takes both as key parts, so an entry never
 * mixes stores or catalog modes. Only a store resolved from the request host
 * goes in, never a client value (CLAUDE.md rule 5).
 */
export async function storefrontCatalog(store: Pick<Storefront, "storeId">): Promise<StoreCatalogScope> {
  return { storeId: store.storeId, catalogSplit: await isSwitchOn("stores_catalog_split") };
}

/** Key part for a catalog mode: the cache key of every store catalog read carries it. */
const splitKey = (catalogSplit: boolean) => (catalogSplit ? "split" : "shared");

/** The tags of a store catalog read: the seller (until the split), the store's products and its catalog picks. */
export function storefrontCatalogTags(sellerId: string, storeId: string): string[] {
  return [productTags.seller(sellerId), productTags.store(sellerId, storeId), storeTags.catalog(sellerId, storeId)];
}

/**
 * Whether the store shows at least one product (`productInStore`, scope
 * `shown`). A store without one is kept out of search: noindex and an empty
 * sitemap (PLAN.md §10.3, P5-04). Cached per store and catalog mode, with the
 * store's catalog tags.
 */
export async function storeHasProducts(store: Pick<Storefront, "id" | "storeId">): Promise<boolean> {
  const { catalogSplit } = await storefrontCatalog(store);
  return unstable_cache(
    () => storeHasVisibleProducts(store.id, store.storeId, { catalogSplit }),
    [`storefront-has-products-v2-${store.id}-${store.storeId}-${splitKey(catalogSplit)}`],
    { tags: storefrontCatalogTags(store.id, store.storeId), revalidate: 3600 },
  )();
}

/**
 * Whether search engines may index this store: website online, indexing on
 * and something to sell. An offline store gets noindex and an empty sitemap.
 */
export async function isStorefrontIndexable(
  store: Pick<Storefront, "id" | "storeId" | "seo" | "siteStatus">,
): Promise<boolean> {
  if (isStorefrontOffline(store)) return false;
  return store.seo.indexing && (await storeHasProducts(store));
}

/**
 * One store's categories (`storeCategoryGroups`: the seller's own categories,
 * else Tallaby roots), each with its photo; only the products the store shows
 * count (`productInStore`, scope `shown`). `storeId` is the store host's store.
 * Cached per seller, store and catalog mode (the switch is read here, outside
 * the cached function).
 */
export async function getStorefrontCategories(sellerId: string, storeId: string) {
  const { catalogSplit } = await storefrontCatalog({ storeId });
  return unstable_cache(
    async () => {
      try {
        const groups = await storeCategoryGroups(sellerId, { storeId, catalogSplit });
        return groups.map(({ ownImage, productImage: cover, productIds: _productIds, ...rest }): StorefrontCategory => {
          // Image entries are either a storage path or { url }.
          const productImage = typeof cover === "string" ? cover : ((cover as { url?: string } | null)?.url ?? null);
          // The seller's own category photo first; without one, a photo of a product in it.
          const own = ownImage ? getPublicUrl(ownImage, "categories") : "";
          return { ...rest, coverImage: own || (productImage ? getPublicUrl(productImage, "products") || null : null) };
        });
      } catch (error) {
        console.error("Error fetching storefront categories:", error);
        return [] as StorefrontCategory[];
      }
    },
    // v3: always per store and catalog mode (F-87c). v2: seller categories (storeCategoryGroups); never read a cached root-only list.
    [`storefront-categories-v3-${sellerId}-${storeId}-${splitKey(catalogSplit)}`],
    {
      tags: [...storefrontCatalogTags(sellerId, storeId), categoryTags.all()],
      revalidate: 3600,
    },
  )();
}

/**
 * The storefront for a route's `[subdomain]` param. A subdomain the seller
 * has since changed redirects to the new one; anything else is a 404.
 */
export async function resolveStorefront(subdomain: string): Promise<Storefront> {
  const store = await getStorefrontBySubdomain(subdomain);
  if (store) return store;

  const renamed = await getRenamedStoreSubdomain(subdomain);
  if (renamed) {
    const store = await getStorefrontBySubdomain(renamed);
    redirect(storeUrl(renamed, store?.customDomain));
  }
  notFound();
}
