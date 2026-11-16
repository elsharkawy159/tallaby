"use server";

import {
  listSellerNotifications,
  markSellerNotificationsRead,
} from "@workspace/lib/notifications/server";
import {
  ORDER_DETAIL_TYPES,
  RETIRED_SELLER_TYPES,
  maskLockedOrderNotification,
  parseNotificationIds,
} from "@workspace/lib/notifications";
import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * The header bell's feed for the signed-in seller (seller id from the session only).
 * While orders are locked (F-84; owner 2026-11-16) each new order shows as "You
 * received a new order" with no details, linking to the top-up page, and the other
 * order rows are left out. The retired first-order row is left out for everyone.
 */
export async function getSellerNotificationFeed() {
  const { sellerId } = await requireSeller();
  const { ordersLocked: locked } = await loadOrderLock(sellerId);
  const feed = await listSellerNotifications(sellerId, undefined, locked ? [...RETIRED_SELLER_TYPES, ...ORDER_DETAIL_TYPES] : RETIRED_SELLER_TYPES);
  return locked ? { ...feed, items: feed.items.map(maskLockedOrderNotification) } : feed;
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
