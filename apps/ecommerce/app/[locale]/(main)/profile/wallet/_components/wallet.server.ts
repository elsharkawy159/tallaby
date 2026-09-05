"use server";

import { revalidatePath } from "next/cache";

import {
  and,
  db,
  desc,
  eq,
  userWalletTransactions,
  users,
  walletPayoutRequests,
  walletTopUps,
} from "@workspace/db";
import {
  getOrCreateUserWallet,
  getUserWalletSummary,
  hasOpenPayoutRequest,
  releasePayoutReservation,
  reservePayoutAmount,
  toWalletAmount,
} from "@workspace/db/wallet";

import { getAuthUser } from "@/lib/auth/current-user";
import { isManualPaymentMethod } from "@/lib/manual-payment-methods";

import {
  cancelPayoutRequestSchema,
  payoutFormSchema,
  reportManualTopUpSchema,
  topUpFormSchema,
  walletTransactionsPageSchema,
  type PayoutFormData,
  type TopUpFormData,
} from "./wallet.dto";
import {
  WALLET_TRANSACTIONS_PAGE_SIZE,
  WALLET_UNAUTHENTICATED_ERROR,
  canRequestPayout,
  type WalletTopUpMethod,
} from "./wallet.lib";
import type {
  WalletActionResult,
  WalletOverview,
  WalletPayoutRequestView,
  WalletTransactionView,
  WalletUserRole,
} from "./wallet.types";

/**
 * Server actions for the user wallet.
 *
 * Authorization rules that hold for every action in this file:
 *
 *   - The acting user comes from the session (`getAuthUser`). No action accepts
 *     a userId or walletId from the caller, so there is no parameter a client
 *     could tamper with to reach someone else's wallet.
 *   - Guests have no wallet at all: a guest has no Supabase session, so
 *     getAuthUser() returns null and every action refuses.
 *   - Payout eligibility is re-read from `users.role` on the server for every
 *     payout write. Hiding the button is presentation, not a control.
 *   - Nothing here credits a wallet. Manual transfer top-ups stay pending for
 *     staff review — a user cannot assert their own top-up succeeded. Paymob
 *     card top-ups remain disabled (WALLET_PAYMOB_TOP_UP_ENABLED); when
 *     restored they are credited only by the HMAC-verified webhook.
 *
 * Wallet data is per-user and therefore never cached — see
 * docs/caching-and-data-fetching.md §3. Mutations use revalidatePath only;
 * there is deliberately no cache tag for any of this.
 */

const UNAUTHENTICATED = WALLET_UNAUTHENTICATED_ERROR;

interface WalletActor {
  userId: string;
  role: WalletUserRole;
}

/** Resolves the signed-in user and their role, or null when not signed in. */
async function getWalletActor(): Promise<WalletActor | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
    columns: { id: true, role: true, isGuest: true },
  });

  // A guest row can never hold money, even if one somehow carried a session.
  if (!dbUser || dbUser.isGuest) return null;

  return {
    userId: dbUser.id,
    role: (dbUser.role ?? "customer") as WalletUserRole,
  };
}

function toTransactionView(row: {
  id: string;
  type: string;
  amount: string;
  direction: string | null;
  balanceAfter: string;
  status: string;
  description: string | null;
  createdAt: string;
}): WalletTransactionView {
  return {
    id: row.id,
    type: row.type as WalletTransactionView["type"],
    amount: row.amount,
    direction: (row.direction ??
      (Number(row.amount) < 0
        ? "debit"
        : "credit")) as WalletTransactionView["direction"],
    balanceAfter: row.balanceAfter,
    status: row.status as WalletTransactionView["status"],
    description: row.description,
    createdAt: row.createdAt,
  };
}

function toPayoutView(row: {
  id: string;
  amount: string;
  status: string;
  method: string;
  rejectionReason: string | null;
  externalReference: string | null;
  createdAt: string;
  processedAt: string | null;
}): WalletPayoutRequestView {
  return {
    id: row.id,
    amount: row.amount,
    status: row.status as WalletPayoutRequestView["status"],
    method: row.method,
    rejectionReason: row.rejectionReason,
    externalReference: row.externalReference,
    createdAt: row.createdAt,
    processedAt: row.processedAt,
  };
}

