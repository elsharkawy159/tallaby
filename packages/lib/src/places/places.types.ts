/** Depth of a place: country → region (governorate, emirate…) → city or area. */
export type PlaceLevel = 'country' | 'region' | 'city'

/**
 * One place in the code-constant place dataset.
 *
 * Keys are paths: `EG` (ISO 3166-1 alpha-2), `EG/CAIRO` (region), `EG/CAIRO/nasr-city`
 * (city or area, lowercase kebab-case ASCII slug). Egypt region codes are the
 * `CAIRO_ORIGIN_RATES` governorate keys, so `normalizeGovernorate` maps 1:1.
 */
export type Place = {
  key: string
  level: PlaceLevel
  nameAr: string
  nameEn: string
  /** Other spellings in either script (geocoder forms, transliterations, short names). */
  aliases?: string[]
}

/** Compact data-file shape for a city: `[slug, nameAr, nameEn, ...aliases]`. */
export type CityRow = readonly [slug: string, nameAr: string, nameEn: string, ...aliases: string[]]

/** Compact data-file shape for a region and its cities. */
export type RegionRow = {
  code: string
  nameAr: string
  nameEn: string
  aliases?: string[]
  cities: readonly CityRow[]
}

/** Compact data-file shape for a country: `[iso2, nameAr, nameEn, ...aliases]`. */
export type CountryRow = readonly [iso2: string, nameAr: string, nameEn: string, ...aliases: string[]]
