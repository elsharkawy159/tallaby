"use server";

import {
  db,
  orderItems,
  orders,
  products,
  productTranslations,
} from "@workspace/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { getUser } from "@/actions/auth";

export interface DashboardSearchResults {
  products: { id: string; title: string; sku: string | null }[];
  orders: { id: string; orderNumber: string; productName: string }[];
}

const EMPTY: DashboardSearchResults = { products: [], orders: [] };
const RESULT_LIMIT = 5;

/** Escape LIKE wildcards so a seller typing "%" or "_" matches it literally. */
const likePattern = (query: string) =>
  `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** Header search: the signed-in seller's products (title/SKU) and orders (number). */
export async function searchDashboard(
  query: string
): Promise<DashboardSearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return EMPTY;

  try {
    const session = await getUser();
    const sellerId = session?.user?.id;
    if (!sellerId) return EMPTY;

    const pattern = likePattern(trimmed);
    const locale = await getLocale();

    const [productRows, orderRows] = await Promise.all([
      // One row per translation, so over-fetch and collapse to one per product.
      db
        .select({
          id: products.id,
          sku: products.sku,
          title: productTranslations.title,
          locale: productTranslations.locale,
        })
        .from(products)
        .innerJoin(
          productTranslations,
          eq(productTranslations.productId, products.id)
        )
        .where(
          and(
            eq(products.sellerId, sellerId),
            or(
              ilike(productTranslations.title, pattern),
              ilike(products.sku, pattern)
            )
          )
        )
        .orderBy(desc(products.createdAt))
        .limit(RESULT_LIMIT * 4),
      // An order can hold several of this seller's items; collapse below too.
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          productName: orderItems.productName,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(
          and(
            eq(orderItems.sellerId, sellerId),
            ilike(orders.orderNumber, pattern)
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(RESULT_LIMIT * 4),
    ]);

    const productMap = new Map<string, DashboardSearchResults["products"][number]>();
    for (const row of productRows) {
      const existing = productMap.get(row.id);
      // Prefer the title in the seller's current dashboard language.
      if (!existing || row.locale === locale) {
        productMap.set(row.id, { id: row.id, title: row.title, sku: row.sku });
      }
    }

    const orderMap = new Map<string, DashboardSearchResults["orders"][number]>();
    for (const row of orderRows) {
      if (!orderMap.has(row.id)) orderMap.set(row.id, row);
    }

    return {
      products: [...productMap.values()].slice(0, RESULT_LIMIT),
      orders: [...orderMap.values()].slice(0, RESULT_LIMIT),
    };
  } catch (error) {
    console.error("Dashboard search failed:", error);
    return EMPTY;
  }
}
