import { describe, expect, it } from 'vitest'

import { CAIRO_ORIGIN_RATES } from '../shipping/shipping-rates'
import {
  allCountries,
  allPlaces,
  childrenOf,
  EGYPT,
  getPlace,
  normalizePlaceText,
  placeChain,
  placeLabel,
  resolveAddressPlace,
  searchPlaces,
} from './places.lib'

describe('place dataset', () => {
  it('every Egypt governorate rate key is a region place', () => {
    for (const g of Object.keys(CAIRO_ORIGIN_RATES)) {
      expect(getPlace(`EG/${g}`)?.level).toBe('region')
    }
  })

  it('keys are unique and every parent exists', () => {
    const places = allPlaces()
    const keys = new Set<string>()
    for (const p of places) {
      expect(keys.has(p.key), `duplicate key ${p.key}`).toBe(false)
      keys.add(p.key)
      const chain = placeChain(p.key)
      expect(chain[0]).toBe(p.key)
      expect(chain.length).toBe(p.level === 'country' ? 1 : p.level === 'region' ? 2 : 3)
      for (const parent of chain.slice(1)) {
        expect(getPlace(parent), `missing parent ${parent} of ${p.key}`).toBeDefined()
      }
    }
  })

  it('city slugs are lowercase kebab-case ASCII', () => {
    for (const p of allPlaces()) {
      if (p.level !== 'city') continue
      const slug = p.key.split('/')[2]!
      expect(slug, p.key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('has Arabic and English names everywhere', () => {
    for (const p of allPlaces()) {
      expect(p.nameAr.trim(), p.key).not.toBe('')
      expect(p.nameEn.trim(), p.key).not.toBe('')
      expect(p.nameAr, p.key).toMatch(/[؀-ۿ]/)
    }
  })

  it('covers the countries and depth the spec names', () => {
    expect(childrenOf('SA').length).toBe(13)
    expect(searchPlaces('riyadh')[0]!.key.startsWith('SA')).toBe(true)
    const riyadh = searchPlaces('الرياض').slice(0, 3).map((p) => p.key)
    expect(riyadh.some((k) => k.startsWith('SA/'))).toBe(true)
    expect(searchPlaces('الرياض').some((p) => p.key === 'EG/KAFR EL SHEIKH/el-riyad')).toBe(true)
    expect(childrenOf('EG').length).toBe(27)
    expect(childrenOf('EG/CAIRO').length).toBeGreaterThanOrEqual(25)
    expect(childrenOf('EG/GIZA').length).toBeGreaterThanOrEqual(12)
    expect(childrenOf('EG/ALEXANDRIA').length).toBeGreaterThanOrEqual(12)
    for (const g of Object.keys(CAIRO_ORIGIN_RATES)) {
      expect(childrenOf(`EG/${g}`).length, g).toBeGreaterThan(0)
    }
    for (const cc of ['AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'IQ', 'LB', 'PS', 'SY', 'YE', 'LY', 'SD', 'TN', 'DZ', 'MA']) {
      expect(childrenOf(cc).length, cc).toBeGreaterThan(0)
    }
    expect(allCountries().length).toBeGreaterThanOrEqual(240)
    expect(allCountries()[0]!.key).toBe(EGYPT)
  })

  it('childrenOf EG is in Arabic order', () => {
    const names = childrenOf('EG').map((p) => p.nameAr)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'ar')))
  })
})

describe('normalizePlaceText', () => {
  it('folds Arabic and English variants', () => {
    expect(normalizePlaceText('  القاهـرةُ ')).toBe('القاهره')
    expect(normalizePlaceText('الإسكندرية')).toBe('الاسكندريه')
    expect(normalizePlaceText('Kafr-El_Sheikh.')).toBe('kafr el sheikh')
    expect(normalizePlaceText('مرسى  مطروح')).toBe('مرسي مطروح')
  })
})

describe('searchPlaces', () => {
  it('search ranks Egypt first', () => {
    expect(searchPlaces('nas')[0]!.key.startsWith('EG')).toBe(true)
    expect(searchPlaces('مدينة نصر')[0]!.key).toBe('EG/CAIRO/nasr-city')
    expect(searchPlaces('القاهره')[0]!.key).toBe('EG/CAIRO')
  })

  it('search finds countries in both languages', () => {
    expect(searchPlaces('saudi')[0]!.key).toBe('SA')
    expect(searchPlaces('السعودية')[0]!.key).toBe('SA')
  })

  it('within restricts to descendants', () => {
    const hits = searchPlaces('a', { within: 'EG/GIZA' })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((p) => p.key.startsWith('EG/GIZA/'))).toBe(true)
  })

  it('respects limit and levels', () => {
    expect(searchPlaces('a', { limit: 5 }).length).toBe(5)
    expect(searchPlaces('a').length).toBe(20)
    expect(searchPlaces('a', { levels: ['country'] }).every((p) => p.level === 'country')).toBe(true)
  })

  it('matches without the article', () => {
    expect(searchPlaces('maadi')[0]!.key).toBe('EG/CAIRO/maadi')
    expect(searchPlaces('معادي')[0]!.key).toBe('EG/CAIRO/maadi')
  })

  it('returns nothing for an empty query', () => {
    expect(searchPlaces('   ')).toEqual([])
  })
})

describe('resolveAddressPlace', () => {
  it('resolves geocoder and typed spellings', () => {
    expect(resolveAddressPlace({ state: 'Cairo Governorate', city: 'Nasr City' })).toBe('EG/CAIRO/nasr-city')
    expect(resolveAddressPlace({ state: 'Al Qalyubiya', city: '' })).toBe('EG/QALIUBIA')
    expect(resolveAddressPlace({ state: 'الجيزة', city: '6 أكتوبر' })).toBe('EG/GIZA/6th-of-october')
    expect(
      resolveAddressPlace({ state: 'القاهرة', city: 'x', addressLine1: 'شارع عباس العقاد, مدينة نصر' }),
    ).toBe('EG/CAIRO/nasr-city')
    expect(resolveAddressPlace({ country: '', state: '', city: '' })).toBe('EG')
    expect(resolveAddressPlace({ country: 'Saudi Arabia', state: 'Riyadh', city: 'Riyadh' })?.startsWith('SA')).toBe(true)
    expect(resolveAddressPlace({ country: 'Egypt', state: 'Nowhere', city: '' })).toBe('EG')
  })

  it('finds the region from the city when the state is missing', () => {
    expect(resolveAddressPlace({ city: 'Sheikh Zayed' })).toBe('EG/GIZA/sheikh-zayed')
    expect(resolveAddressPlace({ country: 'EG', city: 'المنصورة' })).toBe('EG/DAKAHLIA/mansoura')
  })

  it('accepts ISO country codes', () => {
    expect(resolveAddressPlace({ country: 'ae', state: 'Dubai' })).toBe('AE/DUBAI')
    expect(resolveAddressPlace({ country: 'FR' })).toBe('FR')
    expect(resolveAddressPlace({ country: 'SAU', state: 'Riyadh' })).toBe('SA/RIYADH')
    expect(resolveAddressPlace({ country: 'egy', state: 'Giza' })).toBe('EG/GIZA')
  })
})

describe('placeLabel', () => {
  it('placeLabel shows the parent', () => {
    expect(placeLabel('EG/CAIRO/nasr-city', 'en')).toBe('Nasr City · Cairo')
    expect(placeLabel('EG/CAIRO/nasr-city', 'ar')).toBe('مدينة نصر · القاهرة')
    expect(placeLabel('EG/CAIRO', 'ar')).toBe('القاهرة')
    expect(placeLabel('EG', 'en')).toBe('Egypt')
    expect(placeLabel('AE/DUBAI', 'en')).toBe('Dubai · United Arab Emirates')
    expect(placeLabel('nope', 'en')).toBe('nope')
  })
})
