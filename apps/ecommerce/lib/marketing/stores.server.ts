import { cache } from "react";
import { cacheProfiles, createCachedQuery, marketingStoreTags } from "@workspace/cache";
import { db, sql } from "@workspace/db";
import { storeUrl } from "@workspace/lib/storefront";
import { getPublicUrl } from "@workspace/ui/lib/utils";

/** How many stores the home page wall shows at most. */
export const STORE_SHOWCASE_LIMIT = 18;

export type ShowcaseStore = {
  id: string;
  name: string;
  logoUrl: string | null;
  url: string;
  productCount: number;
};

type ShowcaseRow = Omit<ShowcaseStore, "url" | "logoUrl"> & {
  subdomain: string;
  logoUrl: string | null;
  domain: string | null;
};

/**
 * Published stores of approved sellers, most active products first (the same
 * count as Admin › Stores: a "selected" catalog counts its listed products).
 * Stores with no product are left out: an empty shop is no proof. Public
 * fields only (name, logo, link), read once per hour for every visitor.
 */
const getCachedShowcase = createCachedQuery({
  name: "marketing:store-showcase:v1",
  ttl: cacheProfiles.seller,
  tags: () => [marketingStoreTags.showcase()],
  query: async (): Promise<ShowcaseRow[]> => {
    const result = await db.execute(sql`
      SELECT id, name, subdomain, logo_url, domain, product_count FROM (
        SELECT
          st.id, st.name, st.subdomain, st.logo_url, st.created_at,
          (SELECT cd.domain FROM seller_custom_domains cd
            WHERE cd.store_id = st.id AND cd.status = 'active'
            ORDER BY cd.created_at LIMIT 1) AS domain,
          CASE WHEN st.catalog_mode = 'selected'
            THEN (SELECT count(*) FROM store_products sp JOIN products p ON p.id = sp.product_id
                  WHERE sp.store_id = st.id AND p.status = 'active')
            ELSE (SELECT count(*) FROM products p WHERE p.seller_id = st.seller_id AND p.status = 'active')
          END::int AS product_count
        FROM stores st
        JOIN sellers s ON s.id = st.seller_id
        WHERE st.site_status = 'published' AND st.status = 'active' AND st.deleted_at IS NULL
          AND s.status = 'approved'
      ) ranked
      WHERE product_count > 0
      ORDER BY product_count DESC, created_at
      LIMIT ${STORE_SHOWCASE_LIMIT}
    `);
    return ([...result] as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      subdomain: String(row.subdomain),
      logoUrl: (row.logo_url as string | null) || null,
      domain: (row.domain as string | null) || null,
      productCount: Number(row.product_count ?? 0),
    }));
  },
});

/** The wall's stores; empty (the section hides) if the database cannot be read. */
export const getShowcaseStores = cache(async (): Promise<ShowcaseStore[]> => {
  try {
    const rows = await getCachedShowcase();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      logoUrl: row.logoUrl ? getPublicUrl(row.logoUrl, "sellers") || null : null,
      url: storeUrl(row.subdomain, row.domain),
      productCount: row.productCount,
    }));
  } catch (error) {
    console.error("[marketing] store showcase failed", error);
    return [];
  }
});
