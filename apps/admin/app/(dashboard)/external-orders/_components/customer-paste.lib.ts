/**
 * Turns the free-form customer details people paste from WhatsApp/Messenger
 * (Arabic or English, labelled or not) into external-order form fields.
 *
 *   الإسم: خالد غانم
 *   العنوان بوابة 8 الشارع المقابل لصيدلية فضه
 *   مستشفى العجمي التخصصي
 *   الإسكندرية
 *   رقم التليفون للتواصل
 *   01024715570
 */

export interface ParsedCustomerPaste {
  fullName: string
  phone: string
  /** Any further mobile numbers found after the first. */
  extraPhones: string[]
  addressLine1: string
  addressLine2: string
  city: string
  /** Canonical governorate key (e.g. `ALEXANDRIA`), '' when not detected. */
  state: string
  notes: string
}

/** Arabic display names keyed by the canonical governorate value. */
export const GOVERNORATE_AR: Record<string, string> = {
  CAIRO: 'القاهرة',
  GIZA: 'الجيزة',
  QALIUBIA: 'القليوبية',
  'KAFR EL SHEIKH': 'كفر الشيخ',
  SHARKIA: 'الشرقية',
  ALEXANDRIA: 'الإسكندرية',
  BEHEIRA: 'البحيرة',
  GHARBIA: 'الغربية',
  MONUFIA: 'المنوفية',
  DAMIETTA: 'دمياط',
  DAKAHLIA: 'الدقهلية',
  ISMAILIA: 'الإسماعيلية',
  SUEZ: 'السويس',
  'PORT SAID': 'بورسعيد',
  FAYOUM: 'الفيوم',
  'BENI SUEF': 'بني سويف',
  MINYA: 'المنيا',
  ASSIUT: 'أسيوط',
  SOHAG: 'سوهاج',
  QENA: 'قنا',
  ASWAN: 'أسوان',
  LUXOR: 'الأقصر',
  'RED SEA': 'البحر الأحمر',
  'MARSA MATROUH': 'مطروح',
  'NEW VALLEY': 'الوادي الجديد',
  'NORTH SINAI': 'شمال سيناء',
  'SOUTH SINAI': 'جنوب سيناء',
}

/** Extra spellings of governorate names beyond `GOVERNORATE_AR` and the key. */
const GOVERNORATE_ALIASES: Record<string, string[]> = {
  CAIRO: ['القاهره', 'cairo', 'qahira'],
  GIZA: ['الجيزه', 'جيزة', 'giza', 'gizah'],
  QALIUBIA: ['القليوبيه', 'qalyubia', 'qalyoubia', 'kalyobia'],
  'KAFR EL SHEIKH': ['كفر الشيخ', 'kafr el sheikh', 'kafr elsheikh'],
  SHARKIA: ['الشرقيه', 'sharqia', 'sharkia', 'sharkeya'],
  ALEXANDRIA: ['اسكندرية', 'اسكندريه', 'الاسكندريه', 'إسكندرية', 'alexandria', 'alex'],
  BEHEIRA: ['البحيره', 'beheira', 'behira'],
  GHARBIA: ['الغربيه', 'gharbia', 'gharbeya'],
  MONUFIA: ['المنوفيه', 'menofia', 'monufia', 'menoufia'],
  DAMIETTA: ['damietta', 'domyat'],
  DAKAHLIA: ['الدقهليه', 'dakahlia', 'daqahlia', 'dakahleya'],
  ISMAILIA: ['الاسماعيليه', 'ismailia'],
  SUEZ: ['suez'],
  'PORT SAID': ['بور سعيد', 'port said', 'portsaid'],
  FAYOUM: ['fayoum', 'faiyum'],
  'BENI SUEF': ['بنى سويف', 'beni suef', 'bani suef'],
  MINYA: ['minya', 'menya'],
  ASSIUT: ['اسيوط', 'assiut', 'asyut'],
  SOHAG: ['sohag'],
  QENA: ['qena'],
  ASWAN: ['اسوان', 'aswan'],
  LUXOR: ['الاقصر', 'luxor'],
  'RED SEA': ['البحر الاحمر', 'red sea'],
  'MARSA MATROUH': ['مرسى مطروح', 'مرسي مطروح', 'matrouh', 'marsa matrouh'],
  'NEW VALLEY': ['new valley'],
  'NORTH SINAI': ['north sinai'],
  'SOUTH SINAI': ['south sinai'],
}

