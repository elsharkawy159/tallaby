/**
 * Orders › Scan returns (ROADMAP.md F-04e): what a scanned or typed code
 * means. The barcode on invoices and slips is the order number in Code 128
 * (`ORD` + 8 letters/digits); people may also type it with the `#` printed
 * next to it, in lower case, with spaces, or in Arabic-Indic digits.
 */

const ORDER_NUMBER_RE = /^[A-Z0-9][A-Z0-9-]{3,39}$/;

/** `#ord x7k2-m9qa` → `ORDX7K2-M9QA`; null when it cannot be an order number. */
export function parseScannedOrderNumber(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw
    .replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10))
    .replace(/[\s#]/g, "")
    .toUpperCase();
  return ORDER_NUMBER_RE.test(text) ? text : null;
}
