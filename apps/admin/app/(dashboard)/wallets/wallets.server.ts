"use server";

import { revalidatePath } from "next/cache";
import {
  and,
  db,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  userWallets,
  userWalletTransactions,
  users,
  walletPayoutRequests,
  walletTopUps,
} from "@workspace/db";
import {
  DuplicateWalletTransactionError,
  postWalletTransaction,
  releasePayoutReservation,
  settlePayout,
  WALLET_REFERENCE_TYPES,
} from "@workspace/db/wallet";

import { getCurrentAdminUser } from "@/lib/auth/admin-auth";

import {
  approvePayoutSchema,
  completePayoutSchema,
  confirmTopUpSchema,
  payoutIdSchema,
  payoutRequestFiltersSchema,
  rejectPayoutSchema,
  rejectTopUpSchema,
  topUpRequestFiltersSchema,
  walletFiltersSchema,
  walletIdSchema,
} from "./wallets.dto";
import type {
  AdminWalletResult,
  PayoutRequestFilters,
  PayoutRequestRow,
  TopUpRequestFilters,
  TopUpRequestRow,
  WalletFilters,
  WalletRow,
  WalletStats,
  WalletTransactionRow,
} from "./wallets.types";

/**
 * Admin wallet administration.
 *
 * Every export starts with `await getCurrentAdminUser()`, which throws unless
 * the caller is a verified admin — server actions are directly POST-able, so
 * this is the control, not the sidebar.
 *
 * Balance movements go exclusively through the primitives in
 * @workspace/db/wallet; nothing here writes `user_wallets.balance` directly.
 * Each status transition is an `UPDATE ... WHERE status IN (...) RETURNING`, so
 * a double-click or two admins acting at once cannot apply a transition twice.
 */

const ROW_LIMIT = 100;
const OPEN_TOP_UP_STATUSES = ["pending", "processing"] as const;

function failure(error: string): AdminWalletResult<never> {
  return { success: false, error };
}

/** Distinguishes an authorization failure from a genuine bug in the handler. */
function handleError(scope: string, error: unknown): AdminWalletResult<never> {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message === "User not authenticated" ||
    message === "Insufficient permissions" ||
    message === "Account not verified" ||
    message === "User profile not found"
  ) {
    return failure("Unauthorized");
  }

  console.error(`${scope} error:`, error);
  return failure(`Failed to ${scope}`);
}

function readTopUpSelfReport(metadata: unknown): {
  paymentSelfReported: boolean;
  paymentSelfReportedAt: string | null;
} {
  if (!metadata || typeof metadata !== "object") {
    return { paymentSelfReported: false, paymentSelfReportedAt: null };
  }

  const record = metadata as Record<string, unknown>;
  return {
    paymentSelfReported: record.paymentSelfReported === true,
    paymentSelfReportedAt:
      typeof record.paymentSelfReportedAt === "string"
        ? record.paymentSelfReportedAt
        : null,
  };
}

export async function getWalletStats(): Promise<AdminWalletResult<WalletStats>> {
  try {
    await getCurrentAdminUser();

    const [totals] = await db
      .select({
        totalWallets: sql<string>`count(*)::text`,
        totalBalance: sql<string>`coalesce(sum(${userWallets.balance}), 0)::text`,
        totalReserved: sql<string>`coalesce(sum(${userWallets.reservedBalance}), 0)::text`,
      })
      .from(userWallets);

    const [pending] = await db
      .select({
        count: sql<string>`count(*)::text`,
        amount: sql<string>`coalesce(sum(${walletPayoutRequests.amount}), 0)::text`,
      })
      .from(walletPayoutRequests)
      .where(
        inArray(walletPayoutRequests.status, [
          "pending",
          "approved",
          "processing",
        ])
      );

    const [pendingTopUps] = await db
      .select({
        count: sql<string>`count(*)::text`,
        amount: sql<string>`coalesce(sum(${walletTopUps.amount}), 0)::text`,
      })
      .from(walletTopUps)
      .where(inArray(walletTopUps.status, [...OPEN_TOP_UP_STATUSES]));

    return {
      success: true,
      data: {
        totalWallets: Number(totals?.totalWallets ?? 0),
        totalBalance: totals?.totalBalance ?? "0",
        totalReserved: totals?.totalReserved ?? "0",
        pendingPayouts: Number(pending?.count ?? 0),
        pendingPayoutAmount: pending?.amount ?? "0",
        pendingTopUps: Number(pendingTopUps?.count ?? 0),
        pendingTopUpAmount: pendingTopUps?.amount ?? "0",
      },
    };
  } catch (error) {
    return handleError("load wallet stats", error);
  }
}

