import {
  coupons,
  db,
  orderItems,
  products,
  reviews,
  sellerPayouts,
  shipments,
  storeFormSubmissions,
  stores,
} from "@workspace/db";
import { and, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { couponInStore, productInStore } from "@workspace/lib/stores/scope/server";
import type { SidebarCounts } from "./sidebar.types";

export type SidebarCountsScope = {
  /** A seller who isn't activated gets no count that follows from orders (ROADMAP.md F-68): those stay 0, unread. */
  ordersLocked: boolean;
  /** The store selected in the sidebar (one of this seller's, from getSellerStores); null = the account. */
  storeId: string | null;
  catalogSplit: boolean;
};

const ZERO = sql`0`;
const countOf = (table: PgTable, where: SQL | undefined) => sql`(SELECT count(*) FROM ${table} WHERE ${where ?? sql`true`})`;

/**
 * The sidebar badges in one statement (one round trip, one pool connection).
 * Every count is scoped to `sellerId` (the session seller) and, where the page
 * it links to is per store, to `storeId`.
 */
export function sidebarCountsSql(sellerId: string, { ordersLocked, storeId, catalogSplit }: SidebarCountsScope): SQL {
  // Products: the selected store's (the store the Products link opens, F-87c); no store = the account.
  const productsInStore = storeId ? productInStore(storeId, { catalogSplit, scope: "managed" }) : undefined;
  return sql`SELECT
    ${ordersLocked ? ZERO : countOf(orderItems, eq(orderItems.sellerId, sellerId))} AS orders,
    ${countOf(products, and(eq(products.sellerId, sellerId), isNull(products.deletedAt), productsInStore))} AS products,
    ${countOf(reviews, eq(reviews.sellerId, sellerId))} AS reviews,
    ${countOf(coupons, and(eq(coupons.sellerId, sellerId), storeId ? couponInStore(storeId) : undefined))} AS coupons,
    ${ordersLocked ? ZERO : countOf(sellerPayouts, eq(sellerPayouts.sellerId, sellerId))} AS payouts,
    ${
      ordersLocked
        ? ZERO
        : countOf(shipments, and(eq(shipments.sellerId, sellerId), inArray(shipments.status, ["assigned", "out_for_delivery"])))
    } AS shipments,
    (SELECT count(*) FROM ${storeFormSubmissions}
       INNER JOIN ${stores} ON ${eq(stores.id, storeFormSubmissions.storeId)}
      WHERE ${and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt), eq(storeFormSubmissions.status, "new"))}) AS forms`;
}

type CountsRow = Record<"orders" | "products" | "reviews" | "coupons" | "payouts" | "shipments" | "forms", string | number | null>;

export async function countSidebarItems(sellerId: string, scope: SidebarCountsScope): Promise<SidebarCounts> {
  const [row] = await db.execute<CountsRow>(sidebarCountsSql(sellerId, scope));
  const n = (value: string | number | null | undefined) => Number(value ?? 0);
  const orders = n(row?.orders);
  return {
    dashboard: orders,
    orders,
    shipping: n(row?.shipments),
    products: n(row?.products),
    reviews: n(row?.reviews),
    // Coupons: the selected store's plus "All stores" ones, as the Coupons page lists (F-87k).
    promotions: n(row?.coupons),
    marketing: 0,
    financial: n(row?.payouts),
    // New store form submissions across the seller's stores (Website › Forms, P4-10), as countNewFormSubmissions.
    forms: n(row?.forms),
  };
}
