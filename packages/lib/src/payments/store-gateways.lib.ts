/**
 * The seller's own card payment gateway per store (ROADMAP.md F-39, owner
 * 2026-10-30). The seller pastes the keys of their own Paymob or Kashier
 * account; storefront card payments then go straight to the seller, never
 * through Tallaby. Pure: no DB, no fetch. Server code is in
 * store-gateways.server.ts.
 *
 * Money (PLAN.md §13.4): these orders carry `metadata.paymentCollector =
 * 'seller'`, so delivery posts only the EGP 5 fee. One gateway per store at
 * a time. Tallaby Pay (internal, money to the store wallet) and PayPal are
 * "soon".
 */
import { z } from "zod";
import { buildKashierOrderReference, parseKashierOrderReference, verifyKashierWebhookSignature } from "../kashier/kashier.lib";
import { verifyPaymobTransactionHmac } from "../paymob/paymob.lib";
import type { PaymobTransactionObj } from "../paymob/paymob.types";

export const STORE_GATEWAY_PROVIDERS = ["paymob", "kashier"] as const;
export type StoreGatewayProvider = (typeof STORE_GATEWAY_PROVIDERS)[number];

export function isStoreGatewayProvider(value: unknown): value is StoreGatewayProvider {
  return typeof value === "string" && (STORE_GATEWAY_PROVIDERS as readonly string[]).includes(value);
}

/** What the Payment methods page lists under "Online card payments". */
export const STORE_GATEWAY_CATALOG = [
  { key: "paymob", status: "live" },
  { key: "kashier", status: "live" },
  { key: "paypal", status: "soon" },
  { key: "tallaby_pay", status: "soon" },
] as const satisfies readonly { key: string; status: "live" | "soon" }[];

export type GatewayMode = "test" | "live";

/* ------------------------------------------------------------------ */
/* Credentials                                                         */
/* ------------------------------------------------------------------ */

/** Secrets, encrypted in store_integrations.credentials_encrypted. */
export type PaymobSecret = {
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  cardIntegrationId: number;
  walletIntegrationId?: number;
};

export type KashierSecret = {
  merchantId: string;
  paymentApiKey: string;
  secretKey: string;
};

export type StoreGatewaySecret = PaymobSecret | KashierSecret;

/** Public config (store_integrations.config). No secret ever goes here. */
export type StoreGatewayConfig = {
  mode: GatewayMode;
  /** Last 4 characters of the secret key, so the seller recognises it. */
  keyHint: string;
  /** Set by the first webhook whose signature checked out with these keys. */
  webhookVerifiedAt?: string;
};

export type GatewayInputError =
  | "invalid_secret_key"
  | "invalid_public_key"
  | "mode_mismatch"
  | "invalid_integration_id"
  | "invalid_hmac_secret"
  | "invalid_merchant_id"
  | "invalid_api_key"
  | "invalid_mode";

const token = (min: number) => z.string().trim().min(min).max(512).regex(/^\S+$/);

/** Paymob Egypt keys: `egy_sk_test_…` / `egy_sk_live_…` (older accounts: `sk_test_…`). */
const PAYMOB_SECRET = /^(?:egy_)?sk_(test|live)_\S{8,}$/i;
const PAYMOB_PUBLIC = /^(?:egy_)?pk_(test|live)_\S{8,}$/i;
const integrationId = z.coerce.number().int().positive().max(99_999_999);

export function paymobKeyMode(key: string, kind: "secret" | "public"): GatewayMode | null {
  const match = (kind === "secret" ? PAYMOB_SECRET : PAYMOB_PUBLIC).exec(key.trim());
  return match ? (match[1]!.toLowerCase() as GatewayMode) : null;
}

/** Kashier merchant id, e.g. `MID-12345-678`. */
const KASHIER_MID = /^MID-\d{2,10}-\d{1,10}$/i;

export type ValidatedGateway =
  | { success: true; secret: StoreGatewaySecret; mode: GatewayMode; keyHint: string }
  | { success: false; error: GatewayInputError };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Validates what the seller typed, merged over the saved secret: a key field
 * left blank keeps the saved value, so editing one field does not ask for all
 * of them again.
 */