/** Everything the wallet page renders on first paint. */
export async function getWalletOverview(): Promise<
  WalletActionResult<WalletOverview>
> {
  try {
    const actor = await getWalletActor();
    if (!actor) return { success: false, error: UNAUTHENTICATED };

    // Creates the wallet if migration 0025's trigger never fired for this row.
    const wallet = await getOrCreateUserWallet(db, actor.userId);
    const availableBalance = (
      Math.round(Number(wallet.balance) * 100) -
      Math.round(Number(wallet.reservedBalance) * 100)
    );

    const [transactions, payoutRequests, openRequest] = await Promise.all([
      db
        .select({
          id: userWalletTransactions.id,
          type: userWalletTransactions.type,
          amount: userWalletTransactions.amount,
          direction: userWalletTransactions.direction,
          balanceAfter: userWalletTransactions.balanceAfter,
          status: userWalletTransactions.status,
          description: userWalletTransactions.description,
          createdAt: userWalletTransactions.createdAt,
        })
        .from(userWalletTransactions)
        .where(eq(userWalletTransactions.walletId, wallet.id))
        .orderBy(desc(userWalletTransactions.createdAt))
        .limit(WALLET_TRANSACTIONS_PAGE_SIZE),
      db
        .select({
          id: walletPayoutRequests.id,
          amount: walletPayoutRequests.amount,
          status: walletPayoutRequests.status,
          method: walletPayoutRequests.method,
          rejectionReason: walletPayoutRequests.rejectionReason,
          externalReference: walletPayoutRequests.externalReference,
          createdAt: walletPayoutRequests.createdAt,
          processedAt: walletPayoutRequests.processedAt,
        })
        .from(walletPayoutRequests)
        .where(eq(walletPayoutRequests.userId, actor.userId))
        .orderBy(desc(walletPayoutRequests.createdAt))
        .limit(WALLET_TRANSACTIONS_PAGE_SIZE),
      hasOpenPayoutRequest(db, actor.userId),
    ]);

    return {
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          reservedBalance: wallet.reservedBalance,
          availableBalance: (availableBalance / 100).toFixed(2),
          currency: wallet.currency,
          status: wallet.status,
        },
        role: actor.role,
        canRequestPayout: canRequestPayout(actor.role),
        hasOpenPayoutRequest: openRequest,
        transactions: transactions.map(toTransactionView),
        payoutRequests: payoutRequests.map(toPayoutView),
      },
    };
  } catch (error) {
    console.error("getWalletOverview error:", error);
    return { success: false, error: "Failed to load wallet" };
  }
}

/** One page of ledger history. Always scoped to the caller's own wallet. */
export async function getWalletTransactions(input: {
  limit?: number;
  offset?: number;
}): Promise<WalletActionResult<WalletTransactionView[]>> {
  try {
    const actor = await getWalletActor();
    if (!actor) return { success: false, error: UNAUTHENTICATED };

    const parsed = walletTransactionsPageSchema.safeParse({
      limit: input.limit ?? WALLET_TRANSACTIONS_PAGE_SIZE,
      offset: input.offset ?? 0,
    });
    if (!parsed.success) {
      return { success: false, error: "Invalid pagination" };
    }

    const rows = await db
      .select({
        id: userWalletTransactions.id,
        type: userWalletTransactions.type,
        amount: userWalletTransactions.amount,
        direction: userWalletTransactions.direction,
        balanceAfter: userWalletTransactions.balanceAfter,
        status: userWalletTransactions.status,
        description: userWalletTransactions.description,
        createdAt: userWalletTransactions.createdAt,
      })
      .from(userWalletTransactions)
      // Filtering by userId, not a caller-supplied walletId — the ownership
      // check and the query are the same statement.
      .where(eq(userWalletTransactions.userId, actor.userId))
      .orderBy(desc(userWalletTransactions.createdAt))
      .limit(parsed.data.limit)
      .offset(parsed.data.offset);

    return { success: true, data: rows.map(toTransactionView) };
  } catch (error) {
    console.error("getWalletTransactions error:", error);
    return { success: false, error: "Failed to load transactions" };
  }
}

