"use server";

import { and, db, eq, inArray, orderItems, orders } from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";
import { PAYMENT_PROOF_BUCKET, PAYMENT_PROOF_URL_TTL, readPaymentProof } from "@workspace/lib/orders/payment-proof";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

export type PaymentProofView = { url: string; uploadedAt: string } | null;

/**
 * The transfer screenshot a customer attached to an order (ROADMAP.md F-21p),
 * as a short-lived signed link, or null when there is none. Only for a seller
 * with a line on the order; the bucket is private and has no policies.
 */
export async function getOrderPaymentProof(orderId: string): Promise<PaymentProofView> {
  try {
    const { sellerId } = await requireSeller();
    const [order] = await db
      .select({ id: orders.id, metadata: orders.metadata })
      .from(orders)
      .where(
        and(
          eq(orders.id, String(orderId)),
          inArray(orders.id, db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId))),
        ),
      )
      .limit(1);
    const proof = order ? readPaymentProof(order.id, order.metadata) : null;
    if (!proof) return null;

    const { data, error } = await getServiceClient()
      .storage.from(PAYMENT_PROOF_BUCKET)
      .createSignedUrl(proof.path, PAYMENT_PROOF_URL_TTL);
    if (error || !data?.signedUrl) return null;
    return { url: data.signedUrl, uploadedAt: proof.uploadedAt };
  } catch (error) {
    if (!isAccessError(error)) console.error("[payment-proof] read failed", (error as Error)?.message);
    return null;
  }
}
