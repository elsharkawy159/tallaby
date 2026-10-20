import type { AuthenticatedUserDisplay } from '@/lib/auth/auth-user.types'

/** Seller dashboard origin with a trailing slash. Override per environment. */
export const SELLER_DASHBOARD_URL = withSlash(
  process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.tallaby.com/',
)
/** The new minimal seller signup (PLAN.md §6, P2-05). The /onboarding wizard stays reachable (D16). */
export const SELLER_SIGNUP_URL = `${SELLER_DASHBOARD_URL}signup`
export const SELL_PAGE_PATH = '/sell'
export const ONBOARDING_PATH = '/onboarding'

function withSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/**
 * Reads the resolved `isSeller` flag rather than `user_metadata.is_seller`.
 * Metadata is client-writable in principle and only records a *claim*; the
 * display model confirms it against an approved `sellers` row server-side.
 */
export function isExistingSeller(
  user: AuthenticatedUserDisplay | null,
): boolean {
  return user?.isSeller === true
}

export function getSellerCtaHref(
  user: AuthenticatedUserDisplay | null,
  options?: { fromSellPage?: boolean },
): string {
  if (!user) {
    return options?.fromSellPage ? SELLER_SIGNUP_URL : SELL_PAGE_PATH
  }

  if (isExistingSeller(user)) {
    return SELLER_DASHBOARD_URL
  }

  return options?.fromSellPage ? SELLER_SIGNUP_URL : SELL_PAGE_PATH
}

export function getSellerCtaOpensInNewTab(
  user: AuthenticatedUserDisplay | null,
): boolean {
  return isExistingSeller(user)
}