export interface CreateWalletTopUpResult {
  topUpId: string;
  amount: string;
  paymentMethod: WalletTopUpMethod;
}

/**
 * Starts a top-up via a manual transfer method (InstaPay / Vodafone Cash /
 * E& Cash). Records a pending intent and returns the details needed to show
 * payment instructions.
 *
 * This does NOT move any money. The wallet is credited only after staff
 * confirm the transfer (or, when card top-ups are restored via
 * WALLET_PAYMOB_TOP_UP_ENABLED, via the HMAC-verified Paymob webhook).
 */
export async function createWalletTopUp(
  data: TopUpFormData
): Promise<WalletActionResult<CreateWalletTopUpResult>> {
  try {
    const actor = await getWalletActor();
    if (!actor) return { success: false, error: UNAUTHENTICATED };

    const parsed = topUpFormSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid amount",
      };
    }

    if (!isManualPaymentMethod(parsed.data.paymentMethod)) {
      return { success: false, error: "Invalid payment method" };
    }

    const wallet = await getOrCreateUserWallet(db, actor.userId);
    if (wallet.status !== "active") {
      return { success: false, error: "Your wallet is not active" };
    }

    const amount = toWalletAmount(parsed.data.amount);
    const paymentMethod = parsed.data.paymentMethod;

    const [topUp] = await db
      .insert(walletTopUps)
      .values({
        walletId: wallet.id,
        userId: actor.userId,
        amount,
        currency: "EGP",
        status: "pending",
        provider: paymentMethod,
        metadata: { paymentMethod, channel: "manual_transfer" },
      })
      .returning({ id: walletTopUps.id });

    if (!topUp) {
      return { success: false, error: "Failed to start top up" };
    }

    revalidatePath("/profile/wallet");

    return {
      success: true,
      data: {
        topUpId: topUp.id,
        amount,
        paymentMethod,
      },
    };
  } catch (error) {
    console.error("createWalletTopUp error:", error);
    return { success: false, error: "Failed to start top up" };
  }
}

/**
 * Buyer self-reports that they sent the manual transfer. Does not credit the
 * wallet — only stamps metadata so ops can verify, matching checkout orders.
 */
export async function reportManualTopUpSent(
  topUpId: string
): Promise<WalletActionResult<{ topUpId: string }>> {
  try {
    const actor = await getWalletActor();
    if (!actor) return { success: false, error: UNAUTHENTICATED };

    const parsed = reportManualTopUpSchema.safeParse({ topUpId });
    if (!parsed.success) {
      return { success: false, error: "Invalid top up" };
    }

    const topUp = await db.query.walletTopUps.findFirst({
      where: and(
        eq(walletTopUps.id, parsed.data.topUpId),
        eq(walletTopUps.userId, actor.userId)
      ),
      columns: { id: true, status: true, provider: true, metadata: true },
    });

    if (!topUp) {
      return { success: false, error: "Top up not found" };
    }

    if (!isManualPaymentMethod(topUp.provider)) {
      return { success: false, error: "Top up is not a manual transfer" };
    }

    if (topUp.status !== "pending" && topUp.status !== "processing") {
      return { success: false, error: "Top up can no longer be updated" };
    }

    const now = new Date().toISOString();
    await db
      .update(walletTopUps)
      .set({
        status: "processing",
        metadata: {
          ...((topUp.metadata as Record<string, unknown> | null) ?? {}),
          paymentSelfReported: true,
          paymentSelfReportedAt: now,
        },
        updatedAt: now,
      })
      .where(eq(walletTopUps.id, topUp.id));

    revalidatePath("/profile/wallet");

    return { success: true, data: { topUpId: topUp.id } };
  } catch (error) {
    console.error("reportManualTopUpSent error:", error);
    return { success: false, error: "Failed to update top up" };
  }
}

/**
 * Creates a payout request and RESERVES the amount.
 *
 * The reservation is what stops the same balance being spent twice while an
 * admin reviews the request. The balance itself is untouched until the payout
 * is completed (see the admin app), and released if it is rejected.
 */
