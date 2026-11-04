/**
 * Wassalha (Egypt Post) tracking numbers (ROADMAP.md F-12e). Pure: finds the two
 * columns in a result file and cleans what they hold. We have no real result
 * file yet, so columns are matched by a list of names in Arabic and English, and
 * a file that doesn't clearly name both is refused, never guessed at.
 *
 * `Package_Ref. Number` is the column our export writes the order number into
 * (`toEgyptPostRow`). `Package_Serial` is only the row's position in that sheet,
 * so it is deliberately not a tracking column.
 */

export const WASSALHA_TRACKING_MAX_ROWS = 2000;

/** One data row as the file has it. `row` is its line in the file, for the seller to find it. */
export type RawTrackingEntry = { row: number; orderNumber: string; trackingNumber: string };

export type TrackingEntry = RawTrackingEntry;

export type TrackingFileError = "empty" | "no_order_column" | "no_tracking_column" | "ambiguous_columns" | "too_many";

export type TrackingRowProblem =
  | "missing_order_number"
  | "missing_tracking"
  | "bad_order_number"
  | "bad_tracking"
  | "order_repeated"
  | "tracking_repeated";

export type TrackingProblem = RawTrackingEntry & { reason: TrackingRowProblem };

/** Rows at the top of a file that may hold the header, under a title or a blank line. */
const HEADER_SCAN_ROWS = 5;

/** Names compare after `headerKey`, so case, spaces, punctuation and Arabic letter forms don't matter. */
const ORDER_HEADERS = new Set([
  "packagerefnumber",
  "packageref",
  "refnumber",
  "referencenumber",
  "reference",
  "ordernumber",
  "ordernum",
  "orderno",
  "order",
  "رقمالطلب",
  "الطلب",
  "رقمالاوردر",
  "الاوردر",
  "رقمالمرجع",
  "الرقمالمرجعي",
  "المرجع",
]);

const TRACKING_HEADERS = new Set([
  "trackingnumber",
  "trackingnum",
  "trackingno",
  "trackingcode",
  "trackingid",
  "tracking",
  "barcode",
  "awb",
  "awbnumber",
  "waybill",
  "waybillnumber",
  "shipmentnumber",
  "shipmentno",
  "رقمالتتبع",
  "كودالتتبع",
  "التتبع",
  "رقمالشحنه",
  "رقمالباركود",
  "الباركود",
  "باركود",
  "رقمالبوليصه",
  "البوليصه",
  "بوليصه",
]);

const ORDER_NUMBER_RE = /^[A-Z0-9][A-Z0-9-]{3,39}$/;
const TRACKING_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{3,39}$/;
/** Excel turned a long number into `1.23E12`: the real digits are gone. */
const SCIENTIFIC_RE = /^\d+(\.\d+)?E\d+$/i;

function westernDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** A header reduced to letters and digits, with Arabic letter forms unified. */
export function headerKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^a-z0-9ء-ي]/g, "");
}

