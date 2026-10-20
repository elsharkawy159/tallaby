import { describe, expect, it } from 'vitest'
import { normalizeServiceChoices } from './choices'
import { nextReviewStatus, planServiceRequests } from './request'
import type { SellerServiceRow } from './types'
import type { ServiceChoices } from './validate'

const BASE = 'plan-delivery-standard'
const seller = { provider: 'seller' as const, planId: null }

const baselineChoices: ServiceChoices = {
  storage: seller,
  packaging: seller,
  delivery: { provider: 'tallaby', planId: BASE },
  customer_service: seller,
  returns: seller,
}

const row = (overrides: Partial<SellerServiceRow> & Pick<SellerServiceRow, 'serviceType'>): SellerServiceRow => ({
  status: 'active',
  requestedProvider: 'seller',
  requestedPlanId: null,
  requestedConfig: {},
  activeProvider: 'seller',
  activePlanId: null,
  activeConfig: {},
  ...overrides,
})

describe('planServiceRequests', () => {
  it('inserts all five rows for a seller without rows; baseline choices are active, others requested', () => {
    const plan = planServiceRequests([], { ...baselineChoices, storage: { provider: 'tallaby', planId: 'p-storage' } }, BASE)
    expect(plan.map((p) => p.kind)).toEqual(['insert', 'insert', 'insert', 'insert', 'insert'])
    expect(plan.find((p) => p.serviceType === 'storage')).toMatchObject({ status: 'requested', requested: { provider: 'tallaby', planId: 'p-storage' } })
    expect(plan.find((p) => p.serviceType === 'delivery')).toMatchObject({ status: 'active' })
    expect(plan.find((p) => p.serviceType === 'packaging')).toMatchObject({ status: 'active' })
  })

  it('own delivery without rows is a request (only an admin activates it)', () => {
    const plan = planServiceRequests([], { ...baselineChoices, delivery: { provider: 'seller', planId: null, config: { mode: 'own_riders' } } }, BASE)
    expect(plan.find((p) => p.serviceType === 'delivery')).toMatchObject({
      kind: 'insert',
      status: 'requested',
      requested: { provider: 'seller', planId: null, config: { mode: 'own_riders' } },
    })
  })

  it('re-submitting the current request is unchanged, whatever its status', () => {
    const existing = [
      row({ serviceType: 'storage', status: 'under_review', requestedProvider: 'tallaby', requestedPlanId: 'p-storage' }),
      row({ serviceType: 'packaging', status: 'rejected', requestedProvider: 'tallaby', requestedPlanId: 'p-pack' }),
    ]
    const plan = planServiceRequests(existing, {
      ...baselineChoices,
      storage: { provider: 'tallaby', planId: 'p-storage' },
      packaging: { provider: 'tallaby', planId: 'p-pack' },
    }, BASE)
    expect(plan.find((p) => p.serviceType === 'storage')!.kind).toBe('unchanged')
    expect(plan.find((p) => p.serviceType === 'packaging')!.kind).toBe('unchanged')
  })

  it('a new choice becomes a request; going back to the live config withdraws it', () => {
    const existing = [
      row({ serviceType: 'storage' }),
      row({ serviceType: 'packaging', status: 'requested', requestedProvider: 'tallaby', requestedPlanId: 'p-pack' }),
    ]
    const plan = planServiceRequests(existing, { ...baselineChoices, storage: { provider: 'tallaby', planId: 'p-storage' } }, BASE)
    expect(plan.find((p) => p.serviceType === 'storage')).toMatchObject({ kind: 'update', status: 'requested' })
    expect(plan.find((p) => p.serviceType === 'packaging')).toMatchObject({ kind: 'update', status: 'active', requested: { provider: 'seller' } })
  })

  it('changing the seller delivery mode is a change the team must see', () => {
    const existing = [
      row({
        serviceType: 'delivery',
        requestedConfig: { mode: 'own_riders' },
        activeConfig: { mode: 'own_riders' },
      }),
    ]
    const plan = planServiceRequests(existing, {
      ...baselineChoices,
      delivery: { provider: 'seller', planId: null, config: { mode: 'external_courier', courierName: 'Bosta' } },
    }, BASE)
    expect(plan.find((p) => p.serviceType === 'delivery')).toMatchObject({ kind: 'update', status: 'requested' })
  })

  it('refuses to change a paused service (any status change would un-pause it)', () => {
    const existing = [row({ serviceType: 'storage', status: 'paused', requestedProvider: 'tallaby', requestedPlanId: 'p-storage', activeProvider: 'tallaby', activePlanId: 'p-storage' })]
    const plan = planServiceRequests(existing, baselineChoices, BASE)
    expect(plan.find((p) => p.serviceType === 'storage')!.kind).toBe('blocked')
  })

  it('never carries a plan on a seller-handled service or config on a Tallaby one', () => {
    const plan = planServiceRequests([], {
      ...baselineChoices,
      storage: { provider: 'tallaby', planId: 'p', config: { mode: 'own_riders' } },
    }, BASE)
    expect(plan.find((p) => p.serviceType === 'storage')).toMatchObject({ requested: { config: {} } })
  })
})

describe('nextReviewStatus', () => {
  it('opens a review for a new or configured profile, keeps an ongoing one, closes when nothing is open', () => {
    expect(nextReviewStatus(null, ['requested'])).toBe('pending_contact')
    expect(nextReviewStatus('configured', ['active', 'under_review'])).toBe('pending_contact')
    expect(nextReviewStatus('contacted', ['awaiting_agreement'])).toBe('contacted')
    expect(nextReviewStatus('contacted', ['active', 'rejected'])).toBe('configured')
  })
})

describe('normalizeServiceChoices', () => {
  it('drops plans from seller services, config from Tallaby ones, and the courier name unless external', () => {
    const out = normalizeServiceChoices({
      ...baselineChoices,
      storage: { provider: 'seller', planId: 'x' as never },
      packaging: { provider: 'tallaby', planId: 'p', config: { mode: 'own_riders' } },
      delivery: { provider: 'seller', planId: null, config: { mode: 'own_riders', courierName: 'X' } },
    })
    expect(out.storage).toEqual({ provider: 'seller', planId: null })
    expect(out.packaging).toEqual({ provider: 'tallaby', planId: 'p' })
    expect(out.delivery).toEqual({ provider: 'seller', planId: null, config: { mode: 'own_riders' } })
  })
})
