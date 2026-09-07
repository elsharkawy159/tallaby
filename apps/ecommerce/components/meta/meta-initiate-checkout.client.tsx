'use client'

import { useEffect, useRef } from 'react'
import { trackMetaEvent } from '@/lib/meta/meta.client'
import { toMetaContentIds } from '@/lib/meta/meta.product'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { trackMetaInitiateCheckoutAction } from '@/actions/meta'

interface MetaInitiateCheckoutProps {
  cartId: string
  productIds: string[]
  value: number
  numItems: number
  currency?: string
}

const CLIENT_GATE_PREFIX = 'meta_ic_client_'

/**
 * Fires InitiateCheckout Pixel once on checkout mount, then triggers
 * one-shot CAPI via server action (same event_id = cart.id).
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

    const ids = toMetaContentIds(productIdsKey.split(','))
    const safeValue = Number.isFinite(value) ? value : 0

    trackMetaEvent(
      'InitiateCheckout',
      {
        content_ids: ids,
        content_type: 'product',
        value: safeValue,
        currency,
        num_items: numItems,
      },
      { eventId: cartId }
    )

    const clientGateKey = `${CLIENT_GATE_PREFIX}${cartId}`
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(clientGateKey)) {
        return
      }
      sessionStorage.setItem(clientGateKey, '1')
    } catch {
      // sessionStorage unavailable — server cookie gate still applies
    }

    void trackMetaInitiateCheckoutAction({
      cartId,
      productIds: ids,
      value: safeValue,
      numItems,
      currency,
    })
  }, [cartId, productIdsKey, value, numItems, currency])

  return null
}