/**
 * Well-known districts/cities, so an address that only says "العجمي" or
 * "مدينة نصر" still lands on the right governorate and fills City / Area.
 */
const AREA_GOVERNORATE: Record<string, string[]> = {
  CAIRO: [
    'مدينة نصر', 'مصر الجديدة', 'المعادي', 'حلوان', 'المقطم', 'التجمع الخامس',
    'التجمع', 'القاهرة الجديدة', 'الرحاب', 'مدينتي', 'الشروق', 'شبرا',
    'المطرية', 'عين شمس', 'الزيتون', 'حدائق القبة', 'السيدة زينب', 'الزمالك',
    'وسط البلد', 'المرج', 'النزهة', 'البساتين', 'المعصرة', 'العباسية',
    'دار السلام', 'روض الفرج', 'الزاوية الحمراء', 'nasr city', 'heliopolis',
    'maadi', 'new cairo', 'tagamoa', 'zamalek', 'rehab', 'madinaty',
  ],
  GIZA: [
    'الدقي', 'المهندسين', 'العجوزة', 'الهرم', 'فيصل', '6 أكتوبر', 'اكتوبر',
    'الشيخ زايد', 'إمبابة', 'بولاق الدكرور', 'الوراق', 'حدائق الأهرام',
    'البدرشين', 'العياط', 'الحوامدية', 'أوسيم', 'كرداسة', 'dokki',
    'mohandessin', 'haram', 'october', 'sheikh zayed',
  ],
  QALIUBIA: [
    'شبرا الخيمة', 'بنها', 'قليوب', 'القناطر الخيرية', 'الخانكة', 'العبور',
    'طوخ', 'شبين القناطر', 'الخصوص', 'obour', 'banha',
  ],
  ALEXANDRIA: [
    'العجمي', 'سموحة', 'المنتزه', 'سيدي بشر', 'ميامي', 'العصافرة', 'المندرة',
    'ستانلي', 'كليوباترا', 'محرم بك', 'العامرية', 'برج العرب', 'الهانوفيل',
    'البيطاش', 'الأنفوشي', 'لوران', 'جليم', 'سيدي جابر', 'كامب شيزار',
    'الإبراهيمية', 'أبو قير', 'الدخيلة', 'الورديان', 'القباري', 'الشاطبي',
    'فيكتوريا', 'سان ستيفانو', 'باكوس', 'المعمورة', 'agami', 'smouha',
    'sidi bishr', 'miami', 'montaza', 'borg el arab',
  ],
  DAKAHLIA: [
    'المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'السنبلاوين', 'المنزلة', 'بلقاس',
    'mansoura',
  ],
  GHARBIA: [
    'طنطا', 'المحلة الكبرى', 'المحلة', 'كفر الزيات', 'زفتى', 'السنطة', 'سمنود',
    'tanta', 'mahalla',
  ],
  SHARKIA: [
    'الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'أبو حماد', 'فاقوس',
    'ههيا', 'أبو كبير', 'ديرب نجم', 'zagazig', '10th of ramadan',
  ],
  MONUFIA: [
    'شبين الكوم', 'منوف', 'مدينة السادات', 'أشمون', 'قويسنا', 'الباجور',
    'بركة السبع', 'shebin el kom',
  ],
  BEHEIRA: [
    'دمنهور', 'كفر الدوار', 'رشيد', 'إيتاي البارود', 'أبو حمص', 'كوم حمادة',
    'وادي النطرون', 'damanhour',
  ],
  'KAFR EL SHEIKH': ['دسوق', 'بيلا', 'سيدي سالم', 'مطوبس', 'الحامول'],
  DAMIETTA: ['رأس البر', 'دمياط الجديدة', 'فارسكور', 'كفر سعد', 'ras el bar'],
  ISMAILIA: ['القنطرة', 'فايد', 'التل الكبير'],
  'PORT SAID': ['بورفؤاد', 'بور فؤاد'],
  FAYOUM: ['سنورس', 'إطسا', 'طامية'],
  'BENI SUEF': ['الواسطى', 'ببا', 'الفشن'],
  MINYA: ['ملوي', 'مغاغة', 'بني مزار', 'سمالوط', 'أبو قرقاص'],
  ASSIUT: ['ديروط', 'منفلوط', 'القوصية', 'أبنوب'],
  SOHAG: ['طهطا', 'جرجا', 'أخميم', 'البلينا'],
  QENA: ['نجع حمادي', 'قوص', 'دشنا'],
  ASWAN: ['كوم أمبو', 'إدفو'],
  'RED SEA': ['الغردقة', 'سفاجا', 'القصير', 'مرسى علم', 'hurghada'],
  'MARSA MATROUH': ['العلمين', 'الساحل الشمالي', 'سيوة', 'الضبعة', 'sahel'],
  'NORTH SINAI': ['العريش'],
  'SOUTH SINAI': ['شرم الشيخ', 'دهب', 'نويبع', 'sharm el sheikh', 'dahab'],
}

