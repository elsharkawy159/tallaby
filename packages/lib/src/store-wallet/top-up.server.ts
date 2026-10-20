import { and, db, eq, inArray, sellerWalletTopUps, sql } from "@workspace/db";
import { DuplicateStoreWalletEntryError, postStoreWalletEntry } from "@workspace/db/wallet";
import { createKashierSession, getKashierConfig } from "../kashier";
import { buildStoreTopUpReference, parseStoreTopUpAmount } from "./top-up.lib";

/**
 * Store-wallet top-ups through Kashier (PLAN.md §13.4, P6-09/P6-10).
 * Server-only. The client can never mark a top-up paid: only the signed
 * Kashier webhook (applyStoreTopUpWebhook) credits the wallet.
 */

export type StartTopUpError = "invalid" | "too_small" | "too_large" | "not_configured" | "provider_error";

export type StartTopUpResult =
  | { success: true; topUpId: string; sessionUrl: string }
  | { success: false; error: StartTopUpError };

/**
 * Creates a pending top-up row and its Kashier session. `returnUrl` gets
 * `?topUp=<id>` appended; it only shows the stored status.
 */
export async function startStoreTopUp(input: {
  sellerId: string;
  actorId: string;
  amount: unknown;
  email?: string | null;
  returnUrl: string;
  locale?: "ar" | "en";
}): Promise<StartTopUpResult> {
  const amount = parseStoreTopUpAmount(input.amount);
  if (!amount.success) return amount;
  const config = getKashierConfig();
  if (!config) return { success: false, error: "not_configured" };

  const [row] = await db
    .insert(sellerWalletTopUps)
    .values({
      sellerId: input.sellerId,
      amount: amount.amount,
      provider: "kashier",
      status: "pending",
      createdBy: input.actorId,
    })
    .returning({ id: sellerWalletTopUps.id });
  const topUpId = row!.id;
  const reference = buildStoreTopUpReference(topUpId);

  try {
    const url = new URL(input.returnUrl);
    url.searchParams.set("topUp", topUpId);
    const session = await createKashierSession(config, {
      orderReference: reference,
      amount: amount.amount,
      currency: "EGP",
      customerEmail: input.email ?? null,
      customerReference: input.sellerId,
      merchantRedirect: url.toString(),
      display: input.locale ?? "ar",
      description: "Tallaby store wallet top-up",
      metaData: { kind: "store_wallet_top_up", topUpId },
    });
    await db
      .update(sellerWalletTopUps)
      .set({ providerReference: reference, metadata: { sessionId: session.sessionId }, updatedAt: sql`now()` })
      .where(eq(sellerWalletTopUps.id, topUpId));
    return { success: true, topUpId, sessionUrl: session.sessionUrl };
  } catch (error) {
    console.error("[store-top-up] Kashier session failed", (error as Error)?.message);
    await db
      .update(sellerWalletTopUps)
      .set({ status: "failed", failureReason: "session_failed", updatedAt: sql`now()` })
      .where(eq(sellerWalletTopUps.id, topUpId));
    return { success: false, error: "provider_error" };
  }
}

export type TopUpWebhookOutcome = "credited" | "failed" | "processing" | "duplicate" | "ignored";

/**
 * Applies one signed Kashier `pay` event to a top-up (P6-10). Idempotent: the
 * row is locked and only moves out of pending/processing once; the wallet
 * entry is claimed by `top_up:<id>`. A paid amount different from the
 * requested one fails the top-up and credits nothing.
 */
export async function applyStoreTopUpWebhook(input: {
  topUpId: string;
  status: "SUCCESS" | "FAILURE" | "PENDING" | string;
  amount: string | number;
  currency: string | null | undefined;
  transactionId: string;
}): Promise<TopUpWebhookOutcome> {
  return db.transaction(async (tx) => {
    const [topUp] = await tx
      .select()
      .from(sellerWalletTopUps)
      .where(eq(sellerWalletTopUps.id, input.topUpId))
      .for("update");
    if (!topUp) return "ignored";
    if (topUp.status !== "pending" && topUp.status !== "processing") return "duplicate";

    const pending = and(
      eq(sellerWalletTopUps.id, topUp.id),
      inArray(sellerWalletTopUps.status, ["pending", "processing"]),
    );
    const transactionId = String(input.transactionId);

    if (input.status === "PENDING") {
      await tx
        .update(sellerWalletTopUps)
        .set({ status: "processing", providerTransactionId: transactionId, updatedAt: sql`now()` })
        .where(pending);
      return "processing";
    }

    if (input.status !== "SUCCESS") {
      await tx
        .update(sellerWalletTopUps)
        .set({ status: "failed", providerTransactionId: transactionId, failureReason: "payment_failed", updatedAt: sql`now()` })
        .where(pending);
      return "failed";
    }

    const paid = Number(input.amount);
    const paidPiastres = Number.isFinite(paid) ? Math.round(paid * 100) : NaN;
    if (paidPiastres !== Math.round(Number(topUp.amount) * 100) || (input.currency ?? "EGP") !== "EGP") {
      console.error("[store-top-up] amount/currency mismatch", { topUpId: topUp.id, expected: topUp.amount, paid: input.amount });
      await tx
        .update(sellerWalletTopUps)
        .set({
          status: "failed",
          providerTransactionId: transactionId,
          failureReason: `amount_mismatch: expected ${topUp.amount} EGP, received ${input.amount} ${input.currency ?? ""}`.trim(),
          updatedAt: sql`now()`,
        })
        .where(pending);
      return "failed";
    }

    try {
      const entry = await postStoreWalletEntry(tx, {
        sellerId: topUp.sellerId,
        type: "top_up",
        amount: topUp.amount,
        referenceType: "top_up",
        referenceId: topUp.id,
        description: "Wallet top-up (Kashier)",
        metadata: { provider: "kashier", transactionId },
        createdBy: topUp.createdBy,
      });
      await tx
        .update(sellerWalletTopUps)
        .set({ status: "succeeded", providerTransactionId: transactionId, transactionId: entry.entryId, updatedAt: sql`now()` })
        .where(pending);
      return "credited";
    } catch (error) {
      if (error instanceof DuplicateStoreWalletEntryError) return "duplicate";
      throw error;
    }
  });
}

/** One top-up of this seller, for the return page. Never another seller's. */
export async function getStoreTopUp(sellerId: string, topUpId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(topUpId)) return null;
  const [row] = await db
    .select({
      id: sellerWalletTopUps.id,
      amount: sellerWalletTopUps.amount,
      status: sellerWalletTopUps.status,
      createdAt: sellerWalletTopUps.createdAt,
    })
    .from(sellerWalletTopUps)
    .where(and(eq(sellerWalletTopUps.id, topUpId), eq(sellerWalletTopUps.sellerId, sellerId)));
  return row ?? null;
}
