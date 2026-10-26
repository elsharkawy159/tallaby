import {
  normalizeNullablePrice,
  normalizePrice,
} from './round-price'

export type PriceDiscountType = 'amount' | 'percent' | null

export interface ParsedPriceJson {
  base: number
  list: number | null
  final: number
  discountType: PriceDiscountType
  discountValue: number | null
}

export interface PriceJsonObject {
  base?: number | string | null
  list?: number | string | null
  final?: number | string | null
  current?: number | string | null
  discountType?: string | null
  discountValue?: number | string | null
  discount?: number | string | null
}

function toFiniteNumber (value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toNullableNumber (value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = toFiniteNumber(value, Number.NaN)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeDiscountType (value: unknown): PriceDiscountType {
  if (value === 'amount' || value === 'percent') return value
  return null
}

/**
 * Normalize product / variant price jsonb (or legacy scalar) into a consistent shape.
 * Matches products.price: { base, list, final, discountType, discountValue }.
 *
 * `base`, `list` and `final` are kept as the seller entered them (to the
 * piastre, normalizePrice) so every surface that reads a price (storefront,
 * cart snapshot, dashboard, admin) agrees on the same number. Prices are not
 * rounded to a 5 EGP step any more (owner, 2026-10-26).
 */
export function parsePriceJson (price: unknown): ParsedPriceJson {
  if (typeof price === 'number') {
    const amount = normalizePrice(Number.isFinite(price) ? price : 0)
    return {
      base: amount,
      list: null,
      final: amount,
      discountType: null,
      discountValue: null,
    }
  }

  if (typeof price === 'string') {
    const amount = normalizePrice(toFiniteNumber(price, 0))
    return {
      base: amount,
      list: null,
      final: amount,
      discountType: null,
      discountValue: null,
    }
  }

  if (!price || typeof price !== 'object' || Array.isArray(price)) {
    return {
      base: 0,
      list: null,
      final: 0,
      discountType: null,
      discountValue: null,
    }
  }

  const obj = price as PriceJsonObject
  const list = normalizeNullablePrice(toNullableNumber(obj.list))
  const base =
    normalizeNullablePrice(toNullableNumber(obj.base)) ?? list ?? 0
  const final =
    normalizeNullablePrice(toNullableNumber(obj.final)) ??
    normalizeNullablePrice(toNullableNumber(obj.current)) ??
    list ??
    base

  return {
    base,
    list,
    final,
    discountType: normalizeDiscountType(obj.discountType),
    discountValue:
      toNullableNumber(obj.discountValue) ?? toNullableNumber(obj.discount),
  }
}

/** Customer-facing unit price from product or variant price jsonb. */
export function getPriceFinal (price: unknown): number {
  return parsePriceJson(price).final
}

/** List / strikethrough price when present and greater than final. */
export function getPriceList (price: unknown): number | null {
  const parsed = parsePriceJson(price)
  if (parsed.list == null) return null
  return parsed.list
}
