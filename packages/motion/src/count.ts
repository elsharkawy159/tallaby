/**
 * Count-up helpers with no imports (no zod), so store sites' motion runtime
 * can ship them. `presets.ts` re-exports them, so tallaby.com's runtime is
 * unchanged.
 */

/** An ease-out curve for count-ups: fast start, gentle settle. `t` in 0…1. */
export function easeOutQuad(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) * (1 - c);
}

/**
 * The number a count-up ends on, read from its rendered text ("5", "1,080",
 * "٣٩"), with how to write it back. `null` when the text holds no number.
 */
export function parseCount(text: string): { value: number; arabicDigits: boolean; grouped: boolean } | null {
  const arabicDigits = /[٠-٩]/.test(text);
  const western = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/٬/g, ",");
  const match = western.match(/\d[\d,]*/);
  if (!match) return null;
  const value = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(value) ? { value, arabicDigits, grouped: match[0].includes(",") } : null;
}

/** Writes a count back in the digits and grouping it was rendered with. */
export function formatCount(value: number, { arabicDigits, grouped }: { arabicDigits: boolean; grouped: boolean }): string {
  const n = Math.round(value);
  const s = grouped ? n.toLocaleString("en-US") : String(n);
  return arabicDigits ? s.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d))).replace(/,/g, "٬") : s;
}

/** A count-up's text: what comes before and after its number ("+", "%", "عميل"), and the number. */
export type CountParts = { prefix: string; suffix: string; value: number; arabicDigits: boolean; grouped: boolean };

/**
 * Splits a stat's text ("+1,080", "٩٨٪", "12k") around its first number, so a
 * count-up keeps the rest as it is. `null` when there is no whole number to
 * count: no digits, a decimal ("4.9", "٤٫٩"), or zero.
 */
export function splitCount(text: string): CountParts | null {
  const match = /[\d٠-٩][\d,٠-٩٬]*/.exec(text);
  if (!match) return null;
  const digits = match[0].replace(/[,٬]+$/, "");
  const end = match.index + digits.length;
  if (/^[.٫][\d٠-٩]/.test(text.slice(end))) return null;
  const value = Number(digits.replace(/[,٬]/g, "").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)));
  if (!(value > 0)) return null;
  return { prefix: text.slice(0, match.index), suffix: text.slice(end), value, arabicDigits: /[٠-٩]/.test(digits), grouped: /[,٬]/.test(digits) };
}
