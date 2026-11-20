/**
 * Admin › Seller notifications: one message to a group of sellers (owner
 * request 2026-11-15, on top of ROADMAP.md F-06f). Pure: the audiences and
 * the input schemas. The server side (`seller-broadcast.server.ts`) counts an
 * audience and sends the same `admin_message` bell row the one-seller dialog
 * sends, so the bell, the push dispatcher and its dedupe work unchanged.
 */
import { z } from "zod";
import { ADMIN_MESSAGE_BODY_MAX, ADMIN_MESSAGE_TITLE_MAX, isDashboardPath } from "../notifications/notifications.lib";

/**
 * Who receives it. Every audience leaves out suspended sellers and sellers
 * whose user account is suspended.
 * - `all`: every seller.
 * - `wallet_empty`: the store wallet balance is 0 or below (the balance the
 *   dashboard Wallet page shows; no wallet row yet counts as 0).
 * - `not_activated`: never topped up, never had a balance above 0, no active
 *   Pro (getOrderLock's activation rule). Empty before the USD switch, when
 *   activation doesn't apply.
 * Store audiences look only at the seller's live stores (not deleted, not
 * archived) and need at least one, so sellers with no store are left out:
 * - `tallaby_pay_not_connected`: no live store has a `connected` Tallaby Pay
 *   row (the row checkout reads; a turned-off one is `disconnected`).
 * - `no_active_product`: no active product outside Trash in a live store.
 * - `site_not_published`: no live store's website is published.
 * - `no_shipping_zones`: no enabled shipping zone in any live store (checkout
 *   then uses Tallaby's rates).
 * - `free_plan` / `pro_plan`: the plan that applies now (isProActive; a lapsed
 *   Pro counts as Free).
 * - `joined_last_7_days`: signed up in the last 7 days.
 */
export const SELLER_AUDIENCES = [
  "all",
  "wallet_empty",
  "not_activated",
  "tallaby_pay_not_connected",
  "no_active_product",
  "site_not_published",
  "no_shipping_zones",
  "free_plan",
  "pro_plan",
  "joined_last_7_days",
] as const;
export type SellerAudience = (typeof SELLER_AUDIENCES)[number];

export function isSellerAudience(value: unknown): value is SellerAudience {
  return typeof value === "string" && (SELLER_AUDIENCES as readonly string[]).includes(value);
}

/** The most sellers one send reaches, so a single transaction stays small. */
export const SELLER_BROADCAST_MAX = 5000;
/** How many business names the preview shows. */
export const SELLER_AUDIENCE_SAMPLE = 5;

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const sellerAudienceSchema = z.enum(SELLER_AUDIENCES);

/**
 * A send. `expectedCount` is the number the admin confirmed ("Send to N
 * sellers?"); the server refuses when the audience no longer has exactly that
 * many sellers, so nobody is messaged without being counted first.
 * `idempotencyKey` is made once per form: a double submit sends nothing twice.
 */
export const sellerBroadcastSchema = z.strictObject({
  audience: sellerAudienceSchema,
  title: z.string().trim().min(1, "Add a title").max(ADMIN_MESSAGE_TITLE_MAX),
  body: z.string().trim().min(1, "Write the message").max(ADMIN_MESSAGE_BODY_MAX),
  link: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || null)
    .refine((value) => value === null || isDashboardPath(value), "The link must be a dashboard path such as /wallet"),
  /** The template the text started from, kept in the audit row only. */
  templateId: z.string().trim().max(40).regex(/^[a-z_]*$/).optional(),
  expectedCount: z.number().int().min(1).max(SELLER_BROADCAST_MAX),
  idempotencyKey: uuid,
});
export type SellerBroadcastInput = z.input<typeof sellerBroadcastSchema>;
