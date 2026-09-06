'use client'

import { useEffect, useRef } from 'react'
import { trackMetaEvent } from '@/lib/meta/meta.client'
import { toMetaContentIds } from '@/lib/meta/meta.product'
import { DEFAULT_CURRENCY } from '@/lib/constants'

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
  currency = DEFAULT_CURRENCY,
}: MetaViewContentProps) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || !productId) return
    firedRef.current = true

    trackMetaEvent('ViewContent', {
      content_ids: toMetaContentIds([productId]),
      content_type: 'product',
      value: Number.isFinite(value) ? value : 0,
      currency,
    })
  }, [productId, value, currency])

  return null
}