/** Folds the Arabic spelling variants people use interchangeably. */
function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

function toLatinDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

interface Keyword {
  folded: string
  governorate: string
  /** Original spelling, used as the City / Area value for district matches. */
  display: string
}

function buildKeywords(): { governorates: Keyword[]; areas: Keyword[] } {
  const governorates: Keyword[] = []
  for (const [key, arabic] of Object.entries(GOVERNORATE_AR)) {
    const spellings = [arabic, key, ...(GOVERNORATE_ALIASES[key] ?? [])]
    for (const spelling of spellings) {
      governorates.push({ folded: fold(spelling), governorate: key, display: arabic })
    }
  }

  const areas: Keyword[] = []
  for (const [key, names] of Object.entries(AREA_GOVERNORATE)) {
    for (const name of names) {
      const display = /[a-z]/.test(name)
        ? name.replace(/\b[a-z]/g, (char) => char.toUpperCase())
        : name
      areas.push({ folded: fold(name), governorate: key, display })
    }
  }

  // Longest first, so "شبرا الخيمة" wins over "شبرا".
  const byLength = (a: Keyword, b: Keyword) => b.folded.length - a.folded.length
  return { governorates: governorates.sort(byLength), areas: areas.sort(byLength) }
}

const KEYWORDS = buildKeywords()

