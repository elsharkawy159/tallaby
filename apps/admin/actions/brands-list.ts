"use server";

import { db } from "@workspace/db";
import { brands } from "@workspace/db";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { getAdminUser } from "./auth";

export type AdminBrandsSortId =
  | "name"
  | "productCount"
  | "averageRating"
  | "createdAt";

export interface AdminBrandsQuery {
  limit?: number;
  offset?: number;
  search?: string;
  /** "verified" | "unverified" */
  verification?: string[];
  /** "official" | "not-official" */
  official?: string[];
  /** "en" | "ar" */
  language?: string[];
  sort?: { id: AdminBrandsSortId; desc: boolean } | null;
}

function booleanFilter(
  values: string[] | undefined,
  column: typeof brands.isVerified | typeof brands.isOfficial,
  trueValue: string
): SQL | undefined {
  const set = new Set(values ?? []);
  if (set.size !== 1) return undefined;
  return set.has(trueValue)
    ? eq(column, true)
    : sql`coalesce(${column}, false) = false`;
}

/** Server-side filtered, sorted and paginated brands list + page-independent stats. */
export async function getAdminBrands(query: AdminBrandsQuery = {}) {
  try {
    await getAdminUser();

    const limit = Math.min(query.limit || 20, 100);
    const offset = query.offset || 0;
    const conditions = [
      booleanFilter(query.verification, brands.isVerified, "verified"),
      booleanFilter(query.official, brands.isOfficial, "official"),
    ].filter((condition): condition is SQL => Boolean(condition));

    const languages = new Set(query.language ?? []);
    if (languages.size === 1) {
      conditions.push(
        languages.has("ar")
          ? eq(brands.locale, "ar")
          : sql`coalesce(${brands.locale}, 'en') = 'en'`
      );
    }

    const search = query.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(brands.name, pattern),
          ilike(brands.slug, pattern),
          ilike(brands.description, pattern),
          ilike(brands.website, pattern)
        )!
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const sortColumn = {
      name: brands.name,
      productCount: brands.productCount,
      averageRating: brands.averageRating,
      createdAt: brands.createdAt,
    }[query.sort?.id ?? "name"];
    const direction = query.sort?.desc ? desc : asc;

    const rows = await db
      .select()
      .from(brands)
      .where(where)
      .orderBy(sql`${direction(sortColumn)} nulls last`, asc(brands.id))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(brands)
      .where(where);

    const [statsRow] = await db
      .select({
        total: sql<number>`count(*)::int`,
        verified: sql<number>`count(*) filter (where ${brands.isVerified} = true)::int`,
        official: sql<number>`count(*) filter (where ${brands.isOfficial} = true)::int`,
        avgRating: sql<number>`coalesce(avg(${brands.averageRating}) filter (where ${brands.averageRating} > 0), 0)::float`,
      })
      .from(brands);

    return {
      success: true as const,
      data: rows,
      totalCount: Number(countRow?.count ?? 0),
      stats: {
        total: Number(statsRow?.total ?? 0),
        verified: Number(statsRow?.verified ?? 0),
        official: Number(statsRow?.official ?? 0),
        avgRating: Number(statsRow?.avgRating ?? 0),
      },
    };
  } catch (error) {
    console.error("Error fetching admin brands:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
