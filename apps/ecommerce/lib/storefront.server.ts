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
import { categoryTags, productTags, sellerTags } from "@workspace/cache";
import {
  hostnameOf,
  isPlatformHost,
  storeSubdomainFromHost,
  storeUrl,
} from "@workspace/lib/storefront";
import { findSubdomainForCustomDomain } from "@workspace/lib/storefront/server";
import { normalizeGovernorate } from "@workspace/lib/shipping";

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
          bannerUrl: stores.bannerUrl,
          contact: stores.contact,
          policies: stores.policies,
          storeCategory: stores.storeCategory,
          storeCategoryAr: stores.storeCategoryAr,
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

      const contact = (row.contact ?? {}) as { email?: string; phone?: string };
      const policies = (row.policies ?? {}) as { return?: string; shipping?: string };
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
        bannerUrl: row.bannerUrl,
        returnPolicy: policies.return ?? null,
        shippingPolicy: policies.shipping ?? null,
        storeRating: row.storeRating,
        positiveRatingPercent: row.positiveRatingPercent,
        totalRatings: row.totalRatings,
        isVerified: row.isVerified,
        joinDate: row.joinDate,
        freeDelivery: row.freeDelivery,
        supportEmail: contact.email ?? null,
        supportPhone: contact.phone ?? null,
        storeCategory: row.storeCategory,
        storeCategoryAr: row.storeCategoryAr,
        governorate: normalizeGovernorate(state),
        /** The store's own domain once live (faster-eg.com), else null. */
        customDomain: domain?.domain ?? null,
      };
    },
    // v4: resolves through stores (P5-00).
    [`storefront-v4-${subdomain}`],
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
export type CartScope = { storeId: string; sellerId: string };

/**
 * The store whose cart the current request uses, or null for the marketplace
 * cart. Resolved from the request HOST only, never from the request body. An
 * unknown subdomain also yields null; its pages 404.
 */
export async function getCartScope(): Promise<CartScope | null> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return null;
  const store = await getStorefrontBySubdomain(subdomain);
  return store ? { storeId: store.storeId, sellerId: store.id } : null;
}

/**
 * Seller id whose storefront the current request is on, or null on the
 * marketplace. Kept for callers that only need "storefront or not".
 */
export async function getCartStoreSellerId(): Promise<string | null> {
  return (await getCartScope())?.sellerId ?? null;
}

/**
 * WHERE clause for a user's active cart in the given storefront scope. Each
 * STORE has its own cart (a seller's two stores do not share one); the
 * marketplace cart has no store.
 */
export function activeCartWhere(userId: string, scope: CartScope | null) {
  return and(
    eq(carts.userId, userId),
    eq(carts.status, "active"),
    scope ? eq(carts.storeId, scope.storeId) : isNull(carts.storeSellerId),
  );
}

export type StorefrontCategory = {
  /** Root slug (or id when slugless); duplicate roots sharing a slug merge. */
  key: string;
  name: string | null;
  nameAr: string | null;
  productCount: number;
  /** The seller's product categories under this root, for filtering. */
  categoryIds: string[];
  /** First image of the seller's best-rated product in this category. */
  coverImage: string | null;
};

/** One seller's root categories, each with one of their own product photos. */
export function getStorefrontCategories(sellerId: string) {
  return unstable_cache(
    async () => {
      try {
        const rows = await db.execute(sql`
          WITH RECURSIVE ancestry AS (
            SELECT id, id AS root_id, parent_id FROM categories
            UNION ALL
            SELECT a.id, c.id, c.parent_id
            FROM ancestry a JOIN categories c ON c.id = a.parent_id
          )
          SELECT coalesce(r.slug, r.id::text) AS key,
                 min(r.name) AS name, min(r.name_ar) AS "nameAr",
                 count(p.id)::int AS "productCount",
                 json_agg(DISTINCT p.category_id) AS "categoryIds",
                 (array_agg(p.images -> 0 ORDER BY p.average_rating DESC NULLS LAST, p.created_at DESC)
                    FILTER (WHERE jsonb_typeof(p.images) = 'array' AND jsonb_array_length(p.images) > 0))[1]
                   AS "coverImage"
          FROM products p
          JOIN ancestry a ON a.id = p.category_id AND a.parent_id IS NULL
          JOIN categories r ON r.id = a.root_id
          WHERE p.seller_id = ${sellerId} AND p.status = 'active'
          GROUP BY 1
          ORDER BY "productCount" DESC, name
        `);
        return [...rows].map((row) => {
          const cover = (row as { coverImage: unknown }).coverImage;
          return {
            ...(row as Omit<StorefrontCategory, "coverImage">),
            // Image entries are either a storage path or { url }.
            coverImage:
              typeof cover === "string"
                ? cover
                : ((cover as { url?: string } | null)?.url ?? null),
          };
        });
      } catch (error) {
        console.error("Error fetching storefront categories:", error);
        return [] as StorefrontCategory[];
      }
    },
    [`storefront-categories-${sellerId}`],
    {
      tags: [productTags.seller(sellerId), categoryTags.all()],
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
