import Stripe from 'stripe'

let stripeClient: Stripe | null = null

/**
 * Lazy Stripe client. Returns null when STRIPE_SECRET_KEY is unset
 * so cash-only flows work without Stripe configured.
 */
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  }

  return stripeClient
}
