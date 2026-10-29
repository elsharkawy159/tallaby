/**
 * Admin review of manual store-wallet top-ups (Vodafone Cash / InstaPay with
 * an uploaded receipt, owner request 2026-10-18).
 *
 * Approving is the ONLY way such a top-up reaches the wallet: one locked
 * transaction re-checks the admin, moves the row out of `pending` once, posts
 * a `top_up` entry through postStoreWalletEntry (claim `top_up:<id>`, so a
 * replay credits nothing) and writes one admin_audit_log row.
 */
import { and, db, desc, eq, inArray, sellerWalletTopUps, sellers, sql } from "@workspace/db";
import {
  DuplicateStoreWalletEntryError,
  STORE_WALLET_REFERENCE_TYPES,
  StoreWalletNotActiveError,
  postStoreWalletEntry,
} from "@workspace/db/wallet";
import { z } from "zod";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN, type AdminResult } from "./admin.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";
import { postReferralCommission } from "../referrals/referrals.server";

const MANUAL = [...MANUAL_TOP_UP_METHODS];

export const topUpReviewSchema = z
  .object({
    topUpId: z.uuid(),
    decision: z.enum(["approve", "reject"]),
    /** Required to reject; approving defaults to "Transfer verified". */
    reason: z.string().trim().max(ADMIN_REASON_MAX).optional(),
  })
  .strict()
  .refine((v) => v.decision === "approve" || (v.reason?.length ?? 0) >= ADMIN_REASON_MIN, {
    message: "reason_required",
    path: ["reason"],
  });

export type TopUpReviewError = "not_admin" | "invalid_input" | "not_found" | "already_reviewed" | "wallet_not_active";
export type TopUpReviewResult = { status: "approved"; balanceAfter: string } | { status: "rejected" };

class ReviewError extends Error {
  constructor(readonly code: TopUpReviewError) {
    super(code);
  }
}

export async function reviewManualStoreTopUp(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<TopUpReviewResult, TopUpReviewError>> {
  const parsed = topUpReviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { topUpId, decision } = parsed.data;
  const reason = parsed.data.reason || "Transfer verified";

  try {
    const data = await q.transaction(async (tx): Promise<TopUpReviewResult> => {
      await assertAdminActor(tx, actorId);
      const [topUp] = await tx
        .select()
        .from(sellerWalletTopUps)
        .where(and(eq(sellerWalletTopUps.id, topUpId), inArray(sellerWalletTopUps.provider, MANUAL)))
        .for("update");
      if (!topUp) throw new ReviewError("not_found");
      if (topUp.status !== "pending") throw new ReviewError("already_reviewed");
      const stillPending = and(eq(sellerWalletTopUps.id, topUp.id), eq(sellerWalletTopUps.status, "pending"));

      if (decision === "reject") {
        await tx
          .update(sellerWalletTopUps)
          .set({ status: "failed", failureReason: reason, updatedAt: sql`now()` })
          .where(stillPending);
        await writeAdminAudit(tx, {
          actorId,
          sellerId: topUp.sellerId,
          action: "reject_top_up",
          before: { status: "pending", amount: topUp.amount, method: topUp.provider },
          after: { status: "failed", topUpId: topUp.id },
          reason,
        });
        return { status: "rejected" };
      }

      let entry;
      try {
        entry = await postStoreWalletEntry(tx, {
          sellerId: topUp.sellerId,
          type: "top_up",
          amount: topUp.amount,
          referenceType: STORE_WALLET_REFERENCE_TYPES.topUp,
          referenceId: topUp.id,
          description: topUp.provider === "instapay" ? "Wallet top-up (InstaPay)" : "Wallet top-up (Vodafone Cash)",
          metadata: { provider: topUp.provider, reviewedBy: actorId },
          createdBy: actorId,
        });
      } catch (error) {
        if (error instanceof DuplicateStoreWalletEntryError) throw new ReviewError("already_reviewed");
        if (error instanceof StoreWalletNotActiveError) throw new ReviewError("wallet_not_active");
        throw error;
      }
      await tx
        .update(sellerWalletTopUps)
        .set({ status: "succeeded", transactionId: entry.entryId, updatedAt: sql`now()` })
        .where(stillPending);
      // The referrer's 20 % (F-37), in this transaction.
      await postReferralCommission(tx, { id: topUp.id, sellerId: topUp.sellerId, amount: topUp.amount });
      await writeAdminAudit(tx, {
        actorId,
        sellerId: topUp.sellerId,
        action: "approve_top_up",
        before: { status: "pending", balance: entry.balanceBefore },
        after: { status: "succeeded", balance: entry.balanceAfter, amount: topUp.amount, entryId: entry.entryId, topUpId: topUp.id },
        reason,
      });
      return { status: "approved", balanceAfter: entry.balanceAfter };
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof ReviewError) return { success: false, error: error.code };
    throw error;
  }
}

export type AdminTopUpRow = {
  id: string;
  sellerId: string;
  sellerName: string | null;
  amount: string;
  method: string;
  status: string;
  proofPath: string | null;
  senderPhone: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Manual top-ups for the admin queue: pending (oldest first) or recently reviewed. */
export async function listManualTopUpsForAdmin(
  view: "pending" | "reviewed",
  limit = 100,
  q: Queryable = db,
): Promise<AdminTopUpRow[]> {
  const rows = await q
    .select({
      id: sellerWalletTopUps.id,
      sellerId: sellerWalletTopUps.sellerId,
      sellerName: sql<string | null>`coalesce(${sellers.displayName}, ${sellers.businessName})`,
      amount: sellerWalletTopUps.amount,
      method: sellerWalletTopUps.provider,
      status: sellerWalletTopUps.status,
      metadata: sellerWalletTopUps.metadata,
      failureReason: sellerWalletTopUps.failureReason,
      createdAt: sellerWalletTopUps.createdAt,
      updatedAt: sellerWalletTopUps.updatedAt,
    })
    .from(sellerWalletTopUps)
    .leftJoin(sellers, eq(sellers.id, sellerWalletTopUps.sellerId))
    .where(
      and(
        inArray(sellerWalletTopUps.provider, MANUAL),
        view === "pending"
          ? eq(sellerWalletTopUps.status, "pending")
          : inArray(sellerWalletTopUps.status, ["succeeded", "failed"]),
      ),
    )
    .orderBy(view === "pending" ? sellerWalletTopUps.createdAt : desc(sellerWalletTopUps.updatedAt))
    .limit(limit);
  return rows.map(({ metadata, ...row }) => {
    const meta = (metadata ?? {}) as { proofPath?: string; senderPhone?: string };
    return { ...row, proofPath: meta.proofPath ?? null, senderPhone: meta.senderPhone ?? null };
  });
}
