import { describe, expect, it } from 'vitest'
import {
  formatAge,
  fulfillmentQueueQuery,
  parseFulfillmentQueueFilters,
  queueNeighbours,
  serviceChips,
  type FulfillmentQueueService,
} from './queue'

describe('parseFulfillmentQueueFilters', () => {
  it('defaults to the open queue, page 1', () => {
    expect(parseFulfillmentQueueFilters({})).toEqual({ state: 'open', service: null, review: null, q: null, page: 1 })
  })

  it('keeps known values and drops unknown ones', () => {
    expect(
      parseFulfillmentQueueFilters({ state: 'active', service: 'returns', review: 'contacted', q: ' acme ', page: '3' }),
    ).toEqual({ state: 'active', service: 'returns', review: 'contacted', q: 'acme', page: 3 })
    expect(parseFulfillmentQueueFilters({ state: 'x', service: 'drop table', review: 'y', page: '-2' })).toEqual({
      state: 'open',
      service: null,
      review: null,
      q: null,
      page: 1,
    })
  })

  it('round-trips through the query string without the defaults', () => {
    expect(fulfillmentQueueQuery(parseFulfillmentQueueFilters({}))).toBe('')
    expect(fulfillmentQueueQuery({ state: 'all', service: 'storage', page: 2 })).toBe('?state=all&service=storage&page=2')
  })
})

describe('serviceChips', () => {
  it('returns all five services in a fixed order, null when not requested', () => {
    const returns: FulfillmentQueueService = {
      serviceType: 'returns',
      status: 'requested',
      requestedProvider: 'tallaby',
      activeProvider: 'seller',
      requestedAt: null,
    }
    const chips = serviceChips([returns])
    expect(chips.map((chip) => chip.serviceType)).toEqual(['storage', 'packaging', 'delivery', 'customer_service', 'returns'])
    expect(chips[4]!.service).toBe(returns)
    expect(chips[0]!.service).toBeNull()
  })
})

describe('formatAge', () => {
  const now = new Date('2026-10-18T12:00:00Z')
  it('uses minutes, hours, then days', () => {
    expect(formatAge('2026-10-18T11:50:00Z', now)).toBe('10 min')
    expect(formatAge('2026-10-18T02:00:00Z', now)).toBe('10 h')
    expect(formatAge('2026-10-15T12:00:00Z', now)).toBe('3 d')
    expect(formatAge(null, now)).toBe('')
  })
})

describe('queueNeighbours', () => {
  it('finds previous and next in queue order', () => {
    expect(queueNeighbours(['a', 'b', 'c'], 'b')).toEqual({ previous: 'a', next: 'c', position: 2 })
    expect(queueNeighbours(['a', 'b'], 'a')).toEqual({ previous: null, next: 'b', position: 1 })
    expect(queueNeighbours(['a'], 'z')).toEqual({ previous: null, next: null, position: null })
  })
})