/** `#ord12 34` → `ORD1234`. Order numbers are upper case (`generateOrderNumber`). */
export function cleanOrderNumber(value: string): string {
  return westernDigits(value).replace(/[\s ‎‏]/g, "").replace(/^#/, "").toUpperCase();
}

/** Trimmed, invisible marks out, digits western. Kept as the carrier wrote it otherwise. */
export function cleanTrackingNumber(value: string): string {
  return westernDigits(value).replace(/[\s ‎‏]/g, "");
}

export function isValidTrackingNumber(value: string): boolean {
  return TRACKING_RE.test(value) && !SCIENTIFIC_RE.test(value);
}

const cell = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

/**
 * Finds the header row and returns every non-blank row under it, uncleaned.
 * Runs in the browser on the parsed sheet; the server cleans what it receives
 * again with `cleanTrackingEntries`, so nothing here is trusted.
 */
export function extractTrackingRows(
  rows: readonly (readonly unknown[])[],
): { ok: true; entries: RawTrackingEntry[] } | { ok: false; error: TrackingFileError } {
  if (!rows.some((row) => row.some((value) => cell(value)))) return { ok: false, error: "empty" };

  let headerRow = -1;
  let orderColumns: number[] = [];
  let trackingColumns: number[] = [];
  for (let i = 0; i < Math.min(rows.length, HEADER_SCAN_ROWS) && headerRow < 0; i += 1) {
    const keys = (rows[i] ?? []).map((value) => headerKey(cell(value)));
    orderColumns = keys.flatMap((key, column) => (ORDER_HEADERS.has(key) ? [column] : []));
    trackingColumns = keys.flatMap((key, column) => (TRACKING_HEADERS.has(key) ? [column] : []));
    if (orderColumns.length > 0 || trackingColumns.length > 0) headerRow = i;
  }
  if (orderColumns.length === 0) return { ok: false, error: "no_order_column" };
  if (trackingColumns.length === 0) return { ok: false, error: "no_tracking_column" };
  if (orderColumns.length > 1 || trackingColumns.length > 1) return { ok: false, error: "ambiguous_columns" };

  const entries: RawTrackingEntry[] = [];
  for (let i = headerRow + 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const orderNumber = cell(row[orderColumns[0]!]);
    const trackingNumber = cell(row[trackingColumns[0]!]);
    if (orderNumber || trackingNumber) entries.push({ row: i + 1, orderNumber, trackingNumber });
  }
  if (entries.length === 0) return { ok: false, error: "empty" };
  if (entries.length > WASSALHA_TRACKING_MAX_ROWS) return { ok: false, error: "too_many" };
  return { ok: true, entries };
}

/**
 * Cleans the rows and sets aside the ones that can't be trusted. A row repeated
 * exactly counts once. An order with two different numbers, or one number on two
 * orders, is refused on every row it appears in: we can't tell which is right.
 */
export function cleanTrackingEntries(raw: readonly RawTrackingEntry[]): { entries: TrackingEntry[]; problems: TrackingProblem[] } {
  const problems: TrackingProblem[] = [];
  const valid: TrackingEntry[] = [];

  for (const entry of raw) {
    const orderNumber = cleanOrderNumber(String(entry.orderNumber ?? ""));
    const trackingNumber = cleanTrackingNumber(String(entry.trackingNumber ?? ""));
    const row = Number.isInteger(entry.row) ? entry.row : 0;
    const shown = { row, orderNumber: orderNumber.slice(0, 60), trackingNumber: trackingNumber.slice(0, 60) };
    if (!orderNumber) problems.push({ ...shown, reason: "missing_order_number" });
    else if (!ORDER_NUMBER_RE.test(orderNumber)) problems.push({ ...shown, reason: "bad_order_number" });
    else if (!trackingNumber) problems.push({ ...shown, reason: "missing_tracking" });
    else if (!isValidTrackingNumber(trackingNumber)) problems.push({ ...shown, reason: "bad_tracking" });
    else valid.push({ row, orderNumber, trackingNumber });
  }

  const numbersOfOrder = new Map<string, Set<string>>();
  const ordersOfNumber = new Map<string, Set<string>>();
  for (const { orderNumber, trackingNumber } of valid) {
    const key = trackingNumber.toUpperCase();
    numbersOfOrder.set(orderNumber, (numbersOfOrder.get(orderNumber) ?? new Set()).add(key));
    ordersOfNumber.set(key, (ordersOfNumber.get(key) ?? new Set()).add(orderNumber));
  }

  const seen = new Set<string>();
  const entries: TrackingEntry[] = [];
  for (const entry of valid) {
    if (numbersOfOrder.get(entry.orderNumber)!.size > 1) {
      problems.push({ ...entry, reason: "order_repeated" });
    } else if (ordersOfNumber.get(entry.trackingNumber.toUpperCase())!.size > 1) {
      problems.push({ ...entry, reason: "tracking_repeated" });
    } else if (!seen.has(entry.orderNumber)) {
      seen.add(entry.orderNumber);
      entries.push(entry);
    }
  }
  problems.sort((a, b) => a.row - b.row);
  return { entries, problems };
}
