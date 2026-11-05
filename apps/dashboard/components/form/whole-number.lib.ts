/**
 * Whole-number text fields (days, quantities) that accept Arabic-Indic digits
 * typed on an Arabic keyboard. A `type="number"` input drops them, so these
 * fields are text inputs with `inputMode="numeric"`: the text is kept as typed
 * (ASCII digits only) and a number is committed only when it is in range, so
 * clearing the field or typing "6" on the way to "60" never yields NaN or a
 * value outside min/max. On blur the field settles on a valid number.
 */

export type WholeNumberRange = { min: number; max: number; fallback: number };

/** ASCII digits of `raw` (Arabic-Indic and Persian digits converted), at most as long as `max`. */
export function wholeNumberText(raw: string, max: number): string {
  const ascii = raw.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));
  return ascii.replace(/\D/g, "").slice(0, String(Math.trunc(max)).length);
}

/** The number to commit while typing, or null when the text is empty or out of range. */
export function inRangeValue(text: string, { min, max }: Pick<WholeNumberRange, "min" | "max">): number | null {
  if (text === "") return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** The value the field settles on at blur: clamped, or `fallback` when empty. */
export function settledValue(text: string, { min, max, fallback }: WholeNumberRange): number {
  if (text === "") return fallback;
  const n = Number(text);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
