import { CAIRO_ORIGIN_RATES } from './shipping-rates'

const CANONICAL_GOVERNORATES = Object.keys(CAIRO_ORIGIN_RATES)

/** Maps normalized alias strings to canonical governorate keys */
const GOVERNORATE_ALIASES: Record<string, string> = {
  // Cairo
  CAIRO: 'CAIRO',
  'AL QAHIRAH': 'CAIRO',
  'AL QAHIRA': 'CAIRO',
  QAHIRA: 'CAIRO',
  'القاهرة': 'CAIRO',
  'CAIRO GOVERNORATE': 'CAIRO',

  // Giza
  GIZA: 'GIZA',
  'AL JIZAH': 'GIZA',
  'AL GIZA': 'GIZA',
  JIZAH: 'GIZA',
  'الجيزة': 'GIZA',
  'GIZA GOVERNORATE': 'GIZA',

  // Qalyubia
  QALIUBIA: 'QALIUBIA',
  QALYUBIA: 'QALIUBIA',
  'AL QALYUBIA': 'QALIUBIA',
  'AL QALIUBIYA': 'QALIUBIA',
  // Geocoder spelling ("Al Qalyubiya") — seen verbatim in a live user_addresses.state value.
  'AL QALYUBIYA': 'QALIUBIA',
  'القليوبية': 'QALIUBIA',
  'QALYUBIA GOVERNORATE': 'QALIUBIA',

  // Kafr El Sheikh
  'KAFR EL SHEIKH': 'KAFR EL SHEIKH',
  'KAFR EL-SHEIKH': 'KAFR EL SHEIKH',
  'KAF EL SHEIKH': 'KAFR EL SHEIKH',
  'كفر الشيخ': 'KAFR EL SHEIKH',

  // Sharqia
  SHARKIA: 'SHARKIA',
  SHARQIA: 'SHARKIA',
  'ASH SHARQIA': 'SHARKIA',
  'AL SHARQIA': 'SHARKIA',
  'AL SHARQIYA': 'SHARKIA',
  'الشرقية': 'SHARKIA',

  // Alexandria
  ALEXANDRIA: 'ALEXANDRIA',
  'AL ISKANDARIYAH': 'ALEXANDRIA',
  ISKANDARIYAH: 'ALEXANDRIA',
  'ALEXANDRIA GOVERNORATE': 'ALEXANDRIA',
  'الإسكندرية': 'ALEXANDRIA',

  // Beheira
  BEHEIRA: 'BEHEIRA',
  BEHIRA: 'BEHEIRA',
  'AL BEHEIRA': 'BEHEIRA',
  'AL BUHAIRAH': 'BEHEIRA',
  'AL BEHEIRAH': 'BEHEIRA',
  'البحيرة': 'BEHEIRA',

  // Gharbia
  GHARBIA: 'GHARBIA',
  'AL GHARBIA': 'GHARBIA',
  'AL GHARBIYA': 'GHARBIA',
  'الغربية': 'GHARBIA',

  // Monufia
  MONUFIA: 'MONUFIA',
  MONOUFIA: 'MONUFIA',
  'AL MONUFIA': 'MONUFIA',
  'AL MINUFIA': 'MONUFIA',
  'AL MINUFIYA': 'MONUFIA',
  'المنوفية': 'MONUFIA',

  // Damietta
  DAMIETTA: 'DAMIETTA',
  DOMITTA: 'DAMIETTA',
  DUMYAT: 'DAMIETTA',
  'AL DAMIETTA': 'DAMIETTA',
  'دمياط': 'DAMIETTA',

  // Dakahlia
  DAKAHLIA: 'DAKAHLIA',
  'AL DAKAHLIA': 'DAKAHLIA',
  'AL DAQAHLIYA': 'DAKAHLIA',
  'الدقهلية': 'DAKAHLIA',

  // Ismailia
  ISMAILIA: 'ISMAILIA',
  'AL ISMAILIA': 'ISMAILIA',
  'AL ISMAILIYA': 'ISMAILIA',
  'الإسماعيلية': 'ISMAILIA',

  // Suez
  SUEZ: 'SUEZ',
  'AS SUWAYS': 'SUEZ',
  SUWAYS: 'SUEZ',
  'السويس': 'SUEZ',

  // Port Said
  'PORT SAID': 'PORT SAID',
  'PORT-SAID': 'PORT SAID',
  'BUR SAID': 'PORT SAID',
  'بورسعيد': 'PORT SAID',

  // Fayoum
  FAYOUM: 'FAYOUM',
  FAYUM: 'FAYOUM',
  'AL FAYOUM': 'FAYOUM',
  'AL FAYUM': 'FAYOUM',
  'AL FAYYUM': 'FAYOUM',
  'الفيوم': 'FAYOUM',

  // Beni Suef
  'BENI SUEF': 'BENI SUEF',
  'BANI SWEIF': 'BENI SUEF',
  'BANI SWIEF': 'BENI SUEF',
  'BANI SUEF': 'BENI SUEF',
  'BENI SUEIF': 'BENI SUEF',
  'BANISWUEF': 'BENI SUEF',
  'BANI-SWIEF': 'BENI SUEF',
  'بني سويف': 'BENI SUEF',

  // Minya
  MINYA: 'MINYA',
  MENIA: 'MINYA',
  MINIA: 'MINYA',
  'AL MINYA': 'MINYA',
  'AL MINIA': 'MINYA',
  'المنيا': 'MINYA',

  // Assiut
  ASSIUT: 'ASSIUT',
  ASYUT: 'ASSIUT',
  'AL ASSIUT': 'ASSIUT',
  'AL ASYUT': 'ASSIUT',
  'أسيوط': 'ASSIUT',

  // Sohag
  SOHAG: 'SOHAG',
  SOUHAGE: 'SOHAG',
  SOHAJ: 'SOHAG',
  'AL SOHAG': 'SOHAG',
  'سوهاج': 'SOHAG',

  // Qena
  QENA: 'QENA',
  QINA: 'QENA',
  'AL QENA': 'QENA',
  'قنا': 'QENA',

  // Aswan
  ASWAN: 'ASWAN',
  'AL ASWAN': 'ASWAN',
  'أسوان': 'ASWAN',

  // Luxor
  LUXOR: 'LUXOR',
  LOUXOR: 'LUXOR',
  'AL UQSUR': 'LUXOR',
  UQSUR: 'LUXOR',
  'الأقصر': 'LUXOR',

  // Red Sea
  'RED SEA': 'RED SEA',
  'AL BAHR AL AHMAR': 'RED SEA',
  'BAHR AL AHMAR': 'RED SEA',
  'البحر الأحمر': 'RED SEA',

  // Marsa Matrouh
  'MARSA MATROUH': 'MARSA MATROUH',
  'MARSa MATROUH': 'MARSA MATROUH',
  MATROUH: 'MARSA MATROUH',
  'AL MATROUH': 'MARSA MATROUH',
  'مرسى مطروح': 'MARSA MATROUH',

  // New Valley
  'NEW VALLEY': 'NEW VALLEY',
  'NEW VALLLEY': 'NEW VALLEY',
  'AL WADI AL JADID': 'NEW VALLEY',
  'WADI AL JADID': 'NEW VALLEY',
  'الوادي الجديد': 'NEW VALLEY',

  // North Sinai
  'NORTH SINAI': 'NORTH SINAI',
  'NOURTH SINAI': 'NORTH SINAI',
  'SHAMAL SINAA': 'NORTH SINAI',
  'SHIMAL SINAA': 'NORTH SINAI',
  'شمال سيناء': 'NORTH SINAI',

  // South Sinai
  'SOUTH SINAI': 'SOUTH SINAI',
  'JANUB SINAA': 'SOUTH SINAI',
  'JANUB SINA': 'SOUTH SINAI',
  'جنوب سيناء': 'SOUTH SINAI',
}

function normalizeInput(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[.,']/g, '')
    .replace(/\sGOVERNORATE$/i, '')
    .replace(/\sGOV\.?$/i, '')
}

/**
 * Normalizes a free-text governorate/state value to a canonical rate-table key.
 */
export function normalizeGovernorate(raw: string | null | undefined): string | null {
  if (!raw?.trim()) {
    return null
  }

  const normalized = normalizeInput(raw)

  if (GOVERNORATE_ALIASES[normalized]) {
    return GOVERNORATE_ALIASES[normalized]
  }

  if (CANONICAL_GOVERNORATES.includes(normalized)) {
    return normalized
  }

  // Partial match against canonical names (e.g. "Greater Cairo" won't match, but "Cairo" substring might)
  for (const canonical of CANONICAL_GOVERNORATES) {
    if (normalized.includes(canonical) || canonical.includes(normalized)) {
      return canonical
    }
  }

  for (const [alias, canonical] of Object.entries(GOVERNORATE_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return canonical
    }
  }

  return null
}
