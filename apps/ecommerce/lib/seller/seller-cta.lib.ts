import type { User } from '@supabase/supabase-js'

export const SELLER_DASHBOARD_URL = 'https://dashboard.tallaby.com/'
export const SELL_PAGE_PATH = '/sell'
export const ONBOARDING_PATH = '/onboarding'
export const AUTH_ONBOARDING_PATH = '/auth?redirect=/onboarding'

export function isExistingSeller(user: User | null): boolean {
  return user?.user_metadata?.is_seller === true
}

export function getSellerCtaHref(
  user: User | null,
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

export function getSellerCtaOpensInNewTab(user: User | null): boolean {
  return isExistingSeller(user)
}
