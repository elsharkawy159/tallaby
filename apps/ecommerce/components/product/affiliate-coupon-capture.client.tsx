'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { persistPendingCouponAction } from '@/actions/affiliate-coupon'
import { normalizeCouponCode } from '@/lib/affiliate-coupon.lib'

/**
 * Captures `?coupon=` from the current URL into the pending-coupon cookie,
 * then strips the param from the address bar so the session cookie becomes
 * the source of truth (avoids re-capturing / duplicating on navigation).
 *
 * Safe to mount on ISR product pages — cookie writes go through a server
 * action; this component never reads cookies() during render.
 */
export function AffiliateCouponCapture () {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    const raw = searchParams.get('coupon')
    const code = normalizeCouponCode(raw)
    if (!code) return

    // Avoid repeat work for the same code in this mount cycle.
    if (handledRef.current === code) return
    handledRef.current = code

    let cancelled = false

    void (async () => {
      const result = await persistPendingCouponAction(code)
      if (cancelled || !result.success) return

      const next = new URLSearchParams(searchParams.toString())
      next.delete('coupon')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, pathname, router])

  return null
}