export async function createPayoutRequest(
  data: PayoutFormData
): Promise<WalletActionResult<{ payoutRequestId: string }>> {
  try {
    const actor = await getWalletActor();
    if (!actor) return { success: false, error: UNAUTHENTICATED };

    // Server-side authorization. The client never sends the role, and the
    // hidden button is not the control.
    if (!canRequestPayout(actor.role)) {
      return {
        success: false,
        error: "Your account type cannot request payouts",
      };
    }

    const parsed = payoutFormSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid payout request",
      };
    }

    const wallet = await getOrCreateUserWallet(db, actor.userId);
    if (wallet.status !== "active") {
      return { success: false, error: "Your wallet is not active" };
    }

    const amount = toWalletAmount(parsed.data.amount);

    const payoutRequestId = await db.transaction(async (tx) => {
      // Reserve first: this fails atomically if available < amount, so the
      // request row is never created against money that isn't there.
      await reservePayoutAmount(tx, wallet.id, amount);

      const [request] = await tx
        .insert(walletPayoutRequests)
        .values({
          walletId: wallet.id,
          userId: actor.userId,
          amount,
          currency: "EGP",
          status: "pending",
          method: parsed.data.method,
          destination: {
            accountName: parsed.data.accountName,
            accountNumber: parsed.data.accountNumber,
            notes: parsed.data.notes ?? null,
          },
        })
        .returning({ id: walletPayoutRequests.id });

      if (!request) throw new Error("Payout request insert returned no row");
      return request.id;
    });

    revalidatePath("/profile/wallet");
    revalidatePath("/profile");

    return { success: true, data: { payoutRequestId } };
  } catch (error) {
    const name = (error as { name?: string })?.name;

    if (name === "InsufficientWalletBalanceError") {
      return { success: false, error: "Insufficient available balance" };
    }
    if (name === "WalletNotActiveError") {
      return { success: false, error: "Your wallet is not active" };
    }
    // The partial unique index on (user_id) WHERE status IN (open) is what
    // actually enforces one open request per user, including against a
    // double-submit that races past any read-based check.
    if ((error as { code?: string })?.code === "23505") {
      return {
        success: false,
        error: "You already have a payout request in progress",
      };
    }

    console.error("createPayoutRequest error:", error);
    return { success: false, error: "Failed to create payout request" };
  }
}

/**
 * Cancels the caller's own still-pending request and releases the reservation.
 * Once an admin has approved or started processing it, only the admin can
 * change it.
 */
export async function cancelPayoutRequest(
  payoutRequestId: string
): Promise<WalletActionResult<undefined>> {
  try {
    const actor = await getWalletActor();
    if (!actor) return { success: false, error: UNAUTHENTICATED };

    const parsed = cancelPayoutRequestSchema.safeParse({ payoutRequestId });
    if (!parsed.success) {
      return { success: false, error: "Invalid payout request" };
    }

    const released = await db.transaction(async (tx) => {
      // The WHERE clause is both the ownership check and the concurrency
      // guard: a second click finds no row and releases nothing.
      const [request] = await tx
        .update(walletPayoutRequests)
        .set({
          status: "cancelled",
          processedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(walletPayoutRequests.id, parsed.data.payoutRequestId),
            eq(walletPayoutRequests.userId, actor.userId),
            eq(walletPayoutRequests.status, "pending")
          )
        )
        .returning({
          id: walletPayoutRequests.id,
          walletId: walletPayoutRequests.walletId,
          amount: walletPayoutRequests.amount,
        });

      if (!request) return false;

      await releasePayoutReservation(tx, request.walletId, request.amount);
      return true;
    });

    if (!released) {
      return {
        success: false,
        error: "This payout request can no longer be cancelled",
      };
    }

    revalidatePath("/profile/wallet");
    revalidatePath("/profile");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("cancelPayoutRequest error:", error);
    return { success: false, error: "Failed to cancel payout request" };
  }
}

/** Compact figures for the wallet card on the /profile index. */
export async function getWalletSummaryCardData(): Promise<{
  availableBalance: string;
  currency: string;
} | null> {
  try {
    const actor = await getWalletActor();
    if (!actor) return null;

    const summary = await getUserWalletSummary(db, actor.userId);
    if (!summary) return null;

    return {
      availableBalance: summary.availableBalance,
      currency: summary.currency,
    };
  } catch (error) {
    console.error("getWalletSummaryCardData error:", error);
    return null;
  }
}
