'use client'

import { useEffect, useRef } from 'react'
import { trackCommerceEvent } from '@/lib/storefront-events.client'
import { toMetaContentIds } from '@/lib/meta/meta.product'
import { useCurrencyCode } from '@/lib/currency-label.client'

interface MetaViewContentProps {
  productId: string
  value: number
  currency?: string
}

/**
 * Fires ViewContent once per product page mount (Strict Mode safe).
 */
export function MetaViewContent ({
  productId,
  value,
  currency: currencyProp,
}: MetaViewContentProps) {
  const storeCurrency = useCurrencyCode()
  const currency = currencyProp ?? storeCurrency
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || !productId) return
    firedRef.current = true

    trackCommerceEvent('ViewContent', {
      content_ids: toMetaContentIds([productId]),
      content_type: 'product',
      value: Number.isFinite(value) ? value : 0,
      currency,
    })
  }, [productId, value, currency])

  return null
}
