import { normalizeGovernorate } from './governorate.lib'

/**
 * The exact column headers of Wassalha Egypt Post's upload template, in
 * order. "Package_Ref. Number" (dot + space, no leading "Package_") is
 * copied verbatim from their sheet — do not "fix" the spelling.
 */
export const EGYPT_POST_COLUMNS = [
  'Package_Serial',
  'Description',
  'Total_Weight',
  'Package_volume',
  'COD_Value',
  'Item_Special_Notes',
  'Customer_Name',
  'Mobile_No',
  'Street',
  'City',
  'Package_Ref. Number',
  'Merchant_Name',
  'Warehouse_Name',
  'HasPOD',
  'SellerName',
  'Post_Id',
] as const

export type EgyptPostColumn = (typeof EGYPT_POST_COLUMNS)[number]

export type EgyptPostRow = Record<EgyptPostColumn, string | number>

/** Their exact casing — do not normalize. */
export const PACKAGE_VOLUMES = ['Small', 'medium', 'Large'] as const
export type PackageVolume = (typeof PACKAGE_VOLUMES)[number]

/**
 * Maps our canonical governorate keys (packages/lib/src/shipping/
 * shipping-rates.ts, via normalizeGovernorate) onto Egypt Post's own City
 * enum values. All 27 of our governorates map onto exactly 27 of theirs;
 * the differences are their spelling, preserved deliberately because the
 * uploaded sheet must match their enum, not correct it.
 */
export const EGYPT_POST_GOVERNORATES: Record<string, string> = {
  CAIRO: 'CAIRO',
  GIZA: 'GIZA',
  QALIUBIA: 'QALIUBIA',
  'KAFR EL SHEIKH': 'KAFR EL SHEIKH',
  SHARKIA: 'SHARKIA',
  ALEXANDRIA: 'ALEXANDRIA',
  BEHEIRA: 'BEHIRA',
  GHARBIA: 'GHARBIA',
  MONUFIA: 'MONOUFIA',
  DAMIETTA: 'DOMITTA',
  DAKAHLIA: 'DAKAHLIA',
  ISMAILIA: 'ISMAILIA',
  SUEZ: 'SUEZ',
  'PORT SAID': 'PORT SAID',
  FAYOUM: 'FAYOUM',
  'BENI SUEF': 'BANI SWEIF',
  MINYA: 'MENIA',
  ASSIUT: 'ASSIUT',
  SOHAG: 'SOUHAGE',
  QENA: 'QENA',
  ASWAN: 'ASWAN',
  LUXOR: 'LOUXOR',
  'RED SEA': 'RED SEA',
  'MARSA MATROUH': 'MARSA MATROUH',
  'NEW VALLEY': 'NEW VALLLEY',
  'NORTH SINAI': 'NOURTH SINAI',
  'SOUTH SINAI': 'SOUTH SINAI',
}

/** Description is truncated to this length so it never overflows their sheet. */
const MAX_DESCRIPTION_LENGTH = 200

export interface EgyptPostOrderItemInput {
  productName: string
  quantity: number
}

/**
 * The plain data an order must supply to be mapped onto an Egypt Post sheet
 * row. Deliberately not a Drizzle row type — this package has no DB
 * dependency, so the caller (apps/shipping's batch server action) assembles
 * this from its own joined query.
 */
export interface EgyptPostOrderInput {
  orderId: string
  orderNumber: string
  orderNotes?: string | null
  totalAmount: number
  /** `orders.payment_status`. `'paid'` and `'collected'` both mean nothing is due on delivery. */
  paymentStatus: string | null
  /**
   * `shipments.package_weight`, in kg (matching that column's unit). Falls
   * back to the batch default when null. Converted to grams when written
   * to `Total_Weight` — Wassalha's template expects grams, not kg.
   */
  packageWeightKg?: number | null
  customerName?: string | null
  /** Preferred phone, e.g. the shipping address's — falls back to the account phone. */
  phone?: string | null
  fallbackPhone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  /** Governorate — normally `user_addresses.state`, with `.city` as a fallback. */
  governorate?: string | null
  city?: string | null
  deliveryInstructions?: string | null
  items: EgyptPostOrderItemInput[]
  /** Distinct seller business names on this order. */
  sellerNames: string[]
}

/** kg is the unit `shipments.package_weight` and this batch default are stored in. */
const GRAMS_PER_KG = 1000

export interface EgyptPostBatchDefaults {
  /** Applied when an order's `packageWeightKg` is not set. */
  weightKg: number
  volume: PackageVolume
  merchantCode: string
  merchantName: string
  warehouseName: string
}

export interface EgyptPostRowError {
  orderId: string
  orderNumber: string
  reason: string
}

export type EgyptPostRowResult =
  | { row: EgyptPostRow; error?: undefined }
  | { row?: undefined; error: EgyptPostRowError }

