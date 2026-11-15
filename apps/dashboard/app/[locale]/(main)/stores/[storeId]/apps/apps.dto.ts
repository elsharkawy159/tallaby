/** Error keys live under `storeApps.errors`. */
export type StoreAppsErrorKey =
  | "invalidId"
  | "notAvailable"
  | "readOnly"
  | "notFound"
  | "rateLimited"
  | "generic"
  // Meta Conversions API (P7-05)
  | "invalidToken"
  | "invalidTestCode"
  | "pixelRequired"
  | "tokenRequired"
  | "notConnected"
  | "testFailed"
  // Shopify import (P7-07)
  | "invalidShopDomain"
  | "shopifyAuth"
  | "shopifyScope"
  | "shopifyUnreachable"
  | "invalidCategory"
  // Google Sheets (P7-06)
  | "googleFailed"
  | "noSheet"
  // Bosta (BS-06)
  | "bostaInvalidKey"
  | "bostaKeyRequired"
  | "bostaKeyRejected"
  | "bostaUnreachable"
  | "bostaUnknownLocation"
  | "invalidSettings"
  // Install and charges (F-47)
  | "notLive"
  | "alreadyInstalled"
  | "notInstalled"
  | "insufficientBalance"
  | "walletInactive"
  | "walletNotUsd";

export type StoreAppsResult<T> =
  | { success: true; data: T }
  /** `message` is an already-redacted provider error (never a secret). */
  | { success: false; error: StoreAppsErrorKey; message?: string };
