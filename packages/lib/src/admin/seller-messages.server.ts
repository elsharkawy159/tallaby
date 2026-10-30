/**
 * Messages from the Tallaby team to one seller (ROADMAP.md F-06f, 0131).
 *
 * One audited write: re-checks the admin inside the transaction, inserts a
 * `seller_notifications` row of type `admin_message` (the 0098 trigger nudges
 * the seller's bell, the 0124 dispatcher pushes it to the seller's devices)
 * and writes one admin_audit_log row. The dedupe key comes from the dialog's
 * idempotency key, so a double submit sends nothing twice.
 */
import { db, eq, sellerNotifications, sellers } from "@workspace/db";
import { sellerMessageSchema, type AdminResult } from "./admin.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";

export type SellerMessageError = "not_admin" | "invalid_input" | "not_found" | "already_sent";
export type SellerMessageResult = { notificationId: string; auditId: string };

class MessageError extends Error {
  constructor(readonly code: SellerMessageError) {
    super(code);
  }
}

export async function sendSellerMessageByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<SellerMessageResult, SellerMessageError>> {
  const parsed = sellerMessageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const m = parsed.data;

  try {
    const data = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [seller] = await tx.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, m.sellerId)).limit(1);
      if (!seller) throw new MessageError("not_found");

      const message = { title: m.title, body: m.body, ...(m.link ? { link: m.link } : {}) };
      const [row] = await tx
        .insert(sellerNotifications)
        .values({
          sellerId: m.sellerId,
          type: "admin_message",
          data: message,
          dedupeKey: `admin_message:${m.idempotencyKey.toLowerCase()}`,
        })
        .onConflictDoNothing()
        .returning({ id: sellerNotifications.id });
      if (!row) throw new MessageError("already_sent");

      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: m.sellerId,
        targetType: "seller_notification",
        targetId: row.id,
        action: "send_seller_notification",
        before: {},
        after: message,
        reason: "Message sent to the seller's dashboard",
      });
      return { notificationId: row.id, auditId };
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof MessageError) return { success: false, error: error.code };
    throw error;
  }
}
