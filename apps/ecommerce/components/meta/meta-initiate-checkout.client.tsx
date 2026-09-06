'use client'

import { useEffect, useRef } from 'react'
import { trackMetaEvent } from '@/lib/meta/meta.client'
import { toMetaContentIds } from '@/lib/meta/meta.product'
import { DEFAULT_CURRENCY } from '@/lib/constants'

interface MetaInitiateCheckoutProps {
  cartId: string
  productIds: string[]
  value: number
  numItems: number
  currency?: string
}

/**
 * Fires InitiateCheckout once when the checkout page mounts.
 * event_id = cart.id for Pixel ↔ CAPI deduplication.
 */
export function MetaInitiateCheckout ({
  cartId,
  productIds,
  value,
  numItems,
  currency = DEFAULT_CURRENCY,
}: MetaInitiateCheckoutProps) {
  const firedRef = useRef(false)
  const productIdsKey = productIds.join(',')

  useEffect(() => {
    if (firedRef.current || !cartId || !productIdsKey) return
    firedRef.current = true

    trackMetaEvent(
      'InitiateCheckout',
      {
        content_ids: toMetaContentIds(productIdsKey.split(',')),
        content_type: 'product',
        value: Number.isFinite(value) ? value : 0,
        currency,
        num_items: numItems,
      },
      { eventId: cartId }
    )
  }, [cartId, productIdsKey, value, numItems, currency])

  return null
}
