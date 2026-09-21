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