export function validateGatewayInput(
  provider: StoreGatewayProvider,
  raw: unknown,
  saved: Partial<StoreGatewaySecret> | null = null,
): ValidatedGateway {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const pick = (key: string) => str(input[key]) || str((saved as Record<string, unknown> | null)?.[key]);

  if (provider === "paymob") {
    const secretKey = pick("secretKey");
    const publicKey = pick("publicKey");
    const secretMode = paymobKeyMode(secretKey, "secret");
    if (!secretMode) return { success: false, error: "invalid_secret_key" };
    const publicMode = paymobKeyMode(publicKey, "public");
    if (!publicMode) return { success: false, error: "invalid_public_key" };
    if (secretMode !== publicMode) return { success: false, error: "mode_mismatch" };

    const hmacSecret = pick("hmacSecret");
    if (!token(16).safeParse(hmacSecret).success) return { success: false, error: "invalid_hmac_secret" };

    const rawCard = input.cardIntegrationId ?? (saved as PaymobSecret | null)?.cardIntegrationId;
    const card = integrationId.safeParse(rawCard);
    if (!card.success) return { success: false, error: "invalid_integration_id" };
    const rawWallet =
      input.walletIntegrationId !== undefined ? input.walletIntegrationId : (saved as PaymobSecret | null)?.walletIntegrationId;
    let walletIntegrationId: number | undefined;
    if (rawWallet !== undefined && rawWallet !== null && String(rawWallet).trim() !== "") {
      const wallet = integrationId.safeParse(rawWallet);
      if (!wallet.success || wallet.data === card.data) return { success: false, error: "invalid_integration_id" };
      walletIntegrationId = wallet.data;
    }

    const secret: PaymobSecret = {
      secretKey,
      publicKey,
      hmacSecret,
      cardIntegrationId: card.data,
      ...(walletIntegrationId !== undefined && { walletIntegrationId }),
    };
    return { success: true, secret, mode: secretMode, keyHint: secretKey.slice(-4) };
  }

  const merchantId = pick("merchantId").toUpperCase();
  if (!KASHIER_MID.test(merchantId)) return { success: false, error: "invalid_merchant_id" };
  const paymentApiKey = pick("paymentApiKey");
  if (!token(16).safeParse(paymentApiKey).success) return { success: false, error: "invalid_api_key" };
  const secretKey = pick("secretKey");
  if (!token(16).safeParse(secretKey).success) return { success: false, error: "invalid_secret_key" };
  const mode = str(input.mode);
  if (mode !== "test" && mode !== "live") return { success: false, error: "invalid_mode" };
  return { success: true, secret: { merchantId, paymentApiKey, secretKey }, mode, keyHint: secretKey.slice(-4) };
}

/** True when the secret has every field its provider needs (a decrypted row is re-checked). */
export function isCompleteSecret(provider: StoreGatewayProvider, secret: unknown): secret is StoreGatewaySecret {
  if (!secret || typeof secret !== "object") return false;
  const s = secret as Record<string, unknown>;
  if (provider === "paymob") {
    return (
      typeof s.secretKey === "string" &&
      typeof s.publicKey === "string" &&
      typeof s.hmacSecret === "string" &&
      typeof s.cardIntegrationId === "number"
    );
  }
  return typeof s.merchantId === "string" && typeof s.paymentApiKey === "string" && typeof s.secretKey === "string";
}