/**
 * Normalizes an Egyptian mobile number to `01XXXXXXXXX` (11 digits). Accepts
 * `+20`/`0020`/bare `20` country-code prefixes and strips spaces/dashes/
 * parens. Returns null for anything that isn't recognizably an Egyptian
 * mobile — including 10-digit landlines, which don't start with `1` once
 * the country code is removed.
 */
export function normalizeEgyptianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null

  let digits = raw.replace(/\D/g, '')

  if (digits.startsWith('0020')) {
    digits = digits.slice(4)
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = digits.slice(2)
  }

  if (digits.length === 10 && digits.startsWith('1')) {
    digits = `0${digits}`
  }

  if (digits.length !== 11 || !digits.startsWith('01')) return null

  return digits
}

/**
 * `payment_status` values that mean nothing is due on delivery. Mirrors
 * `isSettled()` in apps/shipping/lib/shipping-status.ts — duplicated here
 * (rather than imported) because this package has no dependency on that
 * app. Keep the two in sync if either changes.
 */
function isSettled(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === 'paid' || paymentStatus === 'collected'
}

/** `Total_Weight` must be in grams — round to the nearest whole gram. */
function kgToGrams(weightKg: number): number {
  return Math.round(weightKg * GRAMS_PER_KG)
}

function buildDescription(items: EgyptPostOrderItemInput[]): string {
  const description = items.map((item) => `${item.quantity}× ${item.productName}`).join(', ')
  return description.length > MAX_DESCRIPTION_LENGTH
    ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 3)}...`
    : description
}

function buildStreet(addressLine1: string | null | undefined, addressLine2: string | null | undefined): string {
  return addressLine2 ? `${addressLine1 ?? ''}, ${addressLine2}` : (addressLine1 ?? '')
}

function buildSpecialNotes(
  deliveryInstructions: string | null | undefined,
  orderNotes: string | null | undefined
): string {
  return [deliveryInstructions, orderNotes].filter((value): value is string => Boolean(value?.trim())).join(' — ')
}

/**
 * Maps one order onto an Egypt Post sheet row, or reports why it can't be
 * mapped. Never throws — `bulkAssignProvider` collects every error across a
 * batch and blocks the whole assignment rather than shipping a partially
 * broken sheet.
 */
export function toEgyptPostRow(
  order: EgyptPostOrderInput,
  index: number,
  defaults: EgyptPostBatchDefaults
): EgyptPostRowResult {
  const mobile = normalizeEgyptianMobile(order.phone) ?? normalizeEgyptianMobile(order.fallbackPhone)
  if (!mobile) {
    return {
      error: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        reason: `No valid Egyptian mobile number (got "${order.phone ?? order.fallbackPhone ?? ''}")`,
      },
    }
  }

  const canonicalGovernorate = normalizeGovernorate(order.governorate ?? order.city)
  const city = canonicalGovernorate ? EGYPT_POST_GOVERNORATES[canonicalGovernorate] : undefined
  if (!city) {
    return {
      error: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        reason: `Governorate "${order.governorate ?? order.city ?? ''}" is not recognized`,
      },
    }
  }

  const sellerName =
    order.sellerNames.length === 1 && order.sellerNames[0] ? order.sellerNames[0] : defaults.merchantName

  const row: EgyptPostRow = {
    Package_Serial: index + 1,
    Description: buildDescription(order.items),
    Total_Weight: kgToGrams(order.packageWeightKg ?? defaults.weightKg),
    Package_volume: defaults.volume,
    COD_Value: isSettled(order.paymentStatus) ? 0 : order.totalAmount,
    Item_Special_Notes: buildSpecialNotes(order.deliveryInstructions, order.orderNotes),
    Customer_Name: order.customerName ?? '',
    Mobile_No: mobile,
    Street: buildStreet(order.addressLine1, order.addressLine2),
    City: city,
    'Package_Ref. Number': order.orderNumber,
    Merchant_Name: defaults.merchantName,
    Warehouse_Name: defaults.warehouseName,
    HasPOD: 'FALSE',
    SellerName: sellerName,
    Post_Id: defaults.merchantCode,
  }

  return { row }
}

/**
 * Maps a whole batch. Returns every row it could build and every error it
 * hit — the caller decides whether any error blocks the batch.
 */
export function toEgyptPostRows(
  orders: EgyptPostOrderInput[],
  defaults: EgyptPostBatchDefaults
): { rows: EgyptPostRow[]; errors: EgyptPostRowError[] } {
  const rows: EgyptPostRow[] = []
  const errors: EgyptPostRowError[] = []

  // Package_Serial is the row's position in the actual output sheet, so it
  // only advances on success — an order that errors never consumes a serial
  // number. In practice this never comes up: bulkAssignProvider blocks the
  // whole batch when any order errors, so a sheet is only ever generated
  // once every order in it succeeded.
  let nextIndex = 0
  for (const order of orders) {
    const result = toEgyptPostRow(order, nextIndex, defaults)
    if (result.row) {
      rows.push(result.row)
      nextIndex += 1
    } else {
      errors.push(result.error)
    }
  }

  return { rows, errors }
}
