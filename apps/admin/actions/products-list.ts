"use server";

import { db } from "@workspace/db";
import {
  brands,
  categories,
  products,
  productTranslations,
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
  "platform-choice": sql`${products.isPlatformChoice} = true`,
  "most-selling": sql`${products.isMostSelling} = true`,
  "free-delivery": sql`${products.freeDelivery} = true`,
};

const quantityNumber = sql`coalesce(${products.quantity}, 0)::numeric`;
const finalPrice = sql`coalesce((${products.price}->>'final')::numeric, 0)`;
const enTitle = sql<string>`(
  select ${productTranslations.title} from ${productTranslations}
  where ${productTranslations.productId} = ${products.id}
  order by (${productTranslations.locale} = 'en') desc
  limit 1
)`;

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
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(products.sku, pattern),
        sql`${products.id}::text = ${search}`,
        // Any locale, so Arabic titles are searchable too.
        sql`exists (
          select 1 from ${productTranslations}
          where ${productTranslations.productId} = ${products.id}
            and ${productTranslations.title} ilike ${pattern}
        )`
      )!
    );
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
