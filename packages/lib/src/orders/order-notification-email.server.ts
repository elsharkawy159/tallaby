import { and, db, desc, eq, isNotNull, orders, sql, users } from "@workspace/db";
import { orderEmailFieldVisible, parseOptionalOrderEmail } from "./order-notification-email.lib";

export type OrderEmailField = { show: boolean; lastEmail: string | null };

/**
 * Should checkout ask this user for an email on this store, and what did they give
 * last time? The store comes from the request host and the user from the session;
 * the last email is read from this user's own orders at this store only.
 */
export async function getOrderEmailField(userId: string, storeId: string): Promise<OrderEmailField> {
  const [user] = await db
    .select({ email: users.email, isGuest: users.isGuest })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const show = orderEmailFieldVisible({
    isGuest: user?.isGuest === true,
    accountEmail: user?.email,
  });
  if (!show) return { show: false, lastEmail: null };
  const typed = sql<string | null>`${orders.metadata} ->> 'notificationEmail'`;
  const [last] = await db
    .select({ email: typed })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.storeId, storeId), isNotNull(typed)))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  return { show: true, lastEmail: last?.email ?? null };
}

/**
 * The email to keep on a new order. Ignored where the field isn't shown, so a
 * client can't attach an address the form never offered. Only a bad address on a
 * store that asks for it is refused.
 */
export async function resolveOrderNotificationEmail(
  userId: string,
  storeId: string,
  typed: unknown,
): Promise<{ ok: true; email: string | null } | { ok: false }> {
  const parsedBlank = parseOptionalOrderEmail(typed);
  if (parsedBlank.ok && !parsedBlank.email) return { ok: true, email: null };
  const { show } = await getOrderEmailField(userId, storeId);
  if (!show) return { ok: true, email: null };
  return parsedBlank;
}