export async function getPayoutRequests(
  filters: PayoutRequestFilters = {}
): Promise<AdminWalletResult<PayoutRequestRow[]>> {
  try {
    await getCurrentAdminUser();

    const parsed = payoutRequestFiltersSchema.safeParse(filters);
    if (!parsed.success) return failure("Invalid filters");

    const conditions = [];
    if (parsed.data.status) {
      conditions.push(eq(walletPayoutRequests.status, parsed.data.status));
    }
    if (parsed.data.search) {
      const term = `%${parsed.data.search}%`;
      conditions.push(or(ilike(users.fullName, term), ilike(users.email, term)));
    }

    const rows = await db
      .select({
        id: walletPayoutRequests.id,
        walletId: walletPayoutRequests.walletId,
        userId: walletPayoutRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        userRole: users.role,
        amount: walletPayoutRequests.amount,
        currency: walletPayoutRequests.currency,
        status: walletPayoutRequests.status,
        method: walletPayoutRequests.method,
        destination: walletPayoutRequests.destination,
        adminNotes: walletPayoutRequests.adminNotes,
        rejectionReason: walletPayoutRequests.rejectionReason,
        externalReference: walletPayoutRequests.externalReference,
        reviewedBy: walletPayoutRequests.reviewedBy,
        reviewedAt: walletPayoutRequests.reviewedAt,
        processedAt: walletPayoutRequests.processedAt,
        createdAt: walletPayoutRequests.createdAt,
        walletBalance: userWallets.balance,
        walletReservedBalance: userWallets.reservedBalance,
      })
      .from(walletPayoutRequests)
      .innerJoin(users, eq(users.id, walletPayoutRequests.userId))
      .innerJoin(userWallets, eq(userWallets.id, walletPayoutRequests.walletId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(walletPayoutRequests.createdAt))
      .limit(ROW_LIMIT);

    return { success: true, data: rows as PayoutRequestRow[] };
  } catch (error) {
    return handleError("load payout requests", error);
  }
}

export async function getTopUpRequests(
  filters: TopUpRequestFilters = {}
): Promise<AdminWalletResult<TopUpRequestRow[]>> {
  try {
    await getCurrentAdminUser();

    const parsed = topUpRequestFiltersSchema.safeParse(filters);
    if (!parsed.success) return failure("Invalid filters");

    const conditions = [];
    if (parsed.data.status) {
      conditions.push(eq(walletTopUps.status, parsed.data.status));
    }
    if (parsed.data.search) {
      const term = `%${parsed.data.search}%`;
      conditions.push(or(ilike(users.fullName, term), ilike(users.email, term)));
    }

    const rows = await db
      .select({
        id: walletTopUps.id,
        walletId: walletTopUps.walletId,
        userId: walletTopUps.userId,
        userName: users.fullName,
        userEmail: users.email,
        userRole: users.role,
        amount: walletTopUps.amount,
        currency: walletTopUps.currency,
        status: walletTopUps.status,
        provider: walletTopUps.provider,
        providerReference: walletTopUps.providerReference,
        failureReason: walletTopUps.failureReason,
        metadata: walletTopUps.metadata,
        createdAt: walletTopUps.createdAt,
        walletBalance: userWallets.balance,
        walletReservedBalance: userWallets.reservedBalance,
      })
      .from(walletTopUps)
      .innerJoin(users, eq(users.id, walletTopUps.userId))
      .innerJoin(userWallets, eq(userWallets.id, walletTopUps.walletId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(walletTopUps.createdAt))
      .limit(ROW_LIMIT);

    const mapped: TopUpRequestRow[] = rows.map((row) => {
      const selfReport = readTopUpSelfReport(row.metadata);
      return {
        id: row.id,
        walletId: row.walletId,
        userId: row.userId,
        userName: row.userName,
        userEmail: row.userEmail,
        userRole: row.userRole,
        amount: row.amount,
        currency: row.currency,
        status: row.status as TopUpRequestRow["status"],
        provider: row.provider,
        providerReference: row.providerReference,
        failureReason: row.failureReason,
        paymentSelfReported: selfReport.paymentSelfReported,
        paymentSelfReportedAt: selfReport.paymentSelfReportedAt,
        createdAt: row.createdAt,
        walletBalance: row.walletBalance,
        walletReservedBalance: row.walletReservedBalance,
      };
    });

    return { success: true, data: mapped };
  } catch (error) {
    return handleError("load top-up requests", error);
  }
}

export async function getWallets(
  filters: WalletFilters = {}
): Promise<AdminWalletResult<WalletRow[]>> {
  try {
    await getCurrentAdminUser();

    const parsed = walletFiltersSchema.safeParse(filters);
    if (!parsed.success) return failure("Invalid filters");

    const conditions = [];
    if (parsed.data.status) {
      conditions.push(eq(userWallets.status, parsed.data.status));
    }
    if (parsed.data.search) {
      const term = `%${parsed.data.search}%`;
      conditions.push(or(ilike(users.fullName, term), ilike(users.email, term)));
    }

    const rows = await db
      .select({
        id: userWallets.id,
        userId: userWallets.userId,
        userName: users.fullName,
        userEmail: users.email,
        userRole: users.role,
        balance: userWallets.balance,
        reservedBalance: userWallets.reservedBalance,
        availableBalance: sql<string>`(${userWallets.balance} - ${userWallets.reservedBalance})::text`,
        currency: userWallets.currency,
        status: userWallets.status,
        createdAt: userWallets.createdAt,
        updatedAt: userWallets.updatedAt,
      })
      .from(userWallets)
      .innerJoin(users, eq(users.id, userWallets.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(userWallets.balance))
      .limit(ROW_LIMIT);

    return { success: true, data: rows as WalletRow[] };
  } catch (error) {
    return handleError("load wallets", error);
  }
}

export async function getWalletTransactions(
  walletId: string
): Promise<AdminWalletResult<WalletTransactionRow[]>> {
  try {
    await getCurrentAdminUser();

    const parsed = walletIdSchema.safeParse({ walletId });
    if (!parsed.success) return failure("Invalid wallet");

    const rows = await db
      .select({
        id: userWalletTransactions.id,
        walletId: userWalletTransactions.walletId,
        userId: userWalletTransactions.userId,
        userName: users.fullName,
        type: userWalletTransactions.type,
        amount: userWalletTransactions.amount,
        direction: userWalletTransactions.direction,
        balanceBefore: userWalletTransactions.balanceBefore,
        balanceAfter: userWalletTransactions.balanceAfter,
        status: userWalletTransactions.status,
        referenceType: userWalletTransactions.referenceType,
        referenceId: userWalletTransactions.referenceId,
        description: userWalletTransactions.description,
        createdAt: userWalletTransactions.createdAt,
      })
      .from(userWalletTransactions)
      .innerJoin(users, eq(users.id, userWalletTransactions.userId))
      .where(eq(userWalletTransactions.walletId, parsed.data.walletId))
      .orderBy(desc(userWalletTransactions.createdAt))
      .limit(ROW_LIMIT);

    return { success: true, data: rows as WalletTransactionRow[] };
  } catch (error) {
    return handleError("load wallet transactions", error);
  }
}

interface TransitionRequest {
  id: string;
  walletId: string;
  userId: string;
  amount: string;
}

type TransitionLoad =
  | { ok: false; error: string }
  | { ok: true; request: TransitionRequest };

/**
 * Loads a request for a transition and refuses if the acting admin owns it.
 * Approving your own payout is the one separation-of-duties rule this phase
 * enforces outright.
 */
async function loadRequestForTransition(
  payoutRequestId: string,
  adminId: string
): Promise<TransitionLoad> {
  const request = await db.query.walletPayoutRequests.findFirst({
    where: eq(walletPayoutRequests.id, payoutRequestId),
    columns: {
      id: true,
      walletId: true,
      userId: true,
      amount: true,
    },
  });

  if (!request) return { ok: false, error: "Payout request not found" };
  if (request.userId === adminId) {
    return { ok: false, error: "You cannot action your own payout request" };
  }

  return { ok: true, request };
}

export async function approvePayoutRequest(input: {
  payoutRequestId: string;
  adminNotes?: string;
}): Promise<AdminWalletResult<undefined>> {
  try {
    const admin = await getCurrentAdminUser();

    const parsed = approvePayoutSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request");

    const loaded = await loadRequestForTransition(
      parsed.data.payoutRequestId,
      admin.id
    );
    if (!loaded.ok) return failure(loaded.error);

    const now = new Date().toISOString();
    const [updated] = await db
      .update(walletPayoutRequests)
      .set({
        status: "approved",
        adminNotes: parsed.data.adminNotes ?? null,
        reviewedBy: admin.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(walletPayoutRequests.id, parsed.data.payoutRequestId),
          eq(walletPayoutRequests.status, "pending")
        )
      )
      .returning({ id: walletPayoutRequests.id });

    if (!updated) return failure("Only a pending request can be approved");

    revalidatePath("/wallets");
    return { success: true, data: undefined };
  } catch (error) {
    return handleError("approve payout request", error);
  }
}

export async function markPayoutProcessing(input: {
  payoutRequestId: string;
}): Promise<AdminWalletResult<undefined>> {
  try {
    const admin = await getCurrentAdminUser();

    const parsed = payoutIdSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request");

    const loaded = await loadRequestForTransition(
      parsed.data.payoutRequestId,
      admin.id
    );
    if (!loaded.ok) return failure(loaded.error);

    const [updated] = await db
      .update(walletPayoutRequests)
      .set({ status: "processing", updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(walletPayoutRequests.id, parsed.data.payoutRequestId),
          eq(walletPayoutRequests.status, "approved")
        )
      )
      .returning({ id: walletPayoutRequests.id });

    if (!updated) return failure("Only an approved request can be processed");

    revalidatePath("/wallets");
    return { success: true, data: undefined };
  } catch (error) {
    return handleError("update payout request", error);
  }
}

/**
 * Rejects a request and releases its reservation. The balance is untouched —
 * a rejected payout never moved money, it only held it.
 */
export async function rejectPayoutRequest(input: {
  payoutRequestId: string;
  rejectionReason: string;
}): Promise<AdminWalletResult<undefined>> {
  try {
    const admin = await getCurrentAdminUser();

    const parsed = rejectPayoutSchema.safeParse(input);
    if (!parsed.success) {
      return failure(
        parsed.error.issues[0]?.message ?? "A rejection reason is required"
      );
    }

    const loaded = await loadRequestForTransition(
      parsed.data.payoutRequestId,
      admin.id
    );
    if (!loaded.ok) return failure(loaded.error);

    const now = new Date().toISOString();
    const rejected = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(walletPayoutRequests)
        .set({
          status: "rejected",
          rejectionReason: parsed.data.rejectionReason,
          reviewedBy: admin.id,
          reviewedAt: now,
          processedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(walletPayoutRequests.id, parsed.data.payoutRequestId),
            inArray(walletPayoutRequests.status, [
              "pending",
              "approved",
              "processing",
            ])
          )
        )
        .returning({
          id: walletPayoutRequests.id,
          walletId: walletPayoutRequests.walletId,
          amount: walletPayoutRequests.amount,
        });

      if (!updated) return false;

      await releasePayoutReservation(tx, updated.walletId, updated.amount);
      return true;
    });

    if (!rejected) return failure("This request can no longer be rejected");

    revalidatePath("/wallets");
    return { success: true, data: undefined };
  } catch (error) {
    return handleError("reject payout request", error);
  }
}

/**
 * Marks a payout paid: debits the balance, releases the reservation and writes
 * the negative ledger row, all in one transaction.
 *
 * The money leaves Tallaby through a bank or InstaPay transfer performed
 * outside this system; `externalReference` is the record of that transfer.
 * Completing here without having actually sent it would leave the ledger
 * claiming a payment that never happened, which is why the reference is
 * required rather than optional.
 */
export async function completePayoutRequest(input: {
  payoutRequestId: string;
  externalReference: string;
  adminNotes?: string;
}): Promise<AdminWalletResult<undefined>> {
  try {
    const admin = await getCurrentAdminUser();

    const parsed = completePayoutSchema.safeParse(input);
    if (!parsed.success) {
      return failure(
        parsed.error.issues[0]?.message ?? "An external reference is required"
      );
    }

    const loaded = await loadRequestForTransition(
      parsed.data.payoutRequestId,
      admin.id
    );
    if (!loaded.ok) return failure(loaded.error);

    const now = new Date().toISOString();
    const completed = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(walletPayoutRequests)
        .set({
          status: "completed",
          externalReference: parsed.data.externalReference,
          adminNotes: parsed.data.adminNotes ?? null,
          reviewedBy: admin.id,
          reviewedAt: now,
          processedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(walletPayoutRequests.id, parsed.data.payoutRequestId),
            inArray(walletPayoutRequests.status, ["approved", "processing"])
          )
        )
        .returning({
          id: walletPayoutRequests.id,
          walletId: walletPayoutRequests.walletId,
          userId: walletPayoutRequests.userId,
          amount: walletPayoutRequests.amount,
        });

      if (!updated) return false;

      const ledgerRow = await settlePayout(tx, {
        walletId: updated.walletId,
        userId: updated.userId,
        amount: updated.amount,
        payoutRequestId: updated.id,
        description: "Wallet payout",
        metadata: {
          externalReference: parsed.data.externalReference,
          completedBy: admin.id,
        },
      });

      await tx
        .update(walletPayoutRequests)
        .set({ transactionId: ledgerRow.id, updatedAt: now })
        .where(eq(walletPayoutRequests.id, updated.id));

      return true;
    });

    if (!completed) {
      return failure("Only an approved or processing request can be completed");
    }

    revalidatePath("/wallets");
    return { success: true, data: undefined };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "DuplicateWalletTransactionError") {
      return failure("This payout has already been settled");
    }
    if (name === "InsufficientWalletBalanceError") {
      return failure("The wallet no longer holds enough to settle this payout");
    }
    return handleError("complete payout request", error);
  }
}

