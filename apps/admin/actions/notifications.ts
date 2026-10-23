"use server";

import {
  listAdminNotifications,
  markAdminNotificationsRead,
} from "@workspace/lib/notifications/server";
import { parseNotificationIds } from "@workspace/lib/notifications";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";

/** The header bell's feed: newest notifications plus the unread count. */
export async function getAdminNotificationFeed() {
  await getCurrentAdminUser();
  return listAdminNotifications();
}

/**
 * Marks notifications read for the whole admin team. `ids` omitted marks all
 * of them; otherwise it must be a list of notification UUIDs.
 */
export async function markAdminNotificationsReadAction(ids?: unknown) {
  const admin = await getCurrentAdminUser();
  if (ids === undefined) {
    await markAdminNotificationsRead(admin.id);
    return { ok: true as const };
  }
  const parsed = parseNotificationIds(ids);
  if (!parsed) return { ok: false as const };
  await markAdminNotificationsRead(admin.id, parsed);
  return { ok: true as const };
}
