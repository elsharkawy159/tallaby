import { db, emailDeliveries, and, eq } from "@workspace/db";

export const EMAIL_TYPES = {
  orderConfirmation: "order_confirmation",
  /** reference_id = seller id; the trial never restarts, so once per seller. */
  feeTrialReminderT7: "fee_trial_reminder_t7",
  feeTrialReminderT1: "fee_trial_reminder_t1",
  /** reference_id = order id (one per order). */
  orderShipped: "order_shipped",
  orderDelivered: "order_delivered",
  orderCancelled: "order_cancelled",
  refundIssued: "refund_issued",
  /** reference_id = cart id. */
  abandonedCart: "abandoned_cart",
  /** reference_id = store_stock_subscriptions.id (one per alert, 0126). */
  backInStock: "back_in_stock",
  /** reference_id = store_email_campaign_recipients.id (F-16a, 0129). */
  storeCampaign: "store_campaign",
  /** reference_id = store_winback_sends.id (F-16e, 0129). */
  storeWinback: "store_winback",
  /** Seller test send of a campaign/win-back draft: fresh reference id; metadata.storeId feeds the daily cap. */
  storeCampaignTest: "store_campaign_test",
  /**
   * Seller mail per (order, seller): reference_id = the seller's first
   * order_items.id in that order, a stable uuid unique to the pair.
   */
  sellerNewOrder: "seller_new_order",
  sellerOrderCancelled: "seller_order_cancelled",
  sellerLowStock: "seller_low_stock",
  /** reference_id = seller_wallet_top_ups.id. */
  sellerWalletTopUp: "seller_wallet_top_up",
  /** reference_id = stores.id. */
  sellerStoreCreated: "seller_store_created",
} as const;

export type EmailType = (typeof EMAIL_TYPES)[keyof typeof EMAIL_TYPES];

/**
 * Terminal-ness ranking for delivery statuses. Resend webhooks can arrive out
 * of order (a delayed `email.sent` after `email.delivered`), so a status only
 * moves forward — never backwards.
 */
const STATUS_RANK: Record<string, number> = {
  claimed: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  complained: 4,
  bounced: 5,
  failed: 6,
};

export type EmailDeliveryRow = typeof emailDeliveries.$inferSelect;

export type ClaimResult =
  | { claimed: true; delivery: EmailDeliveryRow }
  | { claimed: false; existing: EmailDeliveryRow | null };

/**
 * Atomically claims the right to send one email for a (type, reference) pair.
 *
 * The unique index on (email_type, reference_id) makes this the single point
 * of duplicate protection: concurrent or retried callers race on the same
 * INSERT and exactly one of them wins the claim. Everyone else gets
 * `claimed: false` and must not send.
 */
export async function claimEmailDelivery(params: {
  emailType: EmailType;
  referenceId: string;
  recipient: string;
  metadata?: Record<string, unknown>;
}): Promise<ClaimResult> {
  const [row] = await db
    .insert(emailDeliveries)
    .values({
      emailType: params.emailType,
      referenceId: params.referenceId,
      recipient: params.recipient,
      status: "claimed",
      metadata: params.metadata ?? null,
    })
    .onConflictDoNothing({
      target: [emailDeliveries.emailType, emailDeliveries.referenceId],
    })
    .returning();

  if (row) {
    return { claimed: true, delivery: row };
  }

  const existing = await db.query.emailDeliveries.findFirst({
    where: and(
      eq(emailDeliveries.emailType, params.emailType),
      eq(emailDeliveries.referenceId, params.referenceId)
    ),
  });

  return { claimed: false, existing: existing ?? null };
}

/** Records a successful hand-off to Resend. */
export async function markEmailSent(
  deliveryId: string,
  resendEmailId: string | null
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(emailDeliveries)
    .set({
      status: "sent",
      resendEmailId,
      sentAt: now,
      errorMessage: null,
      updatedAt: now,
    })
    .where(eq(emailDeliveries.id, deliveryId));
}

/**
 * Records a failed send. The claim row is released (deleted) so a later retry
 * — a manual resend, or a re-run of the flow — can try again; leaving it in
 * place would permanently suppress the email after one transient provider
 * outage.
 */
export async function releaseFailedEmailDelivery(
  deliveryId: string,
  errorMessage: string
): Promise<void> {
  console.error(
    `email-delivery: releasing claim ${deliveryId} after send failure:`,
    errorMessage
  );
  await db.delete(emailDeliveries).where(eq(emailDeliveries.id, deliveryId));
}

const EVENT_TIMESTAMP_COLUMN: Record<string, keyof EmailDeliveryRow> = {
  sent: "sentAt",
  delivered: "deliveredAt",
  bounced: "bouncedAt",
  complained: "complainedAt",
  failed: "failedAt",
};

/**
 * Applies a webhook status to the delivery row, keeping the furthest-along
 * status. Idempotent: replaying the same event is a no-op beyond timestamps.
 */
export async function applyDeliveryStatus(params: {
  resendEmailId: string;
  status: string;
  occurredAt: string;
  errorMessage?: string | null;
}): Promise<EmailDeliveryRow | null> {
  const delivery = await db.query.emailDeliveries.findFirst({
    where: eq(emailDeliveries.resendEmailId, params.resendEmailId),
  });

  if (!delivery) return null;

  const currentRank = STATUS_RANK[delivery.status] ?? 0;
  const nextRank = STATUS_RANK[params.status] ?? 0;

  const timestampColumn = EVENT_TIMESTAMP_COLUMN[params.status];
  const updates: Partial<typeof emailDeliveries.$inferInsert> = {
    lastEventAt: params.occurredAt,
    updatedAt: new Date().toISOString(),
  };

  if (timestampColumn) {
    (updates as Record<string, unknown>)[timestampColumn] = params.occurredAt;
  }

  if (nextRank > currentRank) {
    updates.status = params.status;
  }

  if (params.errorMessage) {
    updates.errorMessage = params.errorMessage;
  }

  const [row] = await db
    .update(emailDeliveries)
    .set(updates)
    .where(eq(emailDeliveries.id, delivery.id))
    .returning();

  return row ?? null;
}

/** Convenience for tests/ops: look up a delivery by its domain reference. */
export async function findEmailDelivery(
  emailType: EmailType,
  referenceId: string
): Promise<EmailDeliveryRow | null> {
  const row = await db.query.emailDeliveries.findFirst({
    where: and(
      eq(emailDeliveries.emailType, emailType),
      eq(emailDeliveries.referenceId, referenceId)
    ),
  });
  return row ?? null;
}
