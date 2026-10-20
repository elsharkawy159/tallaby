import { and, db, desc, eq, inArray, sellerWallet, sellerWalletTopUps, sellers, sql } from "@workspace/db";
import {
  MANUAL_TOP_UP_METHODS,
  MAX_OPEN_MANUAL_TOP_UPS,
  isOwnTopUpProofPath,
  manualTopUpInputSchema,
  parseStoreTopUpAmount,
  type ManualTopUpMethod,
} from "./top-up.lib";

/**
 * Manual store-wallet top-ups (owner request 2026-10-18). The seller sends the
 * money by Vodafone Cash or InstaPay and uploads the receipt; this only records
 * a `pending` request. Nothing is credited here: an admin approves it with
 * reviewManualStoreTopUp (@workspace/lib/admin), which posts the ledger entry.
 */

type Queryable = typeof db;

export type SubmitManualTopUpError =
  | "invalid"
  | "too_small"
  | "too_large"
  | "invalid_proof"
  | "too_many_open"
  | "wallet_not_active";

export type SubmitManualTopUpResult =
  | { success: true; topUpId: string; amount: string }
  | { success: false; error: SubmitManualTopUpError };

class SubmitError extends Error {
  constructor(readonly code: SubmitManualTopUpError) {
    super(code);
  }
}

export async function submitManualStoreTopUp(
  input: { sellerId: string; actorId: string; data: unknown },
  q: Queryable = db,
): Promise<SubmitManualTopUpResult> {
  const parsed = manualTopUpInputSchema.safeParse(input.data);
  if (!parsed.success) return { success: false, error: "invalid" };
  const amount = parseStoreTopUpAmount(parsed.data.amount);
  if (!amount.success) return amount;
  if (!isOwnTopUpProofPath(input.sellerId, parsed.data.proofPath)) return { success: false, error: "invalid_proof" };

  try {
    const topUpId = await q.transaction(async (tx) => {
      // Serialises one seller's submissions so the open-request cap holds.
      const [seller] = await tx.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, input.sellerId)).for("update");
      if (!seller) throw new SubmitError("invalid");

      const [wallet] = await tx
        .select({ status: sellerWallet.status })
        .from(sellerWallet)
        .where(eq(sellerWallet.sellerId, input.sellerId));
      if (wallet && wallet.status !== "active") throw new SubmitError("wallet_not_active");

      const [open] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(sellerWalletTopUps)
        .where(
          and(
            eq(sellerWalletTopUps.sellerId, input.sellerId),
            eq(sellerWalletTopUps.status, "pending"),
            inArray(sellerWalletTopUps.provider, [...MANUAL_TOP_UP_METHODS]),
          ),
        );
      if ((open?.count ?? 0) >= MAX_OPEN_MANUAL_TOP_UPS) throw new SubmitError("too_many_open");

      // One request per receipt file, whichever method it was sent with.
      const [reused] = await tx
        .select({ id: sellerWalletTopUps.id })
        .from(sellerWalletTopUps)
        .where(
          and(
            eq(sellerWalletTopUps.sellerId, input.sellerId),
            eq(sellerWalletTopUps.providerReference, parsed.data.proofPath),
          ),
        )
        .limit(1);
      if (reused) throw new SubmitError("invalid_proof");

      const [row] = await tx
        .insert(sellerWalletTopUps)
        .values({
          sellerId: input.sellerId,
          amount: amount.amount,
          provider: parsed.data.method,
          status: "pending",
          // One request per receipt file.
          providerReference: parsed.data.proofPath,
          metadata: {
            proofPath: parsed.data.proofPath,
            ...(parsed.data.senderPhone && { senderPhone: parsed.data.senderPhone }),
          },
          createdBy: input.actorId,
        })
        .returning({ id: sellerWalletTopUps.id });
      return row!.id;
    });
    return { success: true, topUpId, amount: amount.amount };
  } catch (error) {
    if (error instanceof SubmitError) return { success: false, error: error.code };
    // The unique (provider, provider_reference) index: this receipt was already sent.
    const code = (error as { code?: string; cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code;
    if (code === "23505") return { success: false, error: "invalid_proof" };
    throw error;
  }
}

export type ManualTopUpRow = {
  id: string;
  amount: string;
  method: ManualTopUpMethod;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "processing";
  failureReason: string | null;
  createdAt: string;
};

/** This seller's recent manual top-ups (pending first), for the wallet page. */
export async function listManualStoreTopUps(sellerId: string, limit = 10, q: Queryable = db): Promise<ManualTopUpRow[]> {
  const rows = await q
    .select({
      id: sellerWalletTopUps.id,
      amount: sellerWalletTopUps.amount,
      method: sellerWalletTopUps.provider,
      status: sellerWalletTopUps.status,
      failureReason: sellerWalletTopUps.failureReason,
      createdAt: sellerWalletTopUps.createdAt,
    })
    .from(sellerWalletTopUps)
    .where(
      and(
        eq(sellerWalletTopUps.sellerId, sellerId),
        inArray(sellerWalletTopUps.provider, [...MANUAL_TOP_UP_METHODS]),
        sql`(${sellerWalletTopUps.status} = 'pending' OR ${sellerWalletTopUps.createdAt} > now() - interval '30 days')`,
      ),
    )
    .orderBy(sql`(${sellerWalletTopUps.status} = 'pending') DESC`, desc(sellerWalletTopUps.createdAt))
    .limit(limit);
  return rows as ManualTopUpRow[];
}
