/** Error keys live under `downsellApp.errors`. */
export type DownsellErrorKey =
  | "invalid"
  | "unavailable"
  | "notFound"
  | "offerNotFound"
  | "notCheaper"
  | "sameProduct"
  | "limit"
  | "notInstalled"
  | "readOnly"
  | "rateLimited"
  | "generic";

export type DownsellActionResult = { success: true } | { success: false; error: DownsellErrorKey };

/** A coupon the seller can offer: usable now and valid in this store. */
export type DownsellCouponOption = { id: string; code: string; name: string };
