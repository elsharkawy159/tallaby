import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * EasyKash Direct Payment (ROADMAP.md F-98, docs/easykash.md §1). Pure: no DB,
 * no fetch. The fetch calls are in easykash.server.ts. Used for the seller's
 * own EasyKash account (payments/store-gateways.*), never for Tallaby's money.
 */

export const EASYKASH_API_BASE = "https://back.easykash.net";

/** Sent when the shopper gave no email; EasyKash requires one (owner, 2026-11-18). */
export const EASYKASH_FALLBACK_EMAIL = "no-reply@tallaby.com";

/** Hours a Fawry or Aman voucher stays payable (owner, 2026-11-18; EasyKash's default is 3). */
export const EASYKASH_CASH_EXPIRY_HOURS = 24;

/** The callback fields EasyKash signs, in signing order (docs/easykash.md §1.5). */
export const EASYKASH_SIGNED_FIELDS = [
  "ProductCode",
  "Amount",
  "ProductType",
  "PaymentMethod",
  "status",
  "easykashRef",
  "customerReference",
] as const;

type SignedField = (typeof EASYKASH_SIGNED_FIELDS)[number];

/** A callback read from an untrusted body or query: every value is a string ("" when absent). */
export type EasykashCallbackFields = Record<SignedField, string> & { signatureHash: string; voucher: string };

const MAX_FIELD = 512;

function readString(value: unknown): string {
  if (typeof value === "string") return value.slice(0, MAX_FIELD);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function readEasykashCallback(raw: unknown): EasykashCallbackFields {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out = { signatureHash: readString(source.signatureHash), voucher: readString(source.voucher) } as EasykashCallbackFields;
  for (const field of EASYKASH_SIGNED_FIELDS) out[field] = readString(source[field]);
  return out;
}

/** True when the request carries a callback, not just EasyKash's (or Postman's) URL check. */
export function hasEasykashCallbackFields(raw: Record<string, unknown>): boolean {
  return readString(raw.customerReference) !== "" || readString(raw.signatureHash) !== "";
}

export function easykashSignatureString(fields: Pick<EasykashCallbackFields, SignedField>): string {
  return EASYKASH_SIGNED_FIELDS.map((field) => fields[field]).join("");
}

const HEX_SHA512 = /^[0-9a-f]{128}$/i;

/**
 * HMAC-SHA512 (hex) of the signed fields with the store's HMAC secret,
 * compared in constant time. Every signed field must be present: the joined
 * string has no separators, so a missing field could shift the others.
 */
export function verifyEasykashSignature(fields: EasykashCallbackFields, secret: string): boolean {
  if (!secret || !HEX_SHA512.test(fields.signatureHash)) return false;
  if (EASYKASH_SIGNED_FIELDS.some((field) => fields[field] === "")) return false;
  const expected = Buffer.from(createHmac("sha512", secret).update(easykashSignatureString(fields)).digest("hex"));
  const given = Buffer.from(fields.signatureHash.toLowerCase());
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** EasyKash amounts are decimal strings ("11.00"); → integer piastres, or null when unreadable. */
export function easykashAmountToPiastres(amount: string): number | null {
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(amount);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

/** `+20 101 234 5678` → `01012345678`; another number → its digits only. */
export function easykashMobile(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const local = digits.startsWith("0020")
    ? `0${digits.slice(4)}`
    : digits.startsWith("20") && digits.length === 12
      ? `0${digits.slice(2)}`
      : digits;
  return /^01[0125]\d{8}$/.test(local) ? local : digits;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EasykashPayInput = {
  amountPiastres: number;
  currency: string;
  name: string | null | undefined;
  email: string | null | undefined;
  mobile: string | null | undefined;
  redirectUrl: string;
  customerReference: string;
};

export type EasykashPayBody = {
  amount: number;
  currency: string;
  cashExpiry: number;
  name: string;
  email: string;
  mobile: string;
  redirectUrl: string;
  customerReference: string;
};

/**
 * Pay API body (docs/easykash.md §4.4). `paymentOptions` is left out, so the
 * shopper sees what the seller turned on in EasyKash.
 */
export function buildEasykashPayBody(input: EasykashPayInput): EasykashPayBody {
  const email = (input.email ?? "").trim();
  return {
    amount: Number((input.amountPiastres / 100).toFixed(2)),
    currency: input.currency,
    cashExpiry: EASYKASH_CASH_EXPIRY_HOURS,
    name: ((input.name ?? "").trim() || "Customer").slice(0, 100),
    email: EMAIL.test(email) && email.length <= 254 ? email : EASYKASH_FALLBACK_EMAIL,
    mobile: easykashMobile(input.mobile),
    redirectUrl: input.redirectUrl,
    customerReference: input.customerReference,
  };
}

export type EasykashInquiry = {
  /** Upper-cased: NEW, PAID, DELIVERED, EXPIRED, FAILED, REFUNDED, CANCELED. */
  status: string;
  amountPiastres: number | null;
  easykashRef: string | null;
  voucher: string | null;
  paymentMethod: string | null;
};

/** Payment Inquiry response (docs/easykash.md §1.6), or null when it has no status. */
export function parseEasykashInquiry(body: unknown): EasykashInquiry | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  const status = readString(b.status).trim().toUpperCase();
  if (!status) return null;
  const amount = readString(b.Amount).trim();
  const orNull = (value: unknown) => readString(value).trim() || null;
  return {
    status,
    amountPiastres: amount ? easykashAmountToPiastres(amount) : null,
    easykashRef: orNull(b.easykashRef),
    voucher: orNull(b.voucher),
    paymentMethod: orNull(b.PaymentMethod),
  };
}

/** Only these Inquiry statuses ever mark an order paid. */
export function isEasykashPaidStatus(status: string): boolean {
  return status === "PAID" || status === "DELIVERED";
}

/** What the order page shows for a cash payment still to be paid (docs/easykash.md §4.4). */
export type EasykashVoucher = { voucher: string; paymentMethod: string | null; status: string };

/**
 * The Fawry or Aman voucher to show the shopper, or null: only a NEW payment
 * that has a voucher number. PAID (the callback marks it), EXPIRED, FAILED
 * and card payments show nothing.
 */
export function easykashVoucherFromInquiry(inquiry: EasykashInquiry | null): EasykashVoucher | null {
  if (!inquiry || inquiry.status !== "NEW" || !inquiry.voucher) return null;
  if (!/^[0-9A-Za-z-]{1,40}$/.test(inquiry.voucher)) return null;
  return { voucher: inquiry.voucher, paymentMethod: inquiry.paymentMethod, status: inquiry.status };
}
