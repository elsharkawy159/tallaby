/**
 * Customer phones outside Egypt (ROADMAP.md F-61e). Pure, safe on the client.
 * Egyptian numbers keep their own rules and stored forms everywhere; a foreign
 * number is stored in international form, `+9665XXXXXXXX`.
 */

/** Calling codes of the countries sellers ship to most. Others need the number typed with `+`. */
const CALLING_CODES: Readonly<Record<string, string>> = {
  SA: "966", AE: "971", KW: "965", QA: "974", BH: "973", OM: "968", JO: "962", IQ: "964",
  LB: "961", PS: "970", SY: "963", YE: "967", LY: "218", SD: "249", TN: "216", DZ: "213",
  MA: "212", TR: "90", GB: "44", DE: "49", FR: "33", IT: "39", ES: "34", NL: "31",
  US: "1", CA: "1", AU: "61",
};

const KNOWN_CODES = [...new Set(Object.values(CALLING_CODES))].filter((code) => code.length === 3);

const latinDigits = (input: string) =>
  input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .trim();

const LOOKS_LIKE_PHONE = /^[+()\d\s.-]+$/;

/**
 * A foreign number when the input says which country it is in: `+` or `00`, a
 * bare `966…` from a three-digit country code, or a Saudi mobile written locally
 * (`05XXXXXXXX`). Null for an Egyptian code and for anything else.
 */
export function normalizeForeignPhone(input: string | null | undefined): string | null {
  const text = latinDigits(input ?? "");
  if (!LOOKS_LIKE_PHONE.test(text)) return null;
  const digits = text.replace(/\D/g, "");
  if (text.startsWith("+") || digits.startsWith("00")) {
    const international = digits.replace(/^00/, "");
    return /^[1-9]\d{7,14}$/.test(international) && !international.startsWith("20") ? `+${international}` : null;
  }
  if (/^05\d{8}$/.test(digits)) return `+966${digits.slice(1)}`;
  const known = KNOWN_CODES.some((code) => digits.startsWith(code)) && digits.length >= 10 && digits.length <= 15;
  return known ? `+${digits}` : null;
}

/** The form saved for a phone in `countryCode` (not Egypt), or null when it isn't valid there. */
export function normalizeCountryPhone(countryCode: string, input: string | null | undefined): string | null {
  const text = latinDigits(input ?? "");
  if (!LOOKS_LIKE_PHONE.test(text)) return null;
  const digits = text.replace(/\D/g, "").replace(/^00/, "");
  if (countryCode === "SA") {
    const mobile = /^(?:966|0)?(5\d{8})$/.exec(digits);
    return mobile ? `+966${mobile[1]}` : null;
  }
  const code = CALLING_CODES[countryCode];
  // A country not on the list: only a full international number can be read.
  if (!code) return text.startsWith("+") || text.startsWith("00") ? normalizeForeignPhone(text) : null;
  const local = (digits.startsWith(code) ? digits.slice(code.length) : digits).replace(/^0/, "");
  return /^[1-9]\d{5,11}$/.test(local) ? `+${code}${local}` : null;
}

/** Digits for a wa.me link from a stored phone: `+9665…` as is, `010…` with Egypt's code. */
export function whatsAppDigits(phone: string): string {
  return phone.startsWith("+") ? phone.slice(1) : `20${phone.replace(/^0/, "")}`;
}
