/**
 * Seller storefronts ({subdomain}.tallaby.com) on the server side.
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
  eq,
  and,
  isNull,
  sql,
} from "@workspace/db";
import { categoryTags, productTags, sellerTags } from "@workspace/cache";
import { storeSubdomainFromHost, storeUrl } from "@workspace/lib/storefront";
import { normalizeGovernorate } from "@workspace/lib/shipping";

/** The storefront subdomain of the current request, or null on tallaby.com. */
export async function getRequestStoreSubdomain(): Promise<string | null> {
  const requestHeaders = await headers();
  return storeSubdomainFromHost(requestHeaders.get("host"));
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

/** An approved seller's public storefront profile, by current subdomain. */
export function getStorefrontBySubdomain(subdomain: string) {
  return unstable_cache(
    async () => {
      const seller = await db.query.sellers.findFirst({
        where: and(eq(sellers.subdomain, subdomain), eq(sellers.status, "approved")),
        columns: {
          id: true,
          displayName: true,
          slug: true,
          subdomain: true,
          description: true,
          storeDescription: true,
          logoUrl: true,
          bannerUrl: true,
          returnPolicy: true,
          shippingPolicy: true,
          storeRating: true,
          positiveRatingPercent: true,
          totalRatings: true,
          isVerified: true,
          joinDate: true,
          freeDelivery: true,
          supportEmail: true,
          supportPhone: true,
          legalAddress: true,
          storeCategory: true,
          storeCategoryAr: true,
        },
      });
      if (!seller) return null;

      // Only the governorate is public; the rest of the legal address is not.
      const { legalAddress, ...profile } = seller;
      const state = (legalAddress as { state?: string } | null)?.state;
      return { ...profile, governorate: normalizeGovernorate(state) };
    },
    // v2: adds storeCategory / storeCategoryAr.
    [`storefront-v2-${subdomain}`],
    { tags: ["sellers", sellerTags.subdomain(subdomain)], revalidate: 3600 },
  )();
}

/** The current subdomain for a subdomain the seller has since replaced. */
export function getRenamedStoreSubdomain(oldSubdomain: string) {
  return unstable_cache(
    async () => {
      const [row] = await db
        .select({ subdomain: sellers.subdomain })
        .from(sellerSubdomainRedirects)
        .innerJoin(sellers, eq(sellers.id, sellerSubdomainRedirects.sellerId))
        .where(eq(sellerSubdomainRedirects.subdomain, oldSubdomain))
        .limit(1);
      return row?.subdomain ?? null;
    },
    [`storefront-redirect-${oldSubdomain}`],
    { tags: ["sellers", sellerTags.subdomain(oldSubdomain)], revalidate: 3600 },
  )();
}

/**
 * Seller id whose storefront cart the current request uses, or null for the
 * marketplace cart. An unknown subdomain also yields null; its pages 404.
 */
export async function getCartStoreSellerId(): Promise<string | null> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return null;
  const store = await getStorefrontBySubdomain(subdomain);
  return store?.id ?? null;
}

/** WHERE clause for a user's active cart in the given storefront scope. */
export function activeCartWhere(userId: string, storeSellerId: string | null) {
  return and(
    eq(carts.userId, userId),
    eq(carts.status, "active"),
    storeSellerId ? eq(carts.storeSellerId, storeSellerId) : isNull(carts.storeSellerId),
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
  if (renamed) redirect(storeUrl(renamed));
  notFound();
}
