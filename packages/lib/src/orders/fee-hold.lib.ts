/**
 * Fee hold rules (owner, 2026-10-31; PLAN.md §13.3). Pure, no I/O.
 *
 * The EGP 5 fee is taken when an order is created, except for an order that
 * looks fake or duplicated: that one is "held" and pays only if it is later
 * delivered (the delivery charge uses the same `order:<id>` claim, so a held
 * order that ships still pays once and a charged order never pays twice).
 */

export const DUPLICATE_WINDOW_MINUTES = 120

export type FeeHoldReason =
  | 'junk_name'
  | 'junk_address'
  | 'fake_phone'
  | 'own_account'
  | 'duplicate'

/** Whole tokens that mean "a test order" in a name or an address. */
const JUNK_TOKENS = new Set([
  'test', 'tests', 'testing', 'tester', 'tst', 'tset',
  'asd', 'asdf', 'asdasd', 'asdasdasd', 'asdfg', 'asdfgh', 'asdfghjkl',
  'qwe', 'qwer', 'qwerty', 'qweqwe', 'zxc', 'zxcv', 'zxczxc',
  'fake', 'demo', 'sample', 'dummy', 'null', 'none', 'xxx', 'xyz', 'abc', 'abcd',
  'lorem', 'ipsum',
  // Arabic, and the Arabic-keyboard spellings of asd / qwe.
  'تست', 'تيست', 'تجربة', 'تجربه', 'تجريب', 'تجريبي', 'اختبار',
  'شسي', 'شسيشسي', 'ضصث', 'ضصثق',
])

/** Keyboard rows: a long run along one is a key mash (asdfgh, ضصثقف). */
const KEYBOARD_ROWS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  'ضصثقفغعهخحجد', 'شسيبلاتنمكط', 'ئءؤرىةوزظ',
]

const LETTER_RE = /\p{L}/gu

/** Lower case, Arabic digits to ASCII, punctuation to spaces, tatweel and diacritics removed. */
export function normalizeText (input: string | null | undefined): string {
  return (input ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const letterCount = (text: string) => text.match(LETTER_RE)?.length ?? 0

/** `asdasd`, `abab`, `ههههه`: the token is one short chunk repeated. */
function isRepeatedChunk (token: string): boolean {
  if (token.length < 3) return false
  for (let size = 1; size <= Math.min(4, token.length / 2); size++) {
    if (token.length % size !== 0) continue
    if (token.slice(0, size).repeat(token.length / size) === token) return true
  }
  return false
}

/** A run of 4+ keys along one keyboard row, either way. */
function isKeyboardRun (token: string): boolean {
  if (token.length < 4) return false
  return KEYBOARD_ROWS.some((row) => {
    const reversed = [...row].reverse().join('')
    return row.includes(token) || reversed.includes(token)
  })
}

function isJunkToken (token: string): boolean {
  return JUNK_TOKENS.has(token) || isRepeatedChunk(token) || isKeyboardRun(token)
}

/** "test", "asdasd", "Ahmed test", "aaaa", "123", "x": not a real customer name. */
export function isJunkName (name: string | null | undefined): boolean {
  const text = normalizeText(name)
  if (letterCount(text) < 2) return true
  return text.split(' ').some(isJunkToken)
}

/** Under 5 characters, or a test word ("test", "asdasd") in the street line. */
export function isJunkAddress (line: string | null | undefined): boolean {
  const text = normalizeText(line)
  if (text.replace(/\s/g, '').length < 5) return true
  return text.split(' ').some((token) => token.length >= 3 && isJunkToken(token))
}

/** `+20 101 234 5678` → `01012345678`; null when it is not an Egyptian mobile. */
export function normalizeEgMobile (input: string | null | undefined): string | null {
  let digits = (input ?? '').replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/\D/g, '')
  if (digits.startsWith('0020')) digits = digits.slice(4)
  else if (digits.startsWith('20') && digits.length === 12) digits = digits.slice(2)
  if (digits.length === 10 && digits.startsWith('1')) digits = `0${digits}`
  return /^01[0125]\d{8}$/.test(digits) ? digits : null
}

/** 01000000000, 01111111111, 01234567890, 01087654321: the last 8 digits are all one digit or a run. */
export function isFakePhone (phone: string | null | undefined): boolean {
  const mobile = normalizeEgMobile(phone)
  if (!mobile) return false
  const tail = mobile.slice(3)
  if (/^(\d)\1{7}$/.test(tail)) return true
  return '01234567890'.includes(tail) || '09876543210'.includes(tail)
}

/** The seller's own contact details, normalised, to spot a seller testing their own store. */
export type SellerContacts = {
  sellerId: string
  phones: ReadonlyArray<string | null | undefined>
  emails: ReadonlyArray<string | null | undefined>
}

const normEmail = (email: string | null | undefined) => (email ?? '').trim().toLowerCase() || null

export function isOwnAccount (
  customer: { userId: string; phone?: string | null; email?: string | null },
  seller: SellerContacts,
): boolean {
  if (customer.userId === seller.sellerId) return true
  const phone = normalizeEgMobile(customer.phone)
  if (phone && seller.phones.some((p) => normalizeEgMobile(p) === phone)) return true
  const email = normEmail(customer.email)
  return email != null && seller.emails.some((e) => normEmail(e) === email)
}

/** One seller's part of an order as a comparable key: product, option and quantity per line. */
export function itemsFingerprint (
  lines: ReadonlyArray<{ productId: string; variantId?: string | null; quantity: number }>,
): string {
  const totals = new Map<string, number>()
  for (const line of lines) {
    const key = `${line.productId}:${line.variantId ?? ''}`
    totals.set(key, (totals.get(key) ?? 0) + line.quantity)
  }
  return [...totals].map(([key, qty]) => `${key}x${qty}`).sort().join('|')
}

export type RecentSellerOrder = {
  userId: string | null
  phone: string | null
  fingerprint: string
}

/** Same seller, same phone (or same customer account) and the same items within the window. */
export function isDuplicateOrder (
  current: { userId: string; phone?: string | null; fingerprint: string },
  recent: ReadonlyArray<RecentSellerOrder>,
): boolean {
  const phone = normalizeEgMobile(current.phone)
  return recent.some(
    (order) =>
      order.fingerprint === current.fingerprint &&
      (order.userId === current.userId || (phone != null && normalizeEgMobile(order.phone) === phone)),
  )
}

/** Order-wide signals (same for every seller in the order). */
export function orderJunkReasons (address: {
  fullName?: string | null
  phone?: string | null
  addressLine1?: string | null
} | null | undefined): FeeHoldReason[] {
  if (!address) return []
  const reasons: FeeHoldReason[] = []
  if (isJunkName(address.fullName)) reasons.push('junk_name')
  if (isFakePhone(address.phone)) reasons.push('fake_phone')
  if (isJunkAddress(address.addressLine1)) reasons.push('junk_address')
  return reasons
}

/** `orders.metadata.feeHolds`: seller id → why that seller's fee waits for delivery. */
export type FeeHolds = Record<string, FeeHoldReason[]>
