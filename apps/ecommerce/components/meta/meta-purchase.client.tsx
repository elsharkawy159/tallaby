'use client'

import { useEffect, useRef } from 'react'
import { trackMetaEvent } from '@/lib/meta/meta.client'
import { toMetaContentIds } from '@/lib/meta/meta.product'
import { DEFAULT_CURRENCY } from '@/lib/constants'

const STORAGE_PREFIX = 'meta_purchase_'

interface MetaPurchaseProps {
  orderId: string
  productIds: string[]
  value: number
  numItems: number
  currency?: string
}

/**
 * Fires Purchase once per order (localStorage + ref guard).
 * event_id = order.id must match the CAPI event from createOrder.
 */
export function MetaPurchase ({
  orderId,
  productIds,
  value,
  numItems,
  currency = DEFAULT_CURRENCY,
}: MetaPurchaseProps) {
  const firedRef = useRef(false)
  const productIdsKey = productIds.join(',')

  useEffect(() => {
    if (firedRef.current || !orderId || !productIdsKey) return

    const fire = () => {
      trackMetaEvent(
        'Purchase',
        {
          content_ids: toMetaContentIds(productIdsKey.split(',')),
          content_type: 'product',
          value: Number.isFinite(value) ? value : 0,
          currency,
          num_items: numItems,
        },
        { eventId: orderId }
      )
    }

    try {
      const key = `${STORAGE_PREFIX}${orderId}`
      if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
        firedRef.current = true
        return
      }

      firedRef.current = true
      fire()
      window.localStorage.setItem(key, '1')
    } catch {
      firedRef.current = true
      fire()
    }
  }, [orderId, productIdsKey, value, numItems, currency])

  return null
}
