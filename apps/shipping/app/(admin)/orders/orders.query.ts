/**
 * Query-building helpers shared by orders.server.ts and batch.server.ts.
 *
 * Deliberately NOT a "use server" module: those files start with "use
 * server", and every top-level export of such a file must be an async
 * function — a plain const (SHIPPABLE) or a sync function (buildWhere,
 * revalidateShipping) would break that constraint at build time.
 */
import { revalidatePath } from "next/cache";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, ilike, isNull, or, sql, orders, shipments, userAddresses, users } from "@workspace/db";

import type { OrderStage, ShippingFilters } from "./orders.dto";

export const rider = alias(users, "rider");
export const customer = alias(users, "customer");
export const address = alias(userAddresses, "ship_addr");

/**
 * Only physical orders need a courier. `is_digital_only` is nullable, so NULL is
 * treated as physical — an order must never fall out of the shipping queue
 * because a flag was left unset.
 */
export const SHIPPABLE = or(eq(orders.isDigitalOnly, false), isNull(orders.isDigitalOnly))!;

/**
 * `orders`/`shipments` have no `stage` column — each tab is this predicate
 * over the two existing status enums. "confirmed"'s second disjunct is what
 * makes a prepaid order skip the Pending tab automatically the moment
 * `payment_status` flips to `paid`/`collected`, with no write from this app.
 */
export function stageConditions(stage: OrderStage) {
  switch (stage) {
    case "pending":
      return [
        eq(orders.status, "pending"),
        or(isNull(orders.paymentStatus), sql`${orders.paymentStatus} not in ('paid', 'collected')`)!,
      ];
    case "confirmed":
      return [
        or(
          eq(orders.status, "confirmed"),
          and(eq(orders.status, "pending"), sql`${orders.paymentStatus} in ('paid', 'collected')`)!
        )!,
        or(isNull(shipments.id), eq(shipments.status, "pending"))!,
      ];
    case "shipped":
      return [eq(shipments.status, "assigned")];
    case "out_for_delivery":
      return [eq(shipments.status, "out_for_delivery")];
    case "delivered":
      return [eq(shipments.status, "delivered")];
    case "all":
      return [];
  }
}

export function buildWhere(filters: ShippingFilters) {
  const conditions = [SHIPPABLE, ...stageConditions(filters.stage)];

  // The free shipment-status filter only applies on the "All" tab — every
  // other tab already fixes the underlying status via stageConditions(),
  // and combining the two would just produce contradictory, empty results.
  if (filters.stage === "all" && filters.status) {
    conditions.push(
      filters.status === "pending"
        ? // An order with no shipment row yet is pending by definition.
          or(eq(shipments.status, "pending"), isNull(shipments.id))!
        : eq(shipments.status, filters.status)
    );
  }

  if (filters.providerId) {
    conditions.push(eq(shipments.providerId, filters.providerId));
  }

  if (filters.riderId) {
    conditions.push(eq(shipments.riderId, filters.riderId));
  }

  if (filters.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
  }

  if (filters.codOnly === "cod") {
    conditions.push(
      or(isNull(orders.paymentStatus), sql`${orders.paymentStatus} not in ('paid', 'collected')`)!
    );
  } else if (filters.codOnly === "prepaid") {
    conditions.push(sql`${orders.paymentStatus} in ('paid', 'collected')`);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, term),
        ilike(customer.fullName, term),
        ilike(customer.phone, term),
        ilike(address.phone, term)
      )!
    );
  }

  return and(...conditions);
}

/** `orderId` is omitted by bulk actions, which touch many orders at once. */
export function revalidateShipping(orderId?: string) {
  revalidatePath("/");
  revalidatePath("/orders");
  if (orderId) revalidatePath(`/orders/${orderId}`);
  revalidatePath("/rider");
  revalidatePath("/batches");
}
