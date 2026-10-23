'use client'

import { useQuery } from '@tanstack/react-query'
import { getMyAffiliateAccount } from '@/actions/affiliate'
import { useAuthUser } from '@/lib/auth/use-auth-user'
import { AFFILIATE_PROGRAM_ENABLED } from '@/lib/constants'

/**
 * Resolves the signed-in viewer's own active affiliate coupon for product
 * share URLs. Never returns another user's code — the server action reads
 * the session, not a client-supplied id.
 */
export function useAffiliateShareCoupon (): {
  coupon: string | null
  isReady: boolean
} {
  const { user, isLoading: isAuthLoading } = useAuthUser()

  const { data, isLoading: isAffiliateLoading, isFetched } = useQuery({
    queryKey: ['affiliate-account', user?.id ?? 'anonymous'],
    queryFn: () => getMyAffiliateAccount(),
    enabled: AFFILIATE_PROGRAM_ENABLED && Boolean(user?.id),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })

  // Guests: ready as soon as auth settles (no coupon).
  // Signed-in: wait until the affiliate lookup finishes (or is cached).
  const isReady =
    !AFFILIATE_PROGRAM_ENABLED ||
    (!isAuthLoading && (!user?.id || isFetched || !isAffiliateLoading))

  const coupon =
    AFFILIATE_PROGRAM_ENABLED && data?.status === 'active' && data.code ? data.code : null

  return { coupon, isReady }
}
