import { adCampaignRequests, and, db, eq } from "@workspace/db";
import { postStoreWalletEntryOnce } from "@workspace/db/wallet";

/**
 * Gives back the wallet charge of a rejected ad request (PLAN.md P6-11): one
 * compensating `adjustment` per request (reference ad_request:<id>), so a
 * repeated call does nothing. Only for requests paid from the store wallet
 * and already rejected. Proper refunds come with the Kashier refunds work (D3).
 *
 * There is no admin review screen for ad requests yet; whatever rejects one
 * must call this in the same flow.
 */
export async function refundRejectedWalletAdRequest(
  requestId: string,
  actorId: string | null,
): Promise<"refunded" | "already_refunded" | "not_applicable"> {
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select({
        sellerId: adCampaignRequests.sellerId,
        amount: adCampaignRequests.amount,
        status: adCampaignRequests.status,
        paymentMethod: adCampaignRequests.paymentMethod,
      })
      .from(adCampaignRequests)
      .where(and(eq(adCampaignRequests.id, requestId)))
      .for("update");
    if (!request || request.paymentMethod !== "wallet" || request.status !== "rejected") return "not_applicable";

    const entry = await postStoreWalletEntryOnce(tx, {
      sellerId: request.sellerId,
      type: "adjustment",
      amount: Number(request.amount).toFixed(2),
      referenceType: "ad_request",
      referenceId: requestId,
      description: "Refund of a rejected product ad",
      metadata: { reason: "ad_request_rejected" },
      createdBy: actorId,
    });
    return entry ? "refunded" : "already_refunded";
  });
}
