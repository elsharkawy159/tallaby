import { z } from 'zod'
import { childrenOf, EGYPT, getPlace, normalizePlaceText } from '../places'
import { GOVERNORATE_NAME_ALIASES, normalizeGovernorate } from './governorate.lib'

/**
 * The simple checkout form (ROADMAP.md F-64): one line of address, with the
 * governorate read from it. Pure; the server runs this before saving, so a
 * client can't choose a delivery price by sending a state.
 *
 * Anything unclear asks the customer, because a wrong guess bills a wrong price.
 */

export const CHECKOUT_ADDRESS_MAX = 200
export const CHECKOUT_ADDRESS_MIN = 5
const NAME_MAX = 100
const NAME_MIN_LETTERS = 4
const PHONE_RE = /^(?:\+20|20|0)?1[0125][0-9]{8}$/

export type GovernorateMatch =
  | { kind: 'one'; code: string; cityKey: string | null }
  | { kind: 'none' }
  | { kind: 'many'; codes: string[] }

/** A name right after these is a street, not where the customer lives ("شارع الجيزة"). */
const BEFORE_IS_STREET = /(?:^| )(?:شارع|ش|طريق|ميدان|كوبري|كورنيش|محور|عماره|برج|ابراج)(?: ال)? $/
/** The same in English, where the street word comes after ("Cairo Road"). */
const AFTER_IS_STREET = /^ (?:st|street|rd|road|sq|square|ave|avenue|bridge|tower|towers)(?: |$)/

type Term = { term: string; code: string }

/** Article and admin-word free forms of a name, as `normalizePlaceText` folds them. */
function termsOf(name: string): string[] {
  const folded = normalizePlaceText(name)
  const out = new Set([folded])
  const bare = folded.replace(/^(al|el|as|ash|ad) /, '').replace(/^ال(?=\S)/, '')
  if (bare.length >= 3) out.add(bare)
  return [...out].filter((t) => t.length >= 3)
}

let governorateTerms: Term[] | null = null
let cityTerms: (Term & { key: string })[] | null = null

function regionCode(key: string): string {
  return key.split('/')[1] ?? ''
}

function loadGovernorateTerms(): Term[] {
  if (governorateTerms) return governorateTerms
  const seen = new Map<string, string>()
  const add = (name: string, code: string) => {
    for (const term of termsOf(name)) if (!seen.has(term)) seen.set(term, code)
  }
  for (const region of childrenOf(EGYPT)) {
    const code = regionCode(region.key)
    add(region.nameAr, code)
    add(region.nameEn, code)
    for (const alias of region.aliases ?? []) add(alias, code)
  }
  for (const [alias, code] of Object.entries(GOVERNORATE_NAME_ALIASES)) add(alias, code)
  // Longest first, so "south sinai" is found before anything shorter inside it.
  governorateTerms = [...seen].map(([term, code]) => ({ term, code })).sort((a, b) => b.term.length - a.term.length)
  return governorateTerms
}

function loadCityTerms(): (Term & { key: string })[] {
  if (cityTerms) return cityTerms
  const out: (Term & { key: string })[] = []
  for (const region of childrenOf(EGYPT)) {
    for (const city of childrenOf(region.key)) {
      for (const name of [city.nameAr, city.nameEn, ...(city.aliases ?? [])]) {
        for (const term of termsOf(name)) out.push({ term, code: regionCode(region.key), key: city.key })
      }
    }
  }
  cityTerms = out.sort((a, b) => b.term.length - a.term.length)
  return cityTerms
}

/** Whole-word positions of `term` in ` text `, with what's before and after each. */
function findWord(padded: string, term: string): { before: string; after: string }[] {
  const needle = ` ${term} `
  const hits: { before: string; after: string }[] = []
  let at = padded.indexOf(needle)
  while (at !== -1) {
    hits.push({ before: padded.slice(0, at + 1), after: padded.slice(at + needle.length - 1) })
    at = padded.indexOf(needle, at + 1)
  }
  return hits
}

const isStreetName = (hit: { before: string; after: string }) =>
  BEFORE_IS_STREET.test(hit.before) || AFTER_IS_STREET.test(hit.after)

