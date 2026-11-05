import { adminNotifications, and, db, desc, eq, inArray, isNull, notInArray, sellerNotifications, sql } from "@workspace/db";
import {
  clampNotificationLimit,
  type AdminNotificationType,
  type NotificationFeed,
  type SellerNotificationType,
} from "./notifications.lib";

/**
 * Reads and read-marks for the two header bells (0098). The tables are
 * server-only, so these queries are the authorization: the seller functions
 * take the seller id from the caller's session (never from the client) and
 * scope every statement by it; the admin functions must only be called behind
 * the admin app's session guard.
 */

export async function listAdminNotifications(limit?: number): Promise<NotificationFeed<AdminNotificationType>> {
  const [rows, [unread]] = await Promise.all([
    db
      .select({
        id: adminNotifications.id,
        type: adminNotifications.type,
        data: adminNotifications.data,
        sellerId: adminNotifications.sellerId,
        storeId: adminNotifications.storeId,
        readAt: adminNotifications.readAt,
        createdAt: adminNotifications.createdAt,
      })
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(clampNotificationLimit(limit)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminNotifications)
      .where(isNull(adminNotifications.readAt)),
  ]);

  return {
    items: rows.map((row) => ({ ...row, type: row.type as AdminNotificationType })),
    unreadCount: unread?.count ?? 0,
  };
}

/** Marks the given notifications (or every unread one) read for the whole admin team. */
export async function markAdminNotificationsRead(actorId: string, ids?: string[]): Promise<void> {
  await db
    .update(adminNotifications)
    .set({ readAt: sql`now()`, readBy: actorId })
    .where(
      and(
        isNull(adminNotifications.readAt),
        ids ? inArray(adminNotifications.id, ids) : undefined,
      ),
    );
}

/** `hideTypes` leaves those rows out of both the feed and the unread count. */
export async function listSellerNotifications(
  sellerId: string,
  limit?: number,
  hideTypes: readonly SellerNotificationType[] = [],
): Promise<NotificationFeed<SellerNotificationType>> {
  const shown = hideTypes.length > 0 ? notInArray(sellerNotifications.type, [...hideTypes]) : undefined;
  const [rows, [unread]] = await Promise.all([
    db
      .select({
        id: sellerNotifications.id,
        type: sellerNotifications.type,
        data: sellerNotifications.data,
        sellerId: sellerNotifications.sellerId,
        storeId: sellerNotifications.storeId,
        readAt: sellerNotifications.readAt,
        createdAt: sellerNotifications.createdAt,
      })
      .from(sellerNotifications)
      .where(and(eq(sellerNotifications.sellerId, sellerId), shown))
      .orderBy(desc(sellerNotifications.createdAt))
      .limit(clampNotificationLimit(limit)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sellerNotifications)
      .where(and(eq(sellerNotifications.sellerId, sellerId), isNull(sellerNotifications.readAt), shown)),
  ]);

  return {
    items: rows.map((row) => ({ ...row, type: row.type as SellerNotificationType })),
    unreadCount: unread?.count ?? 0,
  };
}

/** Marks the seller's given notifications (or all of them) read. Other sellers' ids match nothing. */
export async function markSellerNotificationsRead(sellerId: string, ids?: string[]): Promise<void> {
  await db
    .update(sellerNotifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(sellerNotifications.sellerId, sellerId),
        isNull(sellerNotifications.readAt),
        ids ? inArray(sellerNotifications.id, ids) : undefined,
      ),
    );
}
