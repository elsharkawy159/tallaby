import { normalizeGovernorate } from '../shipping/governorate.lib'
import { ARAB_WORLD } from './data/arab-world'
import { COUNTRIES, ISO3_TO_ISO2 } from './data/countries'
import { EGYPT_REGIONS } from './data/egypt'
import type { Place, PlaceLevel, RegionRow } from './places.types'

export const EGYPT = 'EG'

const SEPARATOR = '/'

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/**
 * Folds a place name for matching: lowercase, trim, Latin accents and Arabic
 * tashkeel/tatweel removed, أ/إ/آ→ا, ة→ه, ى→ي, Arabic-Indic digits → 0-9,
 * hyphens/underscores/dots and other punctuation → space, spaces collapsed.
 * Leading articles are kept here; see `articleVariants`.
 */
export function normalizePlaceText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Latin combining accents (é → e)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // tashkeel, hamza marks left by NFD, tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/['’`ʼ]/g, '')
    .replace(/[-_.,،؛;:()/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The text itself plus its form without a leading "al "/"el " or "ال". */
function articleVariants(n: string): string[] {
  const out = [n]
  const stripped = n.replace(/^(al|el) /, '').replace(/^ال(?=\S)/, '')
  if (stripped && stripped !== n) out.push(stripped)
  return out
}

/** Admin words people and geocoders wrap names in ("Cairo Governorate", "محافظة الجيزة", "Riyadh Region"). */
const ADMIN_WORDS =
  /^(محافظه|منطقه|اماره|ولايه|مدينه|madinet|medinet) | (governorate|gov|province|region|emirate|state|wilaya|district|city)$/g

function matchVariants(n: string): string[] {
  const out = new Set<string>()
  for (const v of [n, n.replace(ADMIN_WORDS, '').trim()]) {
    if (!v) continue
    for (const a of articleVariants(v)) out.add(a)
  }
  return [...out]
}

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

type Entry = { place: Place; order: number; egypt: boolean; terms: string[] }

const PLACES: Place[] = []
const BY_KEY = new Map<string, Place>()
const CHILDREN = new Map<string, Place[]>()
const ENTRIES: Entry[] = []

function add(place: Place): void {
  if (BY_KEY.has(place.key)) throw new Error(`Duplicate place key ${place.key}`)
  PLACES.push(place)
  BY_KEY.set(place.key, place)
  const parent = parentKey(place.key)
  if (parent) {
    const list = CHILDREN.get(parent) ?? []
    list.push(place)
    CHILDREN.set(parent, list)
  }
  const terms = new Set<string>()
  for (const name of [place.nameAr, place.nameEn, ...(place.aliases ?? [])]) {
    const n = normalizePlaceText(name)
    if (!n) continue
    for (const v of articleVariants(n)) terms.add(v)
  }
  ENTRIES.push({ place, order: ENTRIES.length, egypt: isEgypt(place.key), terms: [...terms] })
}

function addRegions(cc: string, regions: readonly RegionRow[]): void {
  for (const r of regions) {
    const regionKey = `${cc}${SEPARATOR}${r.code}`
    add({ key: regionKey, level: 'region', nameAr: r.nameAr, nameEn: r.nameEn, ...(r.aliases?.length ? { aliases: [...r.aliases] } : {}) })
    for (const [slug, nameAr, nameEn, ...aliases] of r.cities) {
      add({ key: `${regionKey}${SEPARATOR}${slug}`, level: 'city', nameAr, nameEn, ...(aliases.length ? { aliases } : {}) })
    }
  }
}

for (const [code, nameAr, nameEn, ...aliases] of COUNTRIES) {
  add({ key: code, level: 'country', nameAr, nameEn, ...(aliases.length ? { aliases } : {}) })
}
addRegions(EGYPT, EGYPT_REGIONS)
for (const [cc, regions] of Object.entries(ARAB_WORLD)) addRegions(cc, regions)

// Egypt's lists read in Arabic alphabetical order; everything else stays as listed.
const arabicCollator = new Intl.Collator('ar')
for (const [key, list] of CHILDREN) {
  if (isEgypt(key)) list.sort((a, b) => arabicCollator.compare(a.nameAr, b.nameAr))
}

const COUNTRY_LIST = PLACES.filter((p) => p.level === 'country')

function parentKey(key: string): string | null {
  const i = key.lastIndexOf(SEPARATOR)
  return i === -1 ? null : key.slice(0, i)
}

function isEgypt(key: string): boolean {
  return key === EGYPT || key.startsWith(EGYPT + SEPARATOR)
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getPlace(key: string): Place | undefined {
  return BY_KEY.get(key)
}

/** Self then ancestors: `EG/CAIRO/nasr-city` → `['EG/CAIRO/nasr-city', 'EG/CAIRO', 'EG']`. */
export function placeChain(key: string): string[] {
  const chain: string[] = []
  for (let k: string | null = key; k; k = parentKey(k)) chain.push(k)
  return chain
}

/** Direct children (Arabic order inside Egypt, as listed elsewhere). */
export function childrenOf(key: string): Place[] {
  return [...(CHILDREN.get(key) ?? [])]
}

/** Every place, countries first (Egypt first), then regions and cities. */
export function allPlaces(): Place[] {
  return [...PLACES]
}

/** Every ISO 3166-1 country, Egypt first. */
export function allCountries(): Place[] {
  return [...COUNTRY_LIST]
}

/**
 * Display label with the parent for context: city → "Nasr City · Cairo";
 * non-Egypt region → "Dubai · United Arab Emirates"; Egypt regions and countries → name alone.
 */
export function placeLabel(key: string, locale: string): string {
  const place = BY_KEY.get(key)
  if (!place) return key
  const ar = locale.startsWith('ar')
  const name = (p: Place) => (ar ? p.nameAr : p.nameEn)
  const parent = parentKey(key)
  const parentPlace = parent ? BY_KEY.get(parent) : undefined
  if (!parentPlace) return name(place)
  if (place.level === 'city' || !isEgypt(key)) return `${name(place)} · ${name(parentPlace)}`
  return name(place)
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const LEVEL_RANK: Record<PlaceLevel, number> = { country: 0, region: 1, city: 2 }

type Scored = { entry: Entry; score: number; length: number }

function scoreEntry(entry: Entry, queries: string[]): Scored | null {
  let best = 0
  let length = Infinity
  for (const t of entry.terms) {
    for (const q of queries) {
      const s = t === q ? 3 : t.startsWith(q) ? 2 : t.includes(q) ? 1 : 0
      if (s > best || (s === best && s > 0 && t.length < length)) {
        best = s
        length = t.length
      }
    }
  }
  return best > 0 ? { entry, score: best, length } : null
}

function compareScored(a: Scored, b: Scored): number {
  return (
    b.score - a.score ||
    Number(b.entry.egypt) - Number(a.entry.egypt) ||
    LEVEL_RANK[a.entry.place.level] - LEVEL_RANK[b.entry.place.level] ||
    a.length - b.length ||
    a.entry.order - b.entry.order
  )
}

function inScope(key: string, within: string | undefined, levels: PlaceLevel[] | undefined, level: PlaceLevel): boolean {
  if (within && !key.startsWith(within + SEPARATOR)) return false
  if (levels && !levels.includes(level)) return false
  return true
}

/**
 * Search places by Arabic or English name or alias. Ranking: exact > prefix > contains,
 * then Egypt before other countries, then country > region > city, then shorter names.
 */
export function searchPlaces(
  query: string,
  opts: { limit?: number; within?: string; levels?: PlaceLevel[] } = {},
): Place[] {
  const n = normalizePlaceText(query)
  if (!n) return []
  const queries = articleVariants(n)
  const limit = opts.limit ?? 20
  const hits: Scored[] = []
  for (const entry of ENTRIES) {
    if (!inScope(entry.place.key, opts.within, opts.levels, entry.place.level)) continue
    const scored = scoreEntry(entry, queries)
    if (scored) hits.push(scored)
  }
  return hits.sort(compareScored).slice(0, limit).map((h) => h.entry.place)
}

// ---------------------------------------------------------------------------
// Address resolution
// ---------------------------------------------------------------------------

/** First place (in data order) at `level` under `within` whose name or alias equals `text`. */
function exactMatch(text: string | null | undefined, within: string, level: PlaceLevel): Place | null {
  const n = normalizePlaceText(text ?? '')
  if (!n) return null
  const queries = matchVariants(n)
  for (const entry of ENTRIES) {
    if (!inScope(entry.place.key, within, [level], entry.place.level)) continue
    if (entry.terms.some((t) => queries.includes(t))) return entry.place
  }
  return null
}

/** Exact match first, then the best prefix match (no "contains" guesses). */
function bestMatch(text: string | null | undefined, within: string, level: PlaceLevel): Place | null {
  const exact = exactMatch(text, within, level)
  if (exact) return exact
  const n = normalizePlaceText(text ?? '')
  if (n.length < 3) return null
  const queries = matchVariants(n)
  const hits: Scored[] = []
  for (const entry of ENTRIES) {
    if (!inScope(entry.place.key, within, [level], entry.place.level)) continue
    const scored = scoreEntry(entry, queries)
    if (scored && scored.score >= 2) hits.push(scored)
  }
  return hits.sort(compareScored)[0]?.entry.place ?? null
}

function resolveCountry(text: string | null | undefined): string | null {
  const raw = text?.trim() ?? ''
  if (!raw) return EGYPT
  if (/^[a-z]{2}$/i.test(raw)) {
    const code = raw.toUpperCase()
    if (BY_KEY.get(code)?.level === 'country') return code
  }
  if (/^[a-z]{3}$/i.test(raw)) {
    const code = ISO3_TO_ISO2[raw.toUpperCase()]
    if (code) return code
  }
  return bestMatch(raw, '', 'country')?.key ?? null
}

function resolveRegion(country: string, state: string | null | undefined): string | null {
  if (!state?.trim()) return null
  if (country === EGYPT && normalizePlaceText(state).length >= 3) {
    const g = normalizeGovernorate(state)
    const key = g ? `${EGYPT}${SEPARATOR}${g}` : null
    if (key && BY_KEY.has(key)) return key
  }
  return bestMatch(state, country, 'region')?.key ?? null
}

function resolveCity(scope: string, addr: { city?: string | null; addressLine1?: string | null }): string | null {
  const direct = exactMatch(addr.city, scope, 'city')
  if (direct) return direct.key
  for (const part of (addr.addressLine1 ?? '').split(/[,،]/)) {
    const hit = exactMatch(part, scope, 'city')
    if (hit) return hit.key
  }
  return null
}

/**
 * The most specific place key for a free-text address, or null when the country
 * text is not recognised. Empty country → Egypt (the address default).
 * Egypt regions go through `normalizeGovernorate`, so they match marketplace pricing.
 */
export function resolveAddressPlace(addr: {
  country?: string | null
  state?: string | null
  city?: string | null
  addressLine1?: string | null
}): string | null {
  const country = resolveCountry(addr.country)
  if (!country) return null

  const region = resolveRegion(country, addr.state)
  if (region) return resolveCity(region, addr) ?? region

  // No region: find the city anywhere in the country, or a region typed into the city field.
  const city = resolveCity(country, addr)
  if (city) return city
  const regionFromCity = exactMatch(addr.city, country, 'region')
  return regionFromCity?.key ?? country
}
