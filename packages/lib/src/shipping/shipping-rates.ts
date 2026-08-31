export const SHIPPING_ORIGIN = 'CAIRO' as const

export const FEE_MULTIPLIER = 1.14
export const EXTRA_KG_RATE = 7
export const ROUND_TO = 5

/** Fallback base rate (before fees) when governorate cannot be matched */
export const FALLBACK_BASE_RATE = 110

/** Base rates from Cairo for the first 1 kg, keyed by canonical governorate name */
export const CAIRO_ORIGIN_RATES: Record<string, number> = {
  CAIRO: 55,
  GIZA: 55,
  QALIUBIA: 55,
  'KAFR EL SHEIKH': 65,
  SHARKIA: 65,
  ALEXANDRIA: 65,
  BEHEIRA: 65,
  GHARBIA: 65,
  MONUFIA: 65,
  DAMIETTA: 65,
  DAKAHLIA: 65,
  ISMAILIA: 70,
  SUEZ: 70,
  'PORT SAID': 70,
  FAYOUM: 75,
  'BENI SUEF': 75,
  MINYA: 75,
  ASSIUT: 75,
  SOHAG: 100,
  QENA: 100,
  ASWAN: 100,
  LUXOR: 100,
  'RED SEA': 100,
  'MARSA MATROUH': 110,
  'NEW VALLEY': 110,
  'NORTH SINAI': 110,
  'SOUTH SINAI': 110,
}
