import { and, db, eq, inArray, walletTopUps } from '@workspace/db'
import {
  DuplicateWalletTransactionError,
  WALLET_REFERENCE_TYPES,
  parseTopUpReference,
  postWalletTransaction,
} from '@workspace/db/wallet'
import type {
  PaymobTransactionObj,
  PaymobWebhookBody,
} from '@workspace/lib/paymob'

/**
 * Applies a verified Paymob transaction to a wallet top-up.
 *
 * This is the ONLY path that credits a user wallet. It is reached from
 * routes/paymob.ts strictly after verifyPaymobTransactionHmac() has passed, so
 * the outcome and amount here are the provider's, not a caller's. Nothing in
 * the storefront can mark a top-up successful.
 *
 * Idempotency has two independent claims, because webhook retries are normal:
 *
 *   1. The status-guarded UPDATE below (`WHERE status IN ('pending',
 *      'processing') RETURNING`). A second delivery updates zero rows.
 *   2. The unique (type, reference_type, reference_id) index on the ledger,
 *      which catches anything that races past (1) — including two deliveries
 *      landing in parallel. That surfaces as DuplicateWalletTransactionError
 *      and rolls the whole transaction back, so the balance never moves twice.
 */

export type WalletTopUpWebhookResult =
  | { outcome: 'credited'; topUpId: string }
  | { outcome: 'duplicate'; topUpId: string }
  | { outcome: 'failed'; topUpId: string }
  | { outcome: 'amount_mismatch'; topUpId: string }
  | { outcome: 'not_found' }

/** Internal signal that a concurrent delivery already claimed this top-up. */
class AlreadyProcessedError extends Error {
  constructor() {
    super('Wallet top-up already processed')
    this.name = 'AlreadyProcessedError'
  }
}

/** True when this webhook payload refers to a wallet top-up rather than an order. */
export function isWalletTopUpReference(
  reference: string | null | undefined
): boolean {
  return parseTopUpReference(reference) !== null
}

/**
 * Statuses a webhook may still transition. Anything already 'succeeded',
 * 'failed' or 'cancelled' is terminal — a late delivery for a superseded
 * attempt must never erase a real credit.
 */
const CLAIMABLE_STATUSES = ['pending', 'processing'] as const

export async function handleWalletTopUpWebhook(
  transaction: PaymobTransactionObj,
  body: PaymobWebhookBody
): Promise<WalletTopUpWebhookResult> {
  const topUpId = parseTopUpReference(transaction.merchant_order_id)
  if (!topUpId) return { outcome: 'not_found' }

  const topUp = await db.query.walletTopUps.findFirst({
    where: eq(walletTopUps.id, topUpId),
    columns: {
      id: true,
      walletId: true,
      userId: true,
      amount: true,
      status: true,
    },
  })

  if (!topUp) return { outcome: 'not_found' }

  const providerTransactionId = String(transaction.id)
  const now = new Date().toISOString()

  const markFailed = (failureReason: string) =>
    db
      .update(walletTopUps)
      .set({
        status: 'failed',
        providerTransactionId,
        failureReason,
        metadata: body,
        updatedAt: now,
      })
      .where(
        and(
          eq(walletTopUps.id, topUp.id),
          inArray(walletTopUps.status, [...CLAIMABLE_STATUSES])
        )
      )

  if (!transaction.success) {
    await markFailed(
      transaction.error_occured ? 'Payment failed' : 'Payment declined'
    )
    return { outcome: 'failed', topUpId: topUp.id }
  }

  // The amount is the provider's, but the entitlement is ours: credit exactly
  // what was requested and recorded, never what the payload happens to say. A
  // mismatch means the intention was tampered with or reused, so refuse rather
  // than crediting the smaller or larger figure.
  const paidAmount = (transaction.amount_cents / 100).toFixed(2)
  if (paidAmount !== Number(topUp.amount).toFixed(2)) {
    console.error('Paymob wallet top-up amount mismatch', {
      topUpId: topUp.id,
      expected: topUp.amount,
      paid: paidAmount,
    })
    await markFailed(
      `Amount mismatch: expected ${topUp.amount}, received ${paidAmount}`
    )
    return { outcome: 'amount_mismatch', topUpId: topUp.id }
  }

  try {
    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(walletTopUps)
        .set({
          status: 'succeeded',
          providerTransactionId,
          metadata: body,
          updatedAt: now,
        })
        .where(
          and(
            eq(walletTopUps.id, topUp.id),
            inArray(walletTopUps.status, [...CLAIMABLE_STATUSES])
          )
        )
        .returning({ id: walletTopUps.id })

      if (!claimed) throw new AlreadyProcessedError()

      const ledgerRow = await postWalletTransaction(tx, {
        walletId: topUp.walletId,
        userId: topUp.userId,
        type: 'top_up',
        amount: topUp.amount,
        direction: 'credit',
        referenceType: WALLET_REFERENCE_TYPES.topUp,
        referenceId: topUp.id,
        description: 'Wallet top up',
        metadata: { provider: 'paymob', providerTransactionId },
      })

      await tx
        .update(walletTopUps)
        .set({ transactionId: ledgerRow.id, updatedAt: now })
        .where(eq(walletTopUps.id, topUp.id))
    })

    return { outcome: 'credited', topUpId: topUp.id }
  } catch (error) {
    if (
      error instanceof AlreadyProcessedError ||
      error instanceof DuplicateWalletTransactionError
    ) {
      return { outcome: 'duplicate', topUpId: topUp.id }
    }
    throw error
  }
}
