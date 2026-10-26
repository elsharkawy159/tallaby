/**
 * Bosta `errorCode` → a reason key the dashboard translates
 * (`orders.bosta.errors.<key>` in ar.json / en.json). Codes come from Bosta's
 * how-to pages and API spec; anything unknown is `unknown`, shown with
 * Bosta's own (redacted) message.
 */
export type BostaErrorReason =
  | "invalid_key"
  | "forbidden"
  | "no_pickup_location"
  | "city_not_found"
  | "zone_not_found"
  | "district_not_found"
  | "address_required"
  | "cod_too_high"
  | "images_required"
  | "invalid_images"
  | "duplicate"
  | "timeout"
  | "network"
  | "server"
  | "unknown";

const BY_CODE: Record<number, BostaErrorReason> = {
  1007: "invalid_key",
  1028: "invalid_key",
  1008: "forbidden",
  1073: "no_pickup_location",
  3001: "city_not_found",
  3002: "zone_not_found",
  3003: "district_not_found",
  3004: "address_required",
  3009: "address_required",
  3007: "cod_too_high",
  3008: "cod_too_high",
  2150: "images_required",
  2151: "invalid_images",
  2152: "invalid_images",
  1000: "server",
};

export function bostaErrorReason(errorCode: number | null, httpStatus: number | null): BostaErrorReason {
  if (errorCode != null && BY_CODE[errorCode]) return BY_CODE[errorCode];
  if (httpStatus === 401) return "invalid_key";
  if (httpStatus === 403) return "forbidden";
  if (httpStatus != null && httpStatus >= 500) return "server";
  return "unknown";
}

/** Address problems the seller fixes by picking the Bosta district by hand. */
export function isBostaAddressError(reason: BostaErrorReason): boolean {
  return (
    reason === "city_not_found" ||
    reason === "zone_not_found" ||
    reason === "district_not_found" ||
    reason === "address_required"
  );
}

/**
 * Bosta rejects a second delivery with the same `uniqueBusinessReference`.
 * Its error code for that is not documented, so the message is matched too.
 */
export function looksLikeDuplicateReference(message: string): boolean {
  return /unique\s*business\s*reference|already\s+exists|duplicate/i.test(message);
}