export function readGatewayConfig(config: unknown): StoreGatewayConfig | null {
  if (!config || typeof config !== "object") return null;
  const c = config as Record<string, unknown>;
  if (c.mode !== "test" && c.mode !== "live") return null;
  return {
    mode: c.mode,
    keyHint: typeof c.keyHint === "string" ? c.keyHint.slice(-4) : "",
    ...(typeof c.webhookVerifiedAt === "string" && { webhookVerifiedAt: c.webhookVerifiedAt }),
  };
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

/** Snapshot in orders.metadata.paymentGateway for a storefront card order. */
export type OrderGatewayMeta = { provider: StoreGatewayProvider; integrationId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readOrderGateway(metadata: unknown): OrderGatewayMeta | null {
  if (!metadata || typeof metadata !== "object") return null;
  const g = (metadata as Record<string, unknown>).paymentGateway;
  if (!g || typeof g !== "object") return null;
  const { provider, integrationId } = g as Record<string, unknown>;
  return isStoreGatewayProvider(provider) && typeof integrationId === "string" && UUID.test(integrationId)
    ? { provider, integrationId }
    : null;
}

/** Unique per checkout attempt (gateways refuse a reused reference); carries the order id. */
export const buildGatewayReference = buildKashierOrderReference;
export const parseGatewayReference = parseKashierOrderReference;

/** EGP → integer piastres (CLAUDE.md rule 7). */
export function toPiastres(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

/**
 * Where the seller's gateway posts payment results for this store, or null
 * when no public https backend is configured (then card payments can't be
 * confirmed, so the gateway can't be connected).
 */
export function storeGatewayWebhookUrl(
  integrationId: string,
  base: string | undefined = process.env.STORE_PAYMENTS_WEBHOOK_BASE_URL || process.env.BACKEND_API_URL,
): string | null {
  const root = base?.trim().replace(/\/+$/, "");
  if (!root || !/^https:\/\//i.test(root)) return null;
  return `${root}/api/webhooks/store-payments/${encodeURIComponent(integrationId)}`;
}

/** Storefront route the gateway sends the shopper back to. It writes nothing. */
export function storeGatewayReturnPath(orderId: string): string {
  return `/api/store-payments/return?order=${encodeURIComponent(orderId)}`;
}

/* ------------------------------------------------------------------ */
/* Webhooks                                                            */
/* ------------------------------------------------------------------ */

export type GatewayEvent = {
  transactionId: string;
  /** The reference we sent (orderId_suffix). */
  reference: string;
  status: "SUCCESS" | "FAILURE" | "PENDING";
  amountPiastres: number;
  currency: string;
};

export type ParsedGatewayWebhook =
  | { kind: "event"; event: GatewayEvent }
  /** Signed, but not a payment result we act on (refund, token, auth…). */
  | { kind: "ignored" }
  | { kind: "invalid_signature" }
  | { kind: "invalid_payload" };

export type GatewayWebhookRequest = {
  body: unknown;
  /** Paymob sends its HMAC as `?hmac=`. */
  query: Record<string, string | undefined>;
  /** Kashier sends `x-kashier-signature`. */
  headers: Record<string, string | undefined>;
};

/** Paymob transaction callback, verified with the seller's HMAC secret. */
export function parsePaymobWebhook(req: GatewayWebhookRequest, secret: PaymobSecret): ParsedGatewayWebhook {
  const body = req.body as { type?: string; obj?: PaymobTransactionObj } | null;
  const obj = body?.obj;
  if (!obj || typeof obj !== "object" || obj.id == null) return { kind: "invalid_payload" };
  const hmac = req.query.hmac;
  if (!hmac || !verifyPaymobTransactionHmac(obj, hmac, secret.hmacSecret)) return { kind: "invalid_signature" };
  if (body?.type && body.type !== "TRANSACTION") return { kind: "ignored" };
  // Refunds and voids arrive as transactions too; refunds stay out of scope (D3).
  if (obj.is_refunded || obj.is_voided || obj.has_parent_transaction) return { kind: "ignored" };
  const reference = obj.merchant_order_id;
  if (!reference || typeof obj.amount_cents !== "number") return { kind: "invalid_payload" };
  return {
    kind: "event",
    event: {
      transactionId: `paymob:${obj.id}`,
      reference,
      status: obj.success ? "SUCCESS" : obj.pending ? "PENDING" : "FAILURE",
      amountPiastres: Math.round(obj.amount_cents),
      currency: obj.currency || "EGP",
    },
  };
}

/** Kashier `pay` webhook, verified with the seller's Payment API key. */
export function parseKashierWebhook(req: GatewayWebhookRequest, secret: KashierSecret): ParsedGatewayWebhook {
  const body = req.body as { event?: string; data?: Record<string, unknown> } | null;
  const data = body?.data;
  if (!body?.event || !data || data.transactionId == null) return { kind: "invalid_payload" };
  if (!verifyKashierWebhookSignature(data, req.headers["x-kashier-signature"], secret.paymentApiKey)) {
    return { kind: "invalid_signature" };
  }
  if (body.event !== "pay") return { kind: "ignored" };
  const status = data.status;
  if (status !== "SUCCESS" && status !== "FAILURE" && status !== "PENDING") return { kind: "invalid_payload" };
  const reference = typeof data.merchantOrderId === "string" ? data.merchantOrderId : "";
  const amount = Number(data.amount);
  if (!reference || !Number.isFinite(amount)) return { kind: "invalid_payload" };
  return {
    kind: "event",
    event: {
      transactionId: `kashier:${String(data.transactionId)}`,
      reference,
      status,
      amountPiastres: toPiastres(amount),
      currency: typeof data.currency === "string" && data.currency ? data.currency : "EGP",
    },
  };
}
