import type { AuthenticatedUserDisplay } from '@/lib/auth/auth-user.types'

export const SELLER_DASHBOARD_URL = 'https://dashboard.tallaby.com/'
export const SELL_PAGE_PATH = '/sell'
export const ONBOARDING_PATH = '/onboarding'
export const AUTH_ONBOARDING_PATH = '/auth?redirect=/onboarding'

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
    return options?.fromSellPage ? AUTH_ONBOARDING_PATH : SELL_PAGE_PATH
  }

  if (isExistingSeller(user)) {
    return SELLER_DASHBOARD_URL
  }

  return options?.fromSellPage ? ONBOARDING_PATH : SELL_PAGE_PATH
}

export function getSellerCtaOpensInNewTab(
  user: AuthenticatedUserDisplay | null,
): boolean {
  return isExistingSeller(user)
}
