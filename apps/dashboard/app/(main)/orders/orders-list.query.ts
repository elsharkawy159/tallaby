import { and, asc, db, desc, eq, ilike, inArray, isNull, or, orderItems, orders, shipments, sql, users, userAddresses } from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { likePattern } from "../products/_components/products-view.lib";
import { AWAITING_PREP_ORDER_STATUSES, AWAITING_PREP_STAGES, type SellerOrderStage } from "./order-flow.lib";
import {
  ORDERS_TABS,
  TAB_STAGES,
  type OrdersChannel,
  type OrdersListFilters,
  type OrdersSort,
  type OrdersTab,
} from "./orders-view.lib";

/**
 * The seller's orders list, on the server (ROADMAP.md F-43g). Every query is
 * scoped through order_items.seller_id to the session seller's id passed in by
 * the caller. Tabs, search and counts read the same rules the rows are built
 * with (order-flow.lib.ts, orders.lib.ts); orders-list.integration.test.ts
 * holds the two equal, so change them together.
 */

export type OrdersScope = Pick<OrdersListFilters, "channel" | "q" | "attention"> & {
  /** A seller who isn't activated sees only their test orders (F-76). Set by the server, never from the URL. */
  testOnly?: boolean;
};
type OrdersQuery = OrdersScope & Pick<OrdersListFilters, "tab" | "sort">;

const ownOrders = (sellerId: string, testOnly = false) =>
  and(
    inArray(orders.id, db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId))),
    testOnly ? eq(orders.isTest, true) : undefined,
  );

/**
 * resolveSellerOrderStage() as SQL. An order has at most one shipment
 * (shipments_order_id_unique), and the seller doesn't change the stage.
 */
const stageCase = sql`CASE
  WHEN ${orders.status} = 'cancelled' THEN 'cancelled'
  WHEN ${orders.status} IN ('refund_requested', 'refunded') THEN 'refund'
  ELSE COALESCE(
    (SELECT CASE sh.status
              WHEN 'pending' THEN 'to_ship'
              WHEN 'assigned' THEN 'to_ship'
              WHEN 'out_for_delivery' THEN 'out_for_delivery'
              WHEN 'failed' THEN 'failed'
              WHEN 'delivered' THEN 'delivered'
              WHEN 'returned' THEN 'returned'
              WHEN 'cancelled' THEN 'cancelled'
            END
       FROM ${shipments} sh WHERE sh.order_id = ${orders.id}),
    CASE COALESCE(${orders.status}::text, 'pending')
      WHEN 'delivered' THEN 'delivered'
      WHEN 'returned' THEN 'returned'
      WHEN 'out_for_delivery' THEN 'out_for_delivery'
      WHEN 'payment_processing' THEN 'awaiting_payment'
      WHEN 'pending' THEN CASE WHEN ${orders.paymentStatus} IN ('paid', 'collected') THEN 'to_ship' ELSE 'new' END
      ELSE 'to_ship'
    END
  )
END`;
// Nested on purpose: in a one-table select, drizzle strips the table name from a
// field's top-level columns, and a bare "id" would mean the shipment's id in there.
export const orderStageSql = sql<SellerOrderStage>`${stageCase}`;

const stagesCondition = (stages: readonly SellerOrderStage[]): SQL =>
  sql`${orderStageSql} IN (${sql.join(
    stages.map((stage) => sql`${stage}`),
    sql`, `,
  )})`;

/** The row's bosta?.needsAttention. */
const needsAttentionSql = (sellerId: string) => sql`COALESCE((
  SELECT sh.needs_attention AND sh.carrier = 'bosta' AND sh.seller_id = ${sellerId}
    FROM ${shipments} sh WHERE sh.order_id = ${orders.id}
), false)`;

const WS = sql.raw(String.raw`E' \t\n\r\f\u000B '`);
const trimmed = (column: SQL | typeof userAddresses.phone) => sql`NULLIF(btrim(${column}, ${WS}), '')`;

/** resolveCustomerName(): the shipping address, then the user's name, then a real email. */
const customerNameSql = sql`COALESCE(
  (SELECT ${trimmed(sql`a.full_name`)} FROM ${userAddresses} a WHERE a.id = ${orders.shippingAddressId}),
  (SELECT COALESCE(
            ${trimmed(sql`u.full_name`)},
            CASE WHEN u.email LIKE '%@temp.local%' THEN NULL ELSE ${trimmed(sql`u.email`)} END
          )
     FROM ${users} u WHERE u.id = ${orders.userId}),
  ''
)`;

/** resolveCustomerPhone(), digits only. */
const customerPhoneDigitsSql = sql`regexp_replace(COALESCE(
  (SELECT ${trimmed(sql`a.phone`)} FROM ${userAddresses} a WHERE a.id = ${orders.shippingAddressId}),
  (SELECT ${trimmed(sql`u.phone`)} FROM ${users} u WHERE u.id = ${orders.userId}),
  ''
), '[^0-9]', '', 'g')`;

