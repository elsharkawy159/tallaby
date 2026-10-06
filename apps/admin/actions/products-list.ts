"use server";

import { db } from "@workspace/db";
import {
  brands,
  categories,
  products,
  sellers,
} from "@workspace/db";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getAdminUser } from "./auth";
import { LOW_STOCK_THRESHOLD } from "@/app/(dashboard)/products/products.lib";

const PRODUCT_STATUSES = ["draft", "pending", "active", "rejected"] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type ProductStockLevel = "in-stock" | "low-stock" | "out-of-stock";
export type ProductFlag =
  | "featured"
  | "trending"
  | "seasonal"
  | "sponsored"
  | "platform-choice"
  | "most-selling"
  | "free-delivery";
export type AdminProductsSortId =
  | "createdAt"
  | "updatedAt"
  | "title"
  | "price"
  | "quantity"
  | "averageRating";

export interface AdminProductsQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string[];
  categoryId?: string[];
  brandId?: string[];
  /** Seller ids or slugs (the `?seller=` link from the sellers page uses slugs). */
  seller?: string[];
  stock?: string[];
  flags?: string[];
  createdFrom?: string;
  createdTo?: string;
  sort?: { id: AdminProductsSortId; desc: boolean } | null;
  /** Put pending (awaiting review) products ahead of the `sort` order. */
  pendingFirst?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FLAG_COLUMNS: Record<ProductFlag, SQL> = {
  featured: sql`${products.isFeatured} = true`,
  trending: sql`${products.isTrending} = true`,
  seasonal: sql`${products.isSeasonal} = true`,
  sponsored: sql`${products.sponsored} = true`,
  "platform-choice": sql`${products.isPlatformChoice} = true`,
  "most-selling": sql`${products.isMostSelling} = true`,
  "free-delivery": sql`${products.freeDelivery} = true`,
};

const quantityNumber = sql`coalesce(${products.quantity}, 0)::numeric`;
const finalPrice = sql`coalesce((${products.price}->>'final')::numeric, 0)`;
// Subqueries spell out other tables' columns literally: the relational
// `findMany` rewrites every drizzle column in raw `where`/`orderBy` SQL to the
// root `products` alias, so `${productTranslations.title}` would render as
// `"products"."title"` and fail. Only `${products.*}` columns are safe here.
const enTitle = sql<string>`(
  select pt.title from product_translations pt
  where pt.product_id = ${products.id}
  order by (pt.locale = 'en') desc
  limit 1
)`;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

async function resolveSellerIds(values: string[]): Promise<string[]> {
  const ids = values.filter((value) => UUID_RE.test(value));
  const slugs = values.filter((value) => !UUID_RE.test(value));
  if (!slugs.length) return ids;
  const rows = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(inArray(sellers.slug, slugs));
  return [...ids, ...rows.map((row) => row.id)];
}

async function buildWhere(query: AdminProductsQuery): Promise<SQL | undefined> {
  const conditions: SQL[] = [];

  const statuses = (query.status ?? []).filter((value): value is ProductStatus =>
    (PRODUCT_STATUSES as readonly string[]).includes(value)
  );
  if (statuses.length) conditions.push(inArray(products.status, statuses));

  const categoryIds = (query.categoryId ?? []).filter((id) => UUID_RE.test(id));
  if (categoryIds.length) {
    conditions.push(inArray(products.categoryId, categoryIds));
  }

  const brandIds = (query.brandId ?? []).filter((id) => UUID_RE.test(id));
  if (brandIds.length) conditions.push(inArray(products.brandId, brandIds));

  if (query.seller?.length) {
    const sellerIds = await resolveSellerIds(query.seller);
    // Unknown slug -> empty result rather than an unfiltered list.
    conditions.push(
      sellerIds.length ? inArray(products.sellerId, sellerIds) : sql`false`
    );
  }

  const stockConditions = (query.stock ?? []).flatMap((level): SQL[] => {
    switch (level as ProductStockLevel) {
      case "out-of-stock":
        return [sql`${quantityNumber} <= 0`];
      case "low-stock":
        return [
          sql`${quantityNumber} > 0 and ${quantityNumber} < ${LOW_STOCK_THRESHOLD}`,
        ];
      case "in-stock":
        return [sql`${quantityNumber} >= ${LOW_STOCK_THRESHOLD}`];
      default:
        return [];
    }
  });
  if (stockConditions.length) conditions.push(or(...stockConditions)!);

  const flagConditions = (query.flags ?? [])
    .map((flag) => FLAG_COLUMNS[flag as ProductFlag])
    .filter(Boolean);
  if (flagConditions.length) conditions.push(or(...flagConditions)!);

  if (query.createdFrom) {
    conditions.push(gte(products.createdAt, query.createdFrom));
  }
  if (query.createdTo) conditions.push(lt(products.createdAt, query.createdTo));

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    const searchConditions: SQL[] = [
      ilike(products.sku, pattern),
      // Title or slug in any locale, so Arabic titles are searchable too.
      sql`exists (
        select 1 from product_translations pt
        where pt.product_id = ${products.id}
          and (pt.title ilike ${pattern} or pt.slug ilike ${pattern})
      )`,
      sql`exists (
        select 1 from product_variants pv
        where pv.product_id = ${products.id}
          and (pv.sku ilike ${pattern} or pv.bar_code ilike ${pattern})
      )`,
      sql`exists (
        select 1 from brands b
        where b.id = ${products.brandId} and b.name ilike ${pattern}
      )`,
      sql`exists (
        select 1 from categories c
        where c.id = ${products.categoryId}
          and (c.name ilike ${pattern} or c.name_ar ilike ${pattern})
      )`,
      sql`exists (
        select 1 from sellers s
        where s.id = ${products.sellerId}
          and (s.business_name ilike ${pattern} or s.display_name ilike ${pattern})
      )`,
    ];
    if (UUID_RE.test(search)) searchConditions.push(eq(products.id, search));
    conditions.push(or(...searchConditions)!);
  }

  return conditions.length ? and(...conditions) : undefined;
}

