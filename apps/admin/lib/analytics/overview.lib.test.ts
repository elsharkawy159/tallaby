import { describe, expect, it } from 'vitest'
import {
  biggestFunnelDrop,
  buildFunnel,
  groupOutcomes,
  initials,
  parseOverviewRange,
  paymentLabel,
  sharePercent,
  splitDays,
  type RawOverviewDay
} from './overview.lib'

function day (i: number, gmv: number, extra: Partial<RawOverviewDay> = {}): RawOverviewDay {
  return { i, date: `2026-10-${String(i + 1).padStart(2, '0')}`, gmv: String(gmv), orders: 1, delivered: 0, fees: '5.00', new_stores: 0, top_ups: '0', ...extra }
}

describe('parseOverviewRange', () => {
  it('accepts 7, 30 and 90 and defaults to 30', () => {
    expect(parseOverviewRange('7')).toBe(7)
    expect(parseOverviewRange(['90'])).toBe(90)
    expect(parseOverviewRange('14')).toBe(30)
    expect(parseOverviewRange(undefined)).toBe(30)
  })
})

describe('splitDays', () => {
  it('splits the previous and current windows and sums each', () => {
    const rows = [day(3, 40, { delivered: 2, top_ups: '100' }), day(0, 10), day(1, 20), day(2, 30, { delivered: 1 })]
    const result = splitDays(rows, 2)
    expect(result.days.map((d) => d.gmv)).toEqual([30, 40])
    expect(result.gmv).toEqual({ current: 70, previous: 30, changePercent: 133.3 })
    expect(result.orders.current).toBe(2)
    expect(result.fees.current).toBe(10)
    expect(result.deliveredOrders).toBe(3)
    expect(result.topUps).toBe(100)
  })
})

describe('groupOutcomes', () => {
  it('folds order statuses into four groups', () => {
    const groups = groupOutcomes({ delivered: 5, pending: 1, shipped: 2, returned: 1, refunded: 1, cancelled: 3 })
    expect(groups.map((g) => [g.key, g.value])).toEqual([
      ['delivered', 5],
      ['open', 3],
      ['returned', 2],
      ['cancelled', 3]
    ])
    expect(groupOutcomes(null).every((g) => g.value === 0)).toBe(true)
  })
})

describe('funnel', () => {
  it('finds the step that loses the largest share', () => {
    const funnel = buildFunnel({ signed_up: 100, store: 90, product: 40, published: 30, order: 20 })
    expect(biggestFunnelDrop(funnel)).toMatchObject({ from: 'Store created', to: 'First product' })
    expect(biggestFunnelDrop(buildFunnel(null))).toBeNull()
  })
})

describe('formatting helpers', () => {
  it('computes shares, labels and initials', () => {
    expect(sharePercent(1, 3)).toBe(33.3)
    expect(sharePercent(1, 0)).toBe(0)
    expect(paymentLabel('cash')).toBe('Cash on delivery')
    expect(paymentLabel("'cash")).toBe('Cash on delivery')
    expect(paymentLabel('bank_transfer')).toBe('Bank Transfer')
    expect(initials('Nile Crafts')).toBe('NC')
    expect(initials('متجر  النيل')).toBe('ما')
  })
})
