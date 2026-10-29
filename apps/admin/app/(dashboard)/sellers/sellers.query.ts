import { sellers, stores, users } from "@workspace/db";
import { isHeardAboutUsSource } from "@workspace/lib/sellers";
import { and, eq, gte, ilike, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import type { SellersQuery } from "./sellers.server";
import type { SellerStatus } from "./sellers.types";

const SELLER_STATUSES = ["pending", "approved", "suspended", "restricted"] as const;

/**
 * The WHERE clause of the sellers table filters and search, shared by the
 * list and the export. The query must left join `users` on the seller id.
 */
export function buildSellersWhere(query: SellersQuery): SQL | undefined {
  const conditions: SQL[] = [];

  const statuses = (query.status ?? []).filter((value) =>
    (SELLER_STATUSES as readonly string[]).includes(value)
  ) as SellerStatus[];
  if (statuses.length) conditions.push(inArray(sellers.status, statuses));

  if (query.businessType?.length) {
    conditions.push(inArray(sellers.businessType, query.businessType));
  }

  const booleanFilter = (
    values: string[] | undefined,
    column:
      | typeof sellers.isVerified
      | typeof sellers.isCommissionExempt
      | typeof sellers.freeDelivery,
    trueValue: string
  ) => {
    const set = new Set(values ?? []);
    if (set.size !== 1) return;
    conditions.push(
      set.has(trueValue)
        ? eq(column, true)
        : sql`coalesce(${column}, false) = false`
    );
  };
  booleanFilter(query.verification, sellers.isVerified, "verified");
  booleanFilter(query.commission, sellers.isCommissionExempt, "exempt");
  booleanFilter(query.delivery, sellers.freeDelivery, "free");

  // Store wallet (D21): admins look at negative wallets and decide.
  const wallet = new Set(query.wallet ?? []);
  if (wallet.size === 1) {
    conditions.push(
      wallet.has("negative")
        ? sql`coalesce(${sellers.walletBalance}, 0) < 0`
        : sql`coalesce(${sellers.walletBalance}, 0) >= 0`
    );
  }

  const sources = (query.source ?? []).filter(isHeardAboutUsSource);
  const sourceConditions: SQL[] = [];
  if (sources.length) sourceConditions.push(inArray(sellers.heardAboutUs, sources));
  if (query.source?.includes("unknown")) sourceConditions.push(sql`${sellers.heardAboutUs} IS NULL`);
  if (sourceConditions.length) conditions.push(or(...sourceConditions)!);

  const site = new Set(query.site ?? []);
  if (site.size === 1) {
    const hasPublished = sql`EXISTS (
      SELECT 1 FROM ${stores} st
      WHERE st.seller_id = ${sellers.id} AND st.deleted_at IS NULL AND st.site_status = 'published'
    )`;
    conditions.push(site.has("published") ? hasPublished : sql`NOT ${hasPublished}`);
  }

  if (query.joinedFrom) conditions.push(gte(sellers.joinDate, query.joinedFrom));
  if (query.joinedTo) conditions.push(lt(sellers.joinDate, query.joinedTo));

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(sellers.businessName, pattern),
        ilike(sellers.displayName, pattern),
        ilike(sellers.slug, pattern),
        ilike(sellers.supportEmail, pattern),
        ilike(sellers.supportPhone, pattern),
        ilike(users.fullName, pattern),
        ilike(users.email, pattern),
        ilike(users.phone, pattern),
        sql`EXISTS (
          SELECT 1 FROM ${stores} st
          WHERE st.seller_id = ${sellers.id} AND st.deleted_at IS NULL
            AND (st.name ILIKE ${pattern} OR st.subdomain ILIKE ${pattern})
        )`
      )!
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