/**
 * Credits a manual top-up after staff verify the transfer landed.
 *
 * Same claim pattern as the Paymob webhook: status-guarded UPDATE then
 * postWalletTransaction. Only open (pending/processing) rows can be credited.
 */
export async function confirmTopUpRequest(input: {
  topUpId: string;
  externalReference?: string;
}): Promise<AdminWalletResult<undefined>> {
  try {
    const admin = await getCurrentAdminUser();

    const parsed = confirmTopUpSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request");

    const topUp = await db.query.walletTopUps.findFirst({
      where: eq(walletTopUps.id, parsed.data.topUpId),
      columns: {
        id: true,
        walletId: true,
        userId: true,
        amount: true,
        status: true,
        provider: true,
        metadata: true,
      },
    });

    if (!topUp) return failure("Top-up request not found");
    if (topUp.userId === admin.id) {
      return failure("You cannot confirm your own top-up request");
    }
    if (!OPEN_TOP_UP_STATUSES.includes(topUp.status as (typeof OPEN_TOP_UP_STATUSES)[number])) {
      return failure("Only a pending or processing top-up can be confirmed");
    }

    const now = new Date().toISOString();
    const existingMeta =
      topUp.metadata && typeof topUp.metadata === "object"
        ? (topUp.metadata as Record<string, unknown>)
        : {};

    try {
      const credited = await db.transaction(async (tx) => {
        const [claimed] = await tx
          .update(walletTopUps)
          .set({
            status: "succeeded",
            metadata: {
              ...existingMeta,
              confirmedBy: admin.id,
              confirmedAt: now,
              externalReference: parsed.data.externalReference || null,
              channel: existingMeta.channel ?? "manual_transfer",
            },
            updatedAt: now,
          })
          .where(
            and(
              eq(walletTopUps.id, topUp.id),
              inArray(walletTopUps.status, [...OPEN_TOP_UP_STATUSES])
            )
          )
          .returning({ id: walletTopUps.id });

        if (!claimed) return false;

        const ledgerRow = await postWalletTransaction(tx, {
          walletId: topUp.walletId,
          userId: topUp.userId,
          type: "top_up",
          amount: topUp.amount,
          direction: "credit",
          referenceType: WALLET_REFERENCE_TYPES.topUp,
          referenceId: topUp.id,
          description: "Wallet top up",
          metadata: {
            provider: topUp.provider,
            confirmedBy: admin.id,
            externalReference: parsed.data.externalReference || null,
          },
        });

        await tx
          .update(walletTopUps)
          .set({ transactionId: ledgerRow.id, updatedAt: now })
          .where(eq(walletTopUps.id, topUp.id));

        return true;
      });

      if (!credited) {
        return failure("This top-up can no longer be confirmed");
      }
    } catch (error) {
      if (error instanceof DuplicateWalletTransactionError) {
        return failure("This top-up has already been credited");
      }
      throw error;
    }

    revalidatePath("/wallets");
    return { success: true, data: undefined };
  } catch (error) {
    return handleError("confirm top-up request", error);
  }
}

