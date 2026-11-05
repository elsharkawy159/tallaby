"use server";

import {
  listSellerNotifications,
  markSellerNotificationsRead,
} from "@workspace/lib/notifications/server";
import { parseNotificationIds } from "@workspace/lib/notifications";
import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { ORDER_LOCKED_TYPES } from "@/lib/push/push-alerts.lib";

/** The header bell's feed for the signed-in seller (seller id from the session only). */
export async function getSellerNotificationFeed() {
  const { sellerId } = await requireSeller();
  const { locked } = await loadOrderLock(sellerId);
  return listSellerNotifications(sellerId, undefined, locked ? ORDER_LOCKED_TYPES : []);
}

/**
 * Marks the seller's notifications read. `ids` omitted marks all of them;
 * otherwise it must be a list of notification UUIDs. Ids belonging to another
 * seller match nothing.
 */
export async function markSellerNotificationsReadAction(ids?: unknown) {
  const { sellerId } = await requireSeller();
  if (ids === undefined) {
    await markSellerNotificationsRead(sellerId);
    return { ok: true as const };
  }
  const parsed = parseNotificationIds(ids);
  if (!parsed) return { ok: false as const };
  await markSellerNotificationsRead(sellerId, parsed);
  return { ok: true as const };
}
