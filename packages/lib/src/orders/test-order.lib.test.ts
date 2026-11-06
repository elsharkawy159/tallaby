import { describe, expect, it } from 'vitest'
import { WALLET_PARTIAL_PREFIX } from './payment.lib'
import { isTestOrderPaymentAllowed } from './test-order.lib'

describe('test order payments (F-76)', () => {
  it('refuses the customer wallet, whole or part', () => {
    expect(isTestOrderPaymentAllowed('wallet')).toBe(false)
    expect(isTestOrderPaymentAllowed(`${WALLET_PARTIAL_PREFIX}cod`)).toBe(false)
  })

  it('allows cash on delivery, transfers and the seller gateway', () => {
    for (const method of ['cod', 'instapay', 'vodafone_cash', 'online_payment']) {
      expect(isTestOrderPaymentAllowed(method)).toBe(true)
    }
  })
})