/**
 * Rejects a manual top-up that was not verified. No ledger write — balance
 * was never credited.
 */
export async function rejectTopUpRequest(input: {
  topUpId: string;
  reason: string;
}): Promise<AdminWalletResult<undefined>> {
  try {
    const admin = await getCurrentAdminUser();

    const parsed = rejectTopUpSchema.safeParse(input);
    if (!parsed.success) {
      return failure(
        parsed.error.issues[0]?.message ?? "A rejection reason is required"
      );
    }

    const topUp = await db.query.walletTopUps.findFirst({
      where: eq(walletTopUps.id, parsed.data.topUpId),
      columns: {
        id: true,
        userId: true,
        status: true,
        metadata: true,
      },
    });

    if (!topUp) return failure("Top-up request not found");
    if (topUp.userId === admin.id) {
      return failure("You cannot reject your own top-up request");
    }

    const now = new Date().toISOString();
    const existingMeta =
      topUp.metadata && typeof topUp.metadata === "object"
        ? (topUp.metadata as Record<string, unknown>)
        : {};

    const [updated] = await db
      .update(walletTopUps)
      .set({
        status: "failed",
        failureReason: parsed.data.reason,
        metadata: {
          ...existingMeta,
          rejectedBy: admin.id,
          rejectedAt: now,
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(walletTopUps.id, parsed.data.topUpId),
          inArray(walletTopUps.status, [...OPEN_TOP_UP_STATUSES])
        )
      )
      .returning({ id: walletTopUps.id });

    if (!updated) {
      return failure("Only a pending or processing top-up can be rejected");
    }

    revalidatePath("/wallets");
    return { success: true, data: undefined };
  } catch (error) {
    return handleError("reject top-up request", error);
  }
}
