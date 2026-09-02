import {
  db,
  and,
  eq,
  inArray,
  orders,
  shipments,
  shippingAutomation,
  shippingProviders,
} from "@workspace/db";

import {
  address,
  buildWhere,
  customer,
  SHIPPABLE,
  stageConditions,
} from "@/app/(admin)/orders/orders.query";
import { applyBulkAssign, type ApplyBulkAssignOutcome } from "@/lib/apply-bulk-assign";

/**
 * Auto Confirm / Auto Assign.
 *
 * Deliberately NOT a "use server" module: the toggles' Server Actions and the
 * headless `/api/automation` webhook both call in here, and only the former
 * has an admin session. Nothing in this file authenticates — every caller must
 * do that first.
 *
 * These two functions are thin on purpose. Confirmation is the same UPDATE the
 * "Mark confirmed" bulk action performs, and assignment goes through
 * applyBulkAssign(), the same transaction "Assign all" uses. Automation
 * decides *when*, never *what* — so there is exactly one implementation of
 * either operation.
 */

/** Null provider means our own fleet; resolved by code so no seed id is hardcoded. */
const OWN_FLEET_CODE = "tallaby";

/** What bulkAssignProviderSchema defaults to when the dialog is left untouched. */
const DEFAULT_WEIGHT_KG = 1;
const DEFAULT_VOLUME = "Small" as const;

export interface AutomationSettings {
  autoConfirm: boolean;
  autoAssign: boolean;
  autoAssignProviderId: string | null;
}

export async function readAutomationSettings(): Promise<AutomationSettings> {
  const [row] = await db
    .select({
      autoConfirm: shippingAutomation.autoConfirm,
      autoAssign: shippingAutomation.autoAssign,
      autoAssignProviderId: shippingAutomation.autoAssignProviderId,
    })
    .from(shippingAutomation)
    .limit(1);

  // The migration seeds the singleton row, but a missing row must read as
  // "everything off" rather than throw — automation is never load-bearing.
  return row ?? { autoConfirm: false, autoAssign: false, autoAssignProviderId: null };
}

/**
 * Confirms Pending-stage orders. Scoped to one order when the webhook names
 * one, otherwise it sweeps the whole stage — which also lets a toggle that was
 * just switched on clear whatever backlog had accumulated.
 *
 * The stage predicate is re-evaluated here rather than trusted from the
 * caller: the webhook's order id arrives from a database trigger that fired
 * before any of this ran, and the order may have moved on since.
 */
export async function runAutoConfirm(orderId?: string): Promise<number> {
  const eligible = await db
    .select({ id: orders.id })
    .from(orders)
    .leftJoin(shipments, eq(shipments.orderId, orders.id))
    .where(
      and(
        SHIPPABLE,
        ...stageConditions("pending"),
        ...(orderId ? [eq(orders.id, orderId)] : [])
      )
    );

  if (eligible.length === 0) return 0;

  const now = new Date().toISOString();
  const updated = await db
    .update(orders)
    .set({ status: "confirmed", updatedAt: now })
    .where(
      and(
        inArray(
          orders.id,
          eligible.map((row) => row.id)
        ),
        eq(orders.status, "pending")
      )
    )
    .returning({ id: orders.id });

  return updated.length;
}

export type AutoAssignOutcome =
  | { ok: true; assigned: number; batchId: string | null }
  | { ok: false; code: "provider_unavailable" | "no_orders" | "plan_blocked" };

/**
 * Assigns Confirmed-stage orders to the automation provider.
 *
 * Only our own fleet is wired up today — an external provider's assignment
 * usually implies a sheet handoff or an API call a human should be watching.
 * `autoAssignProviderId` on the settings row is the seam for that later; when
 * it is null this resolves the `tallaby` provider by code.
 */
export async function runAutoAssign(orderId?: string): Promise<AutoAssignOutcome> {
  const settings = await readAutomationSettings();

  const [provider] = settings.autoAssignProviderId
    ? await db
        .select({ id: shippingProviders.id })
        .from(shippingProviders)
        .where(
          and(
            eq(shippingProviders.id, settings.autoAssignProviderId),
            eq(shippingProviders.isActive, true)
          )
        )
        .limit(1)
    : await db
        .select({ id: shippingProviders.id })
        .from(shippingProviders)
        .where(
          and(eq(shippingProviders.code, OWN_FLEET_CODE), eq(shippingProviders.isActive, true))
        )
        .limit(1);

  if (!provider) return { ok: false, code: "provider_unavailable" };

  const rows = orderId
    ? await db
        .select({ id: orders.id })
        .from(orders)
        .leftJoin(shipments, eq(shipments.orderId, orders.id))
        .where(and(SHIPPABLE, ...stageConditions("confirmed"), eq(orders.id, orderId)))
    : await db
        .select({ id: orders.id })
        .from(orders)
        .leftJoin(shipments, eq(shipments.orderId, orders.id))
        .leftJoin(customer, eq(customer.id, orders.userId))
        .leftJoin(address, eq(address.id, orders.shippingAddressId))
        .where(buildWhere({ stage: "confirmed", page: 1, pageSize: 1 }));

  if (rows.length === 0) return { ok: false, code: "no_orders" };

  const outcome: ApplyBulkAssignOutcome = await applyBulkAssign({
    providerId: provider.id,
    orderIds: rows.map((row) => row.id),
    weightKg: DEFAULT_WEIGHT_KG,
    volume: DEFAULT_VOLUME,
    createdBy: null,
  });

  if (!outcome.ok) {
    // "No Tallaby driver available" lands here. Nothing was written, and the
    // next order (or the next toggle-on sweep) retries — so an off-duty fleet
    // simply parks the backlog in Confirmed instead of erroring at the customer.
    return { ok: false, code: outcome.code === "no_orders" ? "no_orders" : "plan_blocked" };
  }

  return { ok: true, assigned: outcome.data.assigned, batchId: outcome.data.batchId };
}
