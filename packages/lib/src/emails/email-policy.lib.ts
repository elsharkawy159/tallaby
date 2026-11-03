/**
 * The one list of what happens to each automatic email (owner, 2026-11-04;
 * ROADMAP.md F-63; docs/email-inventory.md). Pure, so it can be tested alone.
 * To turn an email back on, change its line to "keep".
 */

export type EmailRule =
  /** Sends only for a store subscribed to the Order notifications app; 1 cent per order. */
  | "order_app"
  /** Always sends. */
  | "keep"
  /** Not automatic: a seller chose to send it. Always sends. */
  | "manual"
  /** Skipped, with no delivery claim. */
  | "paused";

export const EMAIL_RULES = {
  // Customer order emails
  order_confirmation: "order_app",
  order_shipped: "order_app",
  order_delivered: "order_app",
  order_cancelled: "order_app",
  refund_issued: "order_app",
  // "Your store is ready on Tallaby"
  seller_store_created: "keep",
  // Campaigns a seller sends, and their test sends
  store_campaign: "manual",
  store_campaign_test: "manual",
  // Other sellers' mail
  seller_new_order: "paused",
  seller_order_cancelled: "paused",
  seller_low_stock: "paused",
  seller_wallet_top_up: "paused",
  fee_trial_reminder_t7: "paused",
  fee_trial_reminder_t1: "paused",
  // Other customers' mail
  welcome: "paused",
  digital_delivery: "paused",
  abandoned_cart: "paused",
  back_in_stock: "paused",
  store_winback: "paused",
} as const satisfies Record<string, EmailRule>;

export type AutomaticEmailType = keyof typeof EMAIL_RULES;

/** A type missing from the list doesn't send. */
export const emailRule = (type: AutomaticEmailType): EmailRule => EMAIL_RULES[type] ?? "paused";

export type EmailSendDecision = { action: "send"; charge: boolean };
export type EmailSkipDecision = { action: "skip"; reason: "paused" | "not_subscribed" | "check_failed" };
export type EmailDecision = EmailSendDecision | EmailSkipDecision;

/**
 * Before the USD switch everything sends as it did, so a deploy changes nothing.
 * After it, the rules apply. Only "order_app" emails can charge: the wallet's
 * per-order claim makes every email after an order's first a no-op.
 */
export function emailDecision(input: {
  type: AutomaticEmailType;
  storeId: string | null;
  usdLive: boolean;
  subscribed: boolean;
}): EmailDecision {
  const rule = emailRule(input.type);
  if (rule === "keep" || rule === "manual" || !input.usdLive) return { action: "send", charge: false };
  if (rule === "paused" || !input.storeId) return { action: "skip", reason: "paused" };
  if (!input.subscribed) return { action: "skip", reason: "not_subscribed" };
  return { action: "send", charge: true };
}