/** The governorate an address names, a city or area it names, or that it's unclear. */
export function matchGovernorateInText(text: string | null | undefined): GovernorateMatch {
  const folded = normalizePlaceText(text ?? '')
  if (!folded) return { kind: 'none' }
  let padded = ` ${folded} `

  const named = new Set<string>()
  for (const { term, code } of loadGovernorateTerms()) {
    const hits = findWord(padded, term)
    if (hits.length === 0) continue
    if (hits.some((hit) => !isStreetName(hit))) named.add(code)
    // Taken, so a shorter name inside it can't match too.
    padded = padded.split(` ${term} `).join('   ')
  }

  const citiesByRegion = new Map<string, string>()
  const fullText = ` ${folded} `
  for (const { term, code, key } of loadCityTerms()) {
    if (term.length < 4) continue
    const hits = findWord(fullText, term)
    if (hits.length === 0 || hits.every(isStreetName)) continue
    if (!citiesByRegion.has(code)) citiesByRegion.set(code, key)
  }

  if (named.size > 1) return { kind: 'many', codes: [...named] }
  if (named.size === 1) {
    const code = [...named][0]!
    const cityKey = citiesByRegion.get(code) ?? null
    // A city found only in other governorates contradicts the one named here.
    if (!cityKey && citiesByRegion.size > 0) return { kind: 'many', codes: [code, ...citiesByRegion.keys()] }
    return { kind: 'one', code, cityKey }
  }
  if (citiesByRegion.size === 1) {
    const [[code, cityKey]] = [...citiesByRegion] as [[string, string]]
    return { kind: 'one', code, cityKey }
  }
  if (citiesByRegion.size > 1) return { kind: 'many', codes: [...citiesByRegion.keys()] }
  return { kind: 'none' }
}

/** A value from the picker or the location button: only a real Egyptian governorate counts. */
export function validGovernorate(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (getPlace(`${EGYPT}/${trimmed}`)) return trimmed
  // Geocoder text ("Cairo Governorate", "محافظة القاهرة"): matched whole, never partly.
  const match = matchGovernorateInText(trimmed)
  if (match.kind === 'one' && !match.cityKey) return match.code
  const normalized = normalizeGovernorate(trimmed)
  return normalized && getPlace(`${EGYPT}/${normalized}`) && match.kind !== 'many' ? normalized : null
}

export type ResolvedGovernorate = { code: string; cityKey: string | null } | null

/**
 * The address's own text wins when it's clear. Otherwise the customer's picker,
 * then the location button's state. Null means the customer must choose.
 */
export function resolveCheckoutGovernorate(input: {
  address: string
  picked?: string | null
  locationState?: string | null
}): ResolvedGovernorate {
  const match = matchGovernorateInText(input.address)
  if (match.kind === 'one') return { code: match.code, cityKey: match.cityKey }
  const code = validGovernorate(input.picked) ?? validGovernorate(input.locationState)
  return code ? { code, cityKey: null } : null
}

export const checkoutAddressInputSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  governorate: z.string().nullish(),
  locationState: z.string().max(100).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
})
export type CheckoutAddressInput = z.input<typeof checkoutAddressInputSchema>

export type CheckoutAddressField = 'fullName' | 'phone' | 'address' | 'governorate'

export type ParsedCheckoutAddress =
  | {
      ok: true
      value: {
        fullName: string
        phone: string
        addressLine1: string
        state: string
        city: string
        country: 'Egypt'
        latitude: number | null
        longitude: number | null
      }
    }
  | { ok: false; errors: CheckoutAddressField[]; needsGovernorate: boolean }

/** The place's own name, which `resolveAddressPlace` can read back. */
function placeName(key: string, locale: string): string {
  const place = getPlace(key)
  if (!place) return ''
  return locale === 'ar' ? place.nameAr : place.nameEn
}

/** Checks the form and works out the columns `user_addresses` needs. */
export function parseCheckoutAddress(raw: unknown, locale: string): ParsedCheckoutAddress {
  const parsed = checkoutAddressInputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, errors: ['fullName', 'phone', 'address'], needsGovernorate: false }
  const input = parsed.data

  const errors: CheckoutAddressField[] = []
  const fullName = input.fullName.trim().replace(/\s+/g, ' ')
  if (fullName.length > NAME_MAX || (fullName.match(/\p{L}/gu) ?? []).length < NAME_MIN_LETTERS) errors.push('fullName')

  const phone = input.phone.replace(/[\s-]/g, '').replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  if (!PHONE_RE.test(phone)) errors.push('phone')

  const addressLine1 = input.address.trim().replace(/\s+/g, ' ')
  const addressOk = addressLine1.length >= CHECKOUT_ADDRESS_MIN && addressLine1.length <= CHECKOUT_ADDRESS_MAX
  if (!addressOk) errors.push('address')

  // Only an address worth saving asks for a governorate.
  const resolved = addressOk
    ? resolveCheckoutGovernorate({ address: addressLine1, picked: input.governorate, locationState: input.locationState })
    : null
  const needsGovernorate = addressOk && !resolved
  if (needsGovernorate) errors.push('governorate')
  if (errors.length > 0 || !resolved) return { ok: false, errors, needsGovernorate }

  return {
    ok: true,
    value: {
      fullName,
      phone,
      addressLine1,
      state: resolved.code,
      city: placeName(resolved.cityKey ?? `${EGYPT}/${resolved.code}`, locale),
      country: 'Egypt',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    },
  }
}

/** The one line the form shows for a saved address, from whichever columns it has. */
export function savedAddressLine(address: {
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
}): string {
  const line = [address.addressLine1, address.addressLine2]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join('، ')
  const city = address.city?.trim()
  if (!city) return line
  return normalizePlaceText(line).includes(normalizePlaceText(city)) ? line : `${line}، ${city}`
}