/** Whole-word containment that tolerates Arabic/English punctuation. */
function containsWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[\\s،,.\\-–/()])${escaped}($|[\\s،,.\\-–/()])`).test(
    haystack,
  )
}

function findKeyword(text: string, keywords: Keyword[]): Keyword | null {
  const folded = fold(text)
  return keywords.find((keyword) => containsWord(folded, keyword.folded)) ?? null
}

// Egyptian mobiles, optionally with a +20/0020 prefix and spaces or dashes
// between digits. The lookarounds stop "عمارة 12 0102..." from merging the
// building number into the phone.
const MOBILE_PATTERN =
  /(?<!\d)(?:(?:\+|00)\s?20[\s-]?)?0?1[0125](?:[\s-]?\d){8}(?!\d)/g

/** Normalizes any Egyptian mobile spelling to `01XXXXXXXXX`, or null. */
export function normalizeMobile(raw: string): string | null {
  let digits = toLatinDigits(raw).replace(/\D/g, '')
  if (digits.startsWith('0020')) digits = digits.slice(4)
  else if (digits.startsWith('20') && digits.length === 12) digits = digits.slice(2)
  if (digits.length === 10 && digits.startsWith('1')) digits = `0${digits}`
  return /^01[0125]\d{8}$/.test(digits) ? digits : null
}

function extractPhones(line: string): { phones: string[]; rest: string } {
  const phones: string[] = []
  const rest = line.replace(MOBILE_PATTERN, (match) => {
    const phone = normalizeMobile(match)
    if (!phone) return match
    phones.push(phone)
    return ' '
  })
  return {
    phones,
    // Drop separators left behind by "0100… / 0111…" style lists.
    rest: rest
      .replace(/\s+/g, ' ')
      .replace(/^[\s/|,،\-–+&و]+(?=\s|$)|(?:^|\s)[\s/|,،\-–+&و]+$/g, '')
      .trim(),
  }
}

type Field = 'name' | 'address' | 'phone' | 'governorate' | 'city' | 'notes'

const SEPARATOR = '\\s*[:：\\-–=]?\\s*'

/** Labels that must open a line. City/area labels need an explicit `:` since
 * "مدينة نصر" is itself an area name. */
const LABELS: Array<{ field: Field; pattern: RegExp }> = [
  {
    field: 'name',
    pattern: new RegExp(
      `^(?:ال)?[اأإ]سم(?:\\s+(?:العميل|بالكامل|الكامل|ثلاثي|المستلم))?(?=$|[\\s:：\\-–=])${SEPARATOR}`,
    ),
  },
  {
    field: 'name',
    pattern: new RegExp(`^(?:full\\s*name|customer\\s*name|name)(?=$|[\\s:：\\-–=])${SEPARATOR}`, 'i'),
  },
  {
    field: 'address',
    pattern: new RegExp(
      `^(?:ال)?عنوان(?:\\s+(?:بالتفصيل|التفصيلي|بالكامل|كامل|الشحن|التوصيل))?(?=$|[\\s:：\\-–=])${SEPARATOR}`,
    ),
  },
  {
    field: 'address',
    pattern: new RegExp(`^(?:shipping\\s+)?address(?=$|[\\s:：\\-–=])${SEPARATOR}`, 'i'),
  },
  {
    field: 'phone',
    pattern: new RegExp(
      `^(?:رقم\\s+)?(?:ال)?(?:تليفون|تلفون|هاتف|موبايل|موبيل|محمول|جوال|واتس\\S*|تواصل|للتواصل)(?:\\s+(?:للتواصل|التواصل|المحمول|الموبايل))?(?=$|[\\s:：\\-–=])${SEPARATOR}`,
    ),
  },
  {
    field: 'phone',
    pattern: new RegExp(`^(?:phone|mobile|tel|whats\\S*)(?:\\s*(?:number|no\\.?))?(?=$|[\\s:：\\-–=])${SEPARATOR}`, 'i'),
  },
  {
    field: 'governorate',
    pattern: new RegExp(`^(?:ال)?محافظ[ةه](?=$|[\\s:：\\-–=])${SEPARATOR}`),
  },
  {
    field: 'governorate',
    pattern: new RegExp(`^(?:governorate|state)(?=$|[\\s:：\\-–=])${SEPARATOR}`, 'i'),
  },
  {
    field: 'city',
    pattern: /^(?:ال)?(?:مدين[ةه]|منطق[ةه]|مركز|حي)\s*[:：]\s*/,
  },
  { field: 'city', pattern: /^(?:city|area|district)\s*[:：]\s*/i },
  {
    field: 'notes',
    pattern: new RegExp(`^(?:ملاحظات|ملاحظ[ةه]|ملحوظ[ةه]|notes?)(?=$|[\\s:：\\-–=])${SEPARATOR}`, 'i'),
  },
]

function matchLabel(line: string): { field: Field; value: string } | null {
  for (const { field, pattern } of LABELS) {
    const match = line.match(pattern)
    if (match) return { field, value: line.slice(match[0].length).trim() }
  }
  return null
}

const ADDRESS_HINT =
  /(شارع|ش\.|عمار[ةه]|برج|شق[ةه]|الدور|دور|بجوار|امام|أمام|خلف|قرب|مدين[ةه]|قري[ةه]|عزب[ةه]|منطق[ةه]|مستشفى|صيدلي[ةه]|مسجد|كنيس[ةه]|مدرس[ةه]|بواب[ةه]|ميدان|street|st\.|building|floor|apt|road|\d)/i

function looksLikeName(line: string): boolean {
  if (/\d/.test(line)) return false
  if (ADDRESS_HINT.test(line)) return false
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 5) return false
  return !findKeyword(line, KEYWORDS.governorates) && !findKeyword(line, KEYWORDS.areas)
}

function cleanLine(line: string): string {
  return toLatinDigits(line)
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, '')
    .replace(/^[\s\-–•*·▪►✅☑️📍📞☎️🏠👤]+/u, '')
    .trim()
}

export function parseCustomerPaste(text: string): ParsedCustomerPaste {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)

  let fullName = ''
  const phones: string[] = []
  const addressLines: string[] = []
  const notes: string[] = []
  let explicitGovernorate = ''
  let explicitCity = ''
  let current: Field | null = null

  for (const raw of lines) {
    const labelled = matchLabel(raw)
    const field = labelled?.field ?? null
    const { phones: linePhones, rest } = extractPhones(labelled?.value ?? raw)
    phones.push(...linePhones)

    if (field) current = field

    if (field === 'phone') continue
    if (!rest) continue

    // A line that is only a governorate name (e.g. "الإسكندرية").
    const governorateOnly = KEYWORDS.governorates.find(
      (keyword) => fold(rest).replace(/^محافظ[هة]\s+/, '') === keyword.folded,
    )
    if (!field && governorateOnly) {
      explicitGovernorate ||= governorateOnly.governorate
      continue
    }

    const target: Field =
      field ??
      (current === 'notes'
        ? 'notes'
        : current === 'name' || current === 'phone'
          ? 'address'
          : current ?? 'address')

    switch (target) {
      case 'name':
        if (!fullName) fullName = rest
        else addressLines.push(rest)
        current = 'name'
        break
      case 'governorate': {
        const found = findKeyword(rest, KEYWORDS.governorates)
        if (found) explicitGovernorate = found.governorate
        else addressLines.push(rest)
        break
      }
      case 'city':
        explicitCity = rest
        break
      case 'notes':
        notes.push(rest)
        break
      default:
        // Unlabelled first line that reads like a person's name.
        if (!field && !fullName && current === null && looksLikeName(rest)) {
          fullName = rest
          current = 'name'
        } else {
          addressLines.push(rest)
          current = 'address'
        }
    }
  }

  const addressText = addressLines.join(' ')
  const area =
    findKeyword(explicitCity, KEYWORDS.areas) ?? findKeyword(addressText, KEYWORDS.areas)
  const governorate =
    explicitGovernorate ||
    findKeyword(explicitCity, KEYWORDS.governorates)?.governorate ||
    findKeyword(addressText, KEYWORDS.governorates)?.governorate ||
    area?.governorate ||
    ''

  const city =
    explicitCity ||
    (area && area.governorate === governorate ? area.display : '') ||
    (governorate ? GOVERNORATE_AR[governorate] ?? '' : '')

  // addressLine1 caps at 200 characters; overflow goes to the second line.
  let addressLine1 = ''
  let addressLine2 = ''
  for (const line of addressLines) {
    const candidate = addressLine1 ? `${addressLine1}، ${line}` : line
    if (candidate.length <= 200 && !addressLine2) addressLine1 = candidate
    else addressLine2 = addressLine2 ? `${addressLine2}، ${line}` : line
  }

  const uniquePhones = Array.from(new Set(phones))

  return {
    fullName,
    phone: uniquePhones[0] ?? '',
    extraPhones: uniquePhones.slice(1),
    addressLine1,
    addressLine2,
    city,
    state: governorate,
    notes: notes.join(' — '),
  }
}