/** Server-side filtered, sorted and paginated admin products list. */
export async function getAdminProducts(query: AdminProductsQuery = {}) {
  try {
    await getAdminUser();

    const limit = Math.min(query.limit || 20, 100);
    const offset = query.offset || 0;
    const where = await buildWhere(query);

    const sortExpression = {
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      title: enTitle,
      price: finalPrice,
      quantity: quantityNumber,
      averageRating: products.averageRating,
    }[query.sort?.id ?? "createdAt"];
    const direction = query.sort?.desc === false ? asc : desc;

    // Sequential (not Promise.all) to stay within the serverless pool.
    const rows = await db.query.products.findMany({
      where,
      columns: {
        id: true,
        sku: true,
        status: true,
        averageRating: true,
        reviewCount: true,
        quantity: true,
        price: true,
        images: true,
        isFeatured: true,
        isTrending: true,
        isSeasonal: true,
        sponsored: true,
        isPlatformChoice: true,
        isMostSelling: true,
        freeDelivery: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        brand: { columns: { id: true, name: true } },
        category: { columns: { id: true, name: true } },
        seller: {
          columns: {
            id: true,
            slug: true,
            businessName: true,
            displayName: true,
          },
        },
        productTranslations: {
          columns: { locale: true, title: true, slug: true },
        },
      },
      orderBy: [
        ...(query.pendingFirst
          ? [sql`(${products.status} = 'pending') desc`]
          : []),
        sql`${direction(sortExpression)} nulls last`,
        desc(products.id),
      ],
      limit,
      offset,
    });

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where);

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.status, "pending"));

    const data = rows.map(({ productTranslations: translations, images: rawImages, ...product }) => {
      const translation =
        translations.find((t) => t.locale === "en") ?? translations[0];
      const images = Array.isArray(rawImages)
        ? (rawImages as unknown[]).filter(
            (image): image is string => typeof image === "string"
          )
        : [];
      return {
        ...product,
        image: images[0] ?? null,
        title: translation?.title ?? "Untitled product",
        slug: translation?.slug ?? "",
        quantity: Number(product.quantity ?? 0),
      };
    });

    return {
      success: true as const,
      data,
      totalCount: Number(countRow?.count ?? 0),
      pendingCount: Number(pendingRow?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Options for the category / brand / seller filters (all of them, not just the current page). */
export async function getProductFilterOptions() {
  try {
    await getAdminUser();

    const categoryRows = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.name));
    const brandRows = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .orderBy(asc(brands.name));
    const sellerRows = await db
      .select({
        id: sellers.id,
        slug: sellers.slug,
        name: sql<string>`coalesce(nullif(${sellers.businessName}, ''), ${sellers.displayName})`,
      })
      .from(sellers)
      .orderBy(asc(sellers.businessName));

    return {
      success: true as const,
      data: {
        categories: categoryRows
          .filter((row) => row.name)
          .map((row) => ({ value: row.id, label: row.name as string })),
        brands: brandRows.map((row) => ({ value: row.id, label: row.name })),
        sellers: sellerRows.map((row) => ({
          value: row.id,
          label: row.name,
          slug: row.slug,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching product filter options:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface ProductFormCategoryOption {
  id: string;
  name: string;
  nameAr: string | null;
  /** Ancestors' names, root first (excludes the category itself). */
  ancestors: string[];
  isLeaf: boolean;
}

export interface ProductFormBrandOption {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

/** Category tree (with breadcrumb paths) and brands for the product edit pickers. */
export async function getProductFormOptions() {
  try {
    await getAdminUser();

    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        nameAr: categories.nameAr,
        parentId: categories.parentId,
      })
      .from(categories);
    const brandRows = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logoUrl: brands.logoUrl,
      })
      .from(brands)
      .orderBy(asc(brands.name));

    const byId = new Map(categoryRows.map((row) => [row.id, row]));
    const parentIds = new Set(categoryRows.map((row) => row.parentId));

    const ancestorsOf = (id: string): string[] => {
      const path: string[] = [];
      const seen = new Set<string>([id]);
      let parentId = byId.get(id)?.parentId;
      while (parentId && !seen.has(parentId)) {
        seen.add(parentId);
        const parent = byId.get(parentId);
        if (!parent) break;
        path.unshift(parent.name ?? "Unnamed");
        parentId = parent.parentId;
      }
      return path;
    };

    const categoryOptions: ProductFormCategoryOption[] = categoryRows
      .map((row) => ({
        id: row.id,
        name: row.name ?? "Unnamed",
        nameAr: row.nameAr,
        ancestors: ancestorsOf(row.id),
        isLeaf: !parentIds.has(row.id),
      }))
      .sort((a, b) =>
        [...a.ancestors, a.name]
          .join(" / ")
          .localeCompare([...b.ancestors, b.name].join(" / "))
      );

    return {
      success: true as const,
      data: { categories: categoryOptions, brands: brandRows },
    };
  } catch (error) {
    console.error("Error fetching product form options:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
