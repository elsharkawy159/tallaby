import { WALLET_PARTIAL_PREFIX } from './payment.lib'

/**
 * Test orders (0155, ROADMAP.md F-76): what a seller's test checkout may use.
 * Nothing that moves Tallaby ledger money: no customer-wallet payment, whole or
 * part. Cash on delivery, transfers and the seller's own card gateway are fine
 * (the money, if any, is the seller's own).
 */
export function isTestOrderPaymentAllowed(paymentMethod: string): boolean {
  return paymentMethod !== 'wallet' && !paymentMethod.startsWith(WALLET_PARTIAL_PREFIX)
}
