import { and, db, eq, isNull, orders, storeAppInstalls, stores } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { chargeStoreAppsForOrder } from "../billing/app-billing.server";
import { getBillingState } from "../billing/billing.server";
import {
  emailDecision,
  emailRule,
  orderNotificationChargeable,
  type AutomaticEmailType,
  type EmailDecision,
} from "./email-policy.lib";

/**
 * Applies `EMAIL_RULES` to one email (owner, 2026-11-04; ROADMAP.md F-63).
 * Server-only. The store comes from the order row, never from a client.
 */

export type { AutomaticEmailType, EmailDecision, EmailSendDecision } from "./email-policy.lib";

/** The catalog key of the Order notifications app. */
export const ORDER_NOTIFICATIONS_APP = "customer_notifications";

/**
 * Asks before any send. "keep" and "manual" read nothing, so they can't fail. Any
 * other email doesn't send if the check throws.
 */
export async function decideEmail(type: AutomaticEmailType, storeId: string | null): Promise<EmailDecision> {
  const rule = emailRule(type);
  if (rule === "keep" || rule === "manual") return emailDecision({ type, storeId, usdLive: false, subscribed: false });
  try {
    const { usdLive } = await getBillingState();
    let subscribed = false;
    if (usdLive && rule === "order_app" && storeId) {
      const [install] = await db
        .select({ id: storeAppInstalls.id })
        .from(storeAppInstalls)
        .where(
          and(
            eq(storeAppInstalls.storeId, storeId),
            eq(storeAppInstalls.appKey, ORDER_NOTIFICATIONS_APP),
            isNull(storeAppInstalls.uninstalledAt),
          ),
        )
        .limit(1);
      subscribed = Boolean(install);
    }
    return emailDecision({ type, storeId, usdLive, subscribed });
  } catch (error) {
    logServerError("email", "email policy check failed", { type, storeId }, error);
    return { action: "skip", reason: "check_failed" };
  }
}

/**
 * For a cron that would use up its queue (a claimed stock alert, a planned win-back)
 * on an email that's paused: it stops first, so nothing is lost. A failed check
 * counts as paused.
 */
export async function isAutomaticEmailPaused(type: AutomaticEmailType): Promise<boolean> {
  return (await decideEmail(type, null)).action === "skip";
}

/**
 * Charges an order for an email that really went out. Never throws: a failure is
 * logged and Tallaby absorbs that cent. The wallet's claim
 * (`<store>:<app>:order:<order>`) means 1 cent per order, not per email.
 */
export async function chargeOrderNotification(order: { orderId: string; storeId: string }): Promise<void> {
  try {
    const [row] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, order.orderId)).limit(1);
    if (!orderNotificationChargeable(row?.status)) return;
    const [store] = await db.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, order.storeId)).limit(1);
    if (!store?.sellerId) return;
    await db.transaction((tx) =>
      chargeStoreAppsForOrder(tx, { sellerId: store.sellerId, storeId: order.storeId, orderId: order.orderId }),
    );
  } catch (error) {
    logServerError("wallet", "order notification charge failed", { orderId: order.orderId, storeId: order.storeId }, error);
  }
}
