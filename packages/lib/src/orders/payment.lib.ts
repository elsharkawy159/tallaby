/** Maximum shipping cost (EGP) eligible for Cash on Delivery. */
export const COD_MAX_SHIPPING_COST = 90

export const MANUAL_PAYMENT_METHOD_VALUES = [
  'instapay',
  'vodafone_cash',
  'e_cash',
] as const

export type ManualPaymentMethodValue =
  (typeof MANUAL_PAYMENT_METHOD_VALUES)[number]

const WALLET_PARTIAL_PREFIX = 'wallet_'

/** Wallet must cover the full order total for a pure wallet checkout. */
export function isWalletEligibleForTotal (
  availableBalance: number | null | undefined,
  orderTotal: number,
): boolean {
  if (availableBalance == null) {
    return false
  }

  return availableBalance >= orderTotal
}

export function isManualPaymentMethodValue (
  value: string,
): value is ManualPaymentMethodValue {
  return (MANUAL_PAYMENT_METHOD_VALUES as readonly string[]).includes(value)
}

/** Form values like `wallet_instapay` for split wallet + online remainder. */
export function isWalletPartialPaymentMethod (value: string): boolean {
  return parseWalletPartialPaymentMethod(value) != null
}

export function parseWalletPartialPaymentMethod (
  value: string,
): ManualPaymentMethodValue | null {
  if (!value.startsWith(WALLET_PARTIAL_PREFIX)) {
    return null
  }

  const remainder = value.slice(WALLET_PARTIAL_PREFIX.length)
  return isManualPaymentMethodValue(remainder) ? remainder : null
}

export function toWalletPartialPaymentMethod (
  method: ManualPaymentMethodValue,
): `wallet_${ManualPaymentMethodValue}` {
  return `${WALLET_PARTIAL_PREFIX}${method}`
}

export function isWalletPaymentMethod (value: string): boolean {
  return value === 'wallet' || isWalletPartialPaymentMethod(value)
}

/**
 * Maps a form/order payment method string to the checkout radio group id.
 * Manual methods nest under `online_manual`; wallet partials nest under `wallet`.
 */
export function getPaymentGroupForMethod (value: string): string {
  if (isWalletPartialPaymentMethod(value) || value === 'wallet') {
    return 'wallet'
  }
  if (isManualPaymentMethodValue(value)) {
    return 'online_manual'
  }
  return value
}

/**
 * Amount of wallet balance to apply toward an order total.
 * Returns 0 when balance is missing or non-positive.
 */
export function computeWalletApplyAmount (
  availableBalance: number | null | undefined,
  orderTotal: number,
): number {
  if (availableBalance == null || availableBalance <= 0 || orderTotal <= 0) {
    return 0
  }

  return Math.min(availableBalance, orderTotal)
}

/** Reads `walletPaidAmount` from order metadata written at place-order time. */
export function getWalletPaidAmountFromMetadata (metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return 0
  }

  const value = (metadata as Record<string, unknown>).walletPaidAmount
  const amount =
    typeof value === 'string' || typeof value === 'number' ? Number(value) : 0

  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

/** Manual transfer amount after any wallet slice already applied. */
export function computeManualRemainderAmount (
  totalAmount: number | string,
  metadata: unknown,
): number {
  const total = Number(totalAmount)
  if (!Number.isFinite(total) || total <= 0) {
    return 0
  }

  return Math.max(0, total - getWalletPaidAmountFromMetadata(metadata))
}

export function isCodEligibleForShipping (
  shippingCost: number | null | undefined,
): boolean {
  // Unknown shipping (no address yet) should not disable COD
  if (shippingCost == null) {
    return true
  }

  return shippingCost <= COD_MAX_SHIPPING_COST
}
