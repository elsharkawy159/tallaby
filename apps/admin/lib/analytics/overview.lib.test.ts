import { describe, expect, it } from 'vitest'
import {
  addDays,
  biggestFunnelDrop,
  bucketCount,
  buildFunnel,
  buildTrend,
  cairoDate,
  conversionPercent,
  daysBetween,
  fillPoints,
  groupOutcomes,
  initials,
  isIsoDate,
  parseOverviewPeriodKey,
  paymentLabel,
  periodBuckets,
  resolveOverviewPeriod,
  sharePercent,
  sparkSeries
} from './overview.lib'
import { OVERVIEW_PERIOD_KEYS } from './overview.types'

/** Noon in Cairo on a given day (UTC+2 in winter, +3 in summer: noon is safe either way). */
const cairoNoon = (date: string) => new Date(`${date}T10:00:00Z`)

const window = (key: Parameters<typeof resolveOverviewPeriod>[0], date: string) => {
  const p = resolveOverviewPeriod(key, cairoNoon(date))
  return [p.start, p.end, p.prevStart, p.prevEnd]
}

describe('parseOverviewPeriodKey', () => {
  it('accepts every key, maps the legacy 7 | 30 | 90 and defaults to 30 days', () => {
    for (const key of OVERVIEW_PERIOD_KEYS) expect(parseOverviewPeriodKey(key)).toBe(key)
    expect(parseOverviewPeriodKey('7')).toBe('7d')
    expect(parseOverviewPeriodKey(['30'])).toBe('30d')
    expect(parseOverviewPeriodKey('90')).toBe('90d')
    expect(parseOverviewPeriodKey('14')).toBe('30d')
    expect(parseOverviewPeriodKey("'; drop table orders")).toBe('30d')
    expect(parseOverviewPeriodKey(undefined)).toBe('30d')
  })
})

describe('date helpers', () => {
  it('adds and counts days across month, year and leap boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
    expect(daysBetween('2028-02-01', '2028-03-01')).toBe(29)
    expect(isIsoDate('2027-02-29')).toBe(false)
    expect(isIsoDate('2028-02-29')).toBe(true)
    expect(isIsoDate('2026-1-01')).toBe(false)
  })

  it('reads the Cairo day, not the UTC one', () => {
    // 23:30 UTC on Nov 25 is 01:30 on Nov 26 in Cairo (UTC+2).
    expect(cairoDate(new Date('2026-11-25T23:30:00Z'))).toBe('2026-11-26')
    // Summer time (UTC+3): 21:30 UTC on Jul 1 is 00:30 on Jul 2.
    expect(cairoDate(new Date('2026-07-01T21:30:00Z'))).toBe('2026-07-02')
    expect(cairoDate(new Date('2026-07-01T20:30:00Z'))).toBe('2026-07-01')
  })
})

describe('resolveOverviewPeriod', () => {
  it('today and yesterday, by the hour', () => {
    expect(window('today', '2026-11-26')).toEqual(['2026-11-26', '2026-11-27', '2026-11-25', '2026-11-26'])
    expect(window('yesterday', '2026-11-26')).toEqual(['2026-11-25', '2026-11-26', '2026-11-24', '2026-11-25'])
    const today = resolveOverviewPeriod('today', cairoNoon('2026-11-26'))
    expect(today.bucket).toBe('hour')
    expect(today.rangeLabel).toBe('Nov 26, 2026')
    expect(today.prevLabel).toBe('Nov 25')
  })

  it('rolling windows include today and compare with the same number of days before', () => {
    expect(window('3d', '2026-11-26')).toEqual(['2026-11-24', '2026-11-27', '2026-11-21', '2026-11-24'])
    expect(window('7d', '2026-11-26')).toEqual(['2026-11-20', '2026-11-27', '2026-11-13', '2026-11-20'])
    expect(window('30d', '2026-11-26')).toEqual(['2026-10-28', '2026-11-27', '2026-09-28', '2026-10-28'])
    expect(window('90d', '2026-11-26')).toEqual(['2026-08-29', '2026-11-27', '2026-05-31', '2026-08-29'])
    const p = resolveOverviewPeriod('30d', cairoNoon('2026-11-26'))
    expect(p.bucket).toBe('day')
    expect(p.rangeLabel).toBe('Oct 28 – Nov 26, 2026')
    expect(p.prevLabel).toBe('Sep 28 – Oct 27')
  })

  it('this month compares with the same days of last month', () => {
    expect(window('month', '2026-11-26')).toEqual(['2026-11-01', '2026-11-27', '2026-10-01', '2026-10-27'])
    const p = resolveOverviewPeriod('month', cairoNoon('2026-11-26'))
    expect(p.rangeLabel).toBe('Nov 1 – Nov 26, 2026')
    expect(p.prevLabel).toBe('Oct 1 – Oct 26')
  })

  it('clamps this month to last month\'s length (Mar 31 → Feb)', () => {
    expect(window('month', '2026-03-31')).toEqual(['2026-03-01', '2026-04-01', '2026-02-01', '2026-03-01'])
    expect(window('month', '2028-03-31')).toEqual(['2028-03-01', '2028-04-01', '2028-02-01', '2028-03-01'])
    expect(window('month', '2026-03-29')).toEqual(['2026-03-01', '2026-03-30', '2026-02-01', '2026-03-01'])
  })

  it('this month in January compares with December of the year before', () => {
    expect(window('month', '2027-01-10')).toEqual(['2027-01-01', '2027-01-11', '2026-12-01', '2026-12-11'])
    expect(resolveOverviewPeriod('month', cairoNoon('2027-01-10')).prevLabel).toBe('Dec 1 – Dec 10, 2026')
    // The 1st of the month is one day, so it is bucketed by the hour.
    expect(resolveOverviewPeriod('month', cairoNoon('2027-01-01')).bucket).toBe('hour')
  })

  it('last month is the full previous month against the one before', () => {
    expect(window('last_month', '2026-11-26')).toEqual(['2026-10-01', '2026-11-01', '2026-09-01', '2026-10-01'])
    expect(window('last_month', '2027-01-05')).toEqual(['2026-12-01', '2027-01-01', '2026-11-01', '2026-12-01'])
    expect(window('last_month', '2026-02-10')).toEqual(['2026-01-01', '2026-02-01', '2025-12-01', '2026-01-01'])
    expect(resolveOverviewPeriod('last_month', cairoNoon('2026-11-26')).rangeLabel).toBe('Oct 1 – Oct 31, 2026')
  })

  it('this year compares with the same span last year, leap-day safe', () => {
    expect(window('year', '2026-11-26')).toEqual(['2026-01-01', '2026-11-27', '2025-01-01', '2025-11-27'])
    // Feb 29 in a leap year: 60 days, the same 60 days of the year before.
    expect(window('year', '2028-02-29')).toEqual(['2028-01-01', '2028-03-01', '2027-01-01', '2027-03-02'])
    // Dec 31 of a leap year: 366 days, clamped to the 365 of the year before.
    expect(window('year', '2028-12-31')).toEqual(['2028-01-01', '2029-01-01', '2027-01-01', '2028-01-01'])
    expect(resolveOverviewPeriod('year', cairoNoon('2026-11-26')).bucket).toBe('week')
    expect(resolveOverviewPeriod('year', cairoNoon('2026-02-10')).bucket).toBe('day')
    expect(resolveOverviewPeriod('year', cairoNoon('2026-11-26')).prevLabel).toBe('Jan 1 – Nov 26, 2025')
  })

  it('works on the Cairo day at the UTC day boundary', () => {
    // 22:30 UTC Nov 30 = 00:30 Dec 1 in Cairo: "this month" is already December.
    const p = resolveOverviewPeriod('month', new Date('2026-11-30T22:30:00Z'))
    expect([p.start, p.end]).toEqual(['2026-12-01', '2026-12-02'])
  })
})

