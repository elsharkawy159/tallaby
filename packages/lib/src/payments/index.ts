import { isKashierConfigured } from '../kashier/kashier'

export type PaymentProvider = 'paymob' | 'kashier'

export const DEFAULT_PAYMENT_PROVIDER: PaymentProvider = 'kashier'

/**
 * The single switch that decides which gateway handles online payments.
 * Set PAYMENT_PROVIDER=paymob | kashier. Unset or unrecognised values fall
 * back to the default so a typo can never leave checkout without a gateway.
 */
export function getPaymentProvider(
  value: string | undefined = process.env.PAYMENT_PROVIDER
): PaymentProvider {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'paymob' || normalized === 'kashier') {
    return normalized
  }
  return DEFAULT_PAYMENT_PROVIDER
}

/**
 * Whether checkout should offer card payment (`online_payment`). Only the
 * active provider matters, and only when its credentials are present, so an
 * unconfigured gateway never appears as a payable option. Paymob card
 * checkout stays hidden in the storefront, as before.
 */
export function isOnlineCardPaymentEnabled(): boolean {
  return getPaymentProvider() === 'kashier' && isKashierConfigured()
}