/** matchesQuery(): order number, customer name or phone (digits only, from 3). */
function searchCondition(text: string): SQL | undefined {
  const q = text.trim();
  if (!q) return undefined;
  const digits = q.replace(/\D/g, "");
  return or(
    ilike(orders.orderNumber, likePattern(q.replace(/^#/, ""))),
    sql`${customerNameSql} ILIKE ${likePattern(q)}`,
    digits.length >= 3 ? sql`${customerPhoneDigitsSql} LIKE ${likePattern(digits)}` : undefined,
  );
}

/** Store, search and the Bosta filter: what tab counts respect, as they always have. */
function scopeConditions(sellerId: string, filters: OrdersScope): (SQL | undefined)[] {
  return [
    ownOrders(sellerId, filters.testOnly),
    filters.channel === "all"
      ? undefined
      : filters.channel === "marketplace"
        ? isNull(orders.storeId)
        : eq(orders.storeId, filters.channel),
    searchCondition(filters.q),
    filters.attention ? needsAttentionSql(sellerId) : undefined,
  ];
}

const tabCondition = (tab: OrdersTab | null): SQL | undefined =>
  !tab || tab === "all" ? undefined : stagesCondition(TAB_STAGES[tab]);

function sortOrder(sort: OrdersSort): SQL[] {
  // created_at can repeat, so the id keeps paging stable.
  const newest = [sql`${orders.createdAt} DESC NULLS LAST`, desc(orders.id)];
  switch (sort) {
    case "oldest":
      return [sql`${orders.createdAt} ASC NULLS LAST`, asc(orders.id)];
    case "totalDesc":
      return [desc(orders.totalAmount), ...newest];
    case "totalAsc":
      return [asc(orders.totalAmount), ...newest];
    default:
      return newest;
  }
}

async function selectIds(
  sellerId: string,
  filters: OrdersQuery,
  paging?: { limit: number; offset?: number },
  extra?: SQL,
): Promise<string[]> {
  const query = db
    .select({ id: orders.id })
    .from(orders)
    .where(and(...scopeConditions(sellerId, filters), tabCondition(filters.tab), extra))
    .orderBy(...sortOrder(filters.sort))
    .$dynamic();
  const rows = await (paging ? query.limit(paging.limit).offset(paging.offset ?? 0) : query);
  return rows.map((r) => r.id);
}

/** Tab counts for a store, search and Bosta filter; countByTab() in SQL. */
export async function countOrdersByTab(sellerId: string, filters: OrdersScope): Promise<Record<OrdersTab, number>> {
  const rows = await db
    .select({ stage: orderStageSql, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(...scopeConditions(sellerId, filters)))
    .groupBy(sql`1`);
  const counts = Object.fromEntries(ORDERS_TABS.map((tab) => [tab, 0])) as Record<OrdersTab, number>;
  for (const row of rows) {
    counts.all += row.count;
    for (const tab of ORDERS_TABS) {
      if (tab !== "all" && TAB_STAGES[tab].includes(row.stage)) counts[tab] += row.count;
    }
  }
  return counts;
}

/** isAwaitingPrep() in SQL: orders, not lines, in a store or marketplace channel or "all". */
export async function countOrdersAwaitingPrep(sellerId: string, channel: OrdersChannel): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        ...scopeConditions(sellerId, { channel, q: "", attention: false }),
        // A test order is never prepared (F-76).
        eq(orders.isTest, false),
        inArray(sql`COALESCE(${orders.status}::text, 'pending')`, [...AWAITING_PREP_ORDER_STATUSES]),
        stagesCondition(AWAITING_PREP_STAGES),
      ),
    );
  return row?.count ?? 0;
}

/** Facts about all the seller's orders, whatever the filters: any orders at all, and Bosta problems. */
export async function loadOrdersOverview(sellerId: string, testOnly = false): Promise<{ orders: number; attention: number }> {
  const [row] = await db
    .select({
      orders: sql<number>`count(*)::int`,
      attention: sql<number>`(count(*) FILTER (WHERE ${needsAttentionSql(sellerId)}))::int`,
    })
    .from(orders)
    .where(ownOrders(sellerId, testOnly));
  return { orders: row?.orders ?? 0, attention: row?.attention ?? 0 };
}

/** One page of ids, in list order. */
export function listOrderIdsPage(sellerId: string, filters: OrdersQuery, page: number, size: number) {
  return selectIds(sellerId, filters, { limit: size, offset: (page - 1) * size });
}

/** Every filtered id (or the first `limit`), in list order: select all, export and print. */
export function listFilteredOrderIds(sellerId: string, filters: OrdersQuery, limit?: number) {
  return selectIds(sellerId, filters, limit ? { limit } : undefined);
}

/** Filtered orders of one store still waiting to ship, oldest work included: the Bosta and Wassalha queues. */
export function listShipQueueIds(sellerId: string, filters: OrdersQuery, limit: number) {
  return selectIds(sellerId, filters, { limit }, stagesCondition(["new", "to_ship"]));
}
