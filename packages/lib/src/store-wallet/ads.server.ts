import { adCampaignRequests, and, db, eq, sellerWallet, walletTransactions } from "@workspace/db";
import { getBillingState } from "../billing/billing.server";
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

    // What the wallet actually paid, in the currency it paid in (0136).
    const [charge] = await tx
      .select({ amount: walletTransactions.amount, currency: walletTransactions.currency })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.sellerId, request.sellerId),
          eq(walletTransactions.type, "service_charge"),
          eq(walletTransactions.referenceType, "ad_request"),
          eq(walletTransactions.referenceId, requestId),
        ),
      );
    const [wallet] = await tx
      .select({ currency: sellerWallet.currency })
      .from(sellerWallet)
      .where(eq(sellerWallet.sellerId, request.sellerId));
    const charged = charge ? Math.abs(Number(charge.amount)) : Number(request.amount);
    // Charged in EGP before the switch but refunded after it: the same value in USD.
    const rate = charge?.currency !== "USD" && wallet?.currency === "USD" ? (await getBillingState()).marketRate : null;
    const refund = rate ? charged / rate : charged;

    const entry = await postStoreWalletEntryOnce(tx, {
      sellerId: request.sellerId,
      type: "adjustment",
      amount: refund.toFixed(2),
      referenceType: "ad_request",
      referenceId: requestId,
      description: "Refund of a rejected product ad",
      metadata: { reason: "ad_request_rejected" },
      createdBy: actorId,
    });
    return entry ? "refunded" : "already_refunded";
  });
}
