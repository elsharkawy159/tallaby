/** Error keys live under `shipping.bosta.errors`. */
export type ShipWithBostaErrorKey =
  | "orderNotFound"
  | "handledByOther"
  | "notReady"
  | "notConnected"
  | "noAddress"
  | "invalidPhone"
  | "unsupportedCity"
  | "auth"
  | "rejected"
  | "rateLimited"
  | "unreachable"
  | "generic";

export type ShipWithBostaResult =
  | { success: true; data: { trackingNumber: string; alreadyShipped: boolean } }
  /** `message` is Bosta's own error text (never the key). */
  | { success: false; error: ShipWithBostaErrorKey; message?: string };
