/**
 * The optional email on the simple checkout (ROADMAP.md F-64). A customer with no
 * real account email can give one for this order's updates, only on a store
 * subscribed to Order notifications. It lives on the order
 * (`orders.metadata.notificationEmail`), never on the user: a typed address proves
 * nothing, so it must not take over an account or change who a user is. Campaigns
 * and customer lists read `users.email`, so it never reaches marketing.
 */

export const ORDER_EMAIL_MAX = 254;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A real address: not empty, and not the placeholder guest rows carry. */
export function isRealEmail(email: string | null | undefined): email is string {
  const value = email?.trim();
  return Boolean(value) && !value!.includes("@temp.local");
}

export function orderEmailFieldVisible(input: {
  subscribed: boolean;
  isGuest: boolean;
  accountEmail: string | null | undefined;
}): boolean {
  if (!input.subscribed) return false;
  return input.isGuest || !isRealEmail(input.accountEmail);
}

/** Blank is always fine. A filled value must be a valid address. */
export function parseOptionalOrderEmail(value: unknown): { ok: true; email: string | null } | { ok: false } {
  if (value === null || value === undefined) return { ok: true, email: null };
  if (typeof value !== "string") return { ok: false };
  const email = value.trim();
  if (!email) return { ok: true, email: null };
  if (email.length > ORDER_EMAIL_MAX || !EMAIL_RE.test(email) || !isRealEmail(email)) return { ok: false };
  return { ok: true, email };
}

/** Where an order's emails go: the address given on this order, else the account's real one. */
export function orderEmailRecipient(order: {
  metadata: unknown;
  accountEmail: string | null | undefined;
}): string | null {
  const typed = (order.metadata as { notificationEmail?: unknown } | null | undefined)?.notificationEmail;
  const parsed = parseOptionalOrderEmail(typed);
  if (parsed.ok && parsed.email) return parsed.email;
  return isRealEmail(order.accountEmail) ? order.accountEmail.trim() : null;
}