describe('buckets', () => {
  it('labels hours, days and weeks', () => {
    const today = resolveOverviewPeriod('today', cairoNoon('2026-11-26'))
    expect(bucketCount(today)).toBe(24)
    expect(periodBuckets(today)[14]).toBe('14:00')
    const week = resolveOverviewPeriod('7d', cairoNoon('2026-11-26'))
    expect(periodBuckets(week)).toHaveLength(7)
    expect(periodBuckets(week)[0]).toBe('Nov 20')
    const year = resolveOverviewPeriod('year', cairoNoon('2026-11-26'))
    expect(bucketCount(year)).toBe(Math.ceil(330 / 7))
    expect(periodBuckets(year)[1]).toBe('Week of Jan 08')
  })

  it('zero-fills the series', () => {
    const p = resolveOverviewPeriod('3d', cairoNoon('2026-11-26'))
    const points = fillPoints(p, [{ i: 1, gmv: '120.50', orders: 2, top_ups: 1 }, { i: 9, gmv: '1' }])
    expect(points.map((point) => point.gmv)).toEqual([0, 120.5, 0])
    expect(points[1]).toMatchObject({ orders: 2, topUps: 1, newSellers: 0, label: 'Nov 25' })
    expect(sparkSeries(points, 'gmv')).toEqual([0, 120.5, 0])
  })
})

describe('buildTrend', () => {
  it('pairs current and previous totals and averages EGP orders', () => {
    const p = resolveOverviewPeriod('7d', cairoNoon('2026-11-26'))
    const trend = buildTrend(p, {
      gmv_cur: '300.00', gmv_prev: '100.00', gmv_orders_cur: 3, gmv_orders_prev: 0,
      orders_cur: 4, orders_prev: 2, top_up_sellers: 2, admin_credit_net: '4.50'
    }, [])
    expect(trend.gmv).toEqual({ current: 300, previous: 100, changePercent: 200 })
    expect(trend.averageOrder).toMatchObject({ current: 100, previous: 0 })
    expect(trend.orders.changePercent).toBe(100)
    expect(trend.topUpSellers).toBe(2)
    expect(trend.adminCreditNet).toBe(4.5)
    expect(trend.newSellers).toEqual({ current: 0, previous: 0, changePercent: 0 })
    expect(trend.points).toHaveLength(7)
  })

  it('computes top-up conversion', () => {
    expect(conversionPercent(6, 16, 19)).toBe(14.6)
    expect(conversionPercent(0, 0, 0)).toBeNull()
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
  it('has the activated step and finds the step that loses the largest share', () => {
    const funnel = buildFunnel({ signed_up: 100, store: 90, product: 40, published: 30, activated: 25, order: 20 })
    expect(funnel.map((step) => step.key)).toEqual(['signed_up', 'store', 'product', 'published', 'activated', 'order'])
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
