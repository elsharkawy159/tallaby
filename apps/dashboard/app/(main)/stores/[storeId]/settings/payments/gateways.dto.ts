/** Error keys live under `storePayments.gateways.errors`. */
export type GatewayErrorKey =
  | "invalidSecretKey"
  | "invalidPublicKey"
  | "modeMismatch"
  | "invalidIntegrationId"
  | "invalidHmacSecret"
  | "invalidMerchantId"
  | "invalidApiKey"
  | "invalidMode"
  | "keysRejected"
  | "gatewayUnreachable"
  | "otherGatewayConnected"
  | "webhooksNotConfigured"
  | "notAvailable"
  | "readOnly"
  | "notFound"
  | "rateLimited"
  | "generic";

export type GatewayResult<T> = { success: true; data: T } | { success: false; error: GatewayErrorKey };

/** Form fields per gateway, in display order. Secrets are never pre-filled. */
export const GATEWAY_FIELDS = {
  paymob: [
    { name: "secretKey", secret: true, placeholder: "egy_sk_live_…" },
    { name: "publicKey", secret: false, placeholder: "egy_pk_live_…" },
    { name: "hmacSecret", secret: true, placeholder: "" },
    { name: "cardIntegrationId", secret: false, placeholder: "1234567", numeric: true },
    { name: "walletIntegrationId", secret: false, placeholder: "1234568", numeric: true, optional: true },
  ],
  kashier: [
    { name: "merchantId", secret: false, placeholder: "MID-12345-678" },
    { name: "paymentApiKey", secret: true, placeholder: "" },
    { name: "secretKey", secret: true, placeholder: "" },
  ],
} as const;

export type GatewayFieldName = (typeof GATEWAY_FIELDS)[keyof typeof GATEWAY_FIELDS][number]["name"];
