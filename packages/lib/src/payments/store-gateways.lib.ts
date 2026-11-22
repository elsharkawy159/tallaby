/**
 * The store's online payment gateway (ROADMAP.md F-39, owner 2026-10-30).
 * Either the seller's own Paymob, Kashier or EasyKash (F-98) account, whose
 * keys the seller pastes and whose card payments go straight to the seller,
 * or Tallaby Pay (F-100): no keys, the shopper pays on Tallaby's own EasyKash
 * account, and the seller's share goes to the store's Tallaby Pay earnings
 * (never the store wallet). Pure: no DB, no fetch. Server code is in
 * store-gateways.server.ts.
 *
 * Money (PLAN.md §13.4): the seller gateways' orders carry
 * `metadata.paymentCollector = 'seller'`, so delivery posts only the order
 * fee; Tallaby Pay orders carry `'tallaby'` (`gatewayCollector`). One gateway
 * per store at a time. PayPal is "soon".
 */
import { z } from "zod";
import { buildKashierOrderReference, parseKashierOrderReference, verifyKashierWebhookSignature } from "../kashier/kashier.lib";
import { verifyPaymobTransactionHmac } from "../paymob/paymob.lib";
import type { PaymobTransactionObj } from "../paymob/paymob.types";
import { isTallabyPayFeePayer, type TallabyPayFeePayer } from "../tallaby-pay/fee.lib";

export const STORE_GATEWAY_PROVIDERS = ["paymob", "kashier", "easykash", "tallaby_pay"] as const;
export type StoreGatewayProvider = (typeof STORE_GATEWAY_PROVIDERS)[number];

export function isStoreGatewayProvider(value: unknown): value is StoreGatewayProvider {
  return typeof value === "string" && (STORE_GATEWAY_PROVIDERS as readonly string[]).includes(value);
}

// Which gateways the Payment methods page lists (Tallaby Pay first, PayPal as
// "soon") is the store apps catalog: integrations/catalog.ts, group "payments".

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

/** EasyKash › Settings › Integration Settings (docs/easykash.md §4.1). No test mode: always live. */
export type EasykashSecret = {
  apiKey: string;
  hmacSecret: string;
};

export type StoreGatewaySecret = PaymobSecret | KashierSecret | EasykashSecret;

/** Compile-time guard: a provider added to STORE_GATEWAY_PROVIDERS must be handled in every switch. */
export function assertNeverProvider(provider: never): never {
  throw new Error(`Unhandled store gateway provider: ${String(provider)}`);
}

/**
 * Who receives an online payment made on this gateway (design §3): the
 * seller's own accounts are `seller`; Tallaby Pay is collected by Tallaby,
 * which owes the seller their share through the earnings ledger.
 */
export function gatewayCollector(provider: StoreGatewayProvider): "seller" | "tallaby" {
  switch (provider) {
    case "paymob":
    case "kashier":
    case "easykash":
      return "seller";
    case "tallaby_pay":
      return "tallaby";
    default:
      return assertNeverProvider(provider);
  }
}

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
  | "invalid_mode"
  /** Tallaby Pay has no keys: it is turned on with its own action (enableTallabyPay). */
  | "no_credentials";

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

  switch (provider) {
    case "paymob":
      return validatePaymob(input, saved as Partial<PaymobSecret> | null, pick);
    case "kashier":
      return validateKashier(input, pick);
    case "easykash":
      return validateEasykash(pick);
    case "tallaby_pay":
      return { success: false, error: "no_credentials" };
    default:
      return assertNeverProvider(provider);
  }
}

type Pick = (key: string) => string;

function validatePaymob(input: Record<string, unknown>, saved: Partial<PaymobSecret> | null, pick: Pick): ValidatedGateway {
  const secretKey = pick("secretKey");
  const publicKey = pick("publicKey");
  const secretMode = paymobKeyMode(secretKey, "secret");
  if (!secretMode) return { success: false, error: "invalid_secret_key" };
  const publicMode = paymobKeyMode(publicKey, "public");
  if (!publicMode) return { success: false, error: "invalid_public_key" };
  if (secretMode !== publicMode) return { success: false, error: "mode_mismatch" };

  const hmacSecret = pick("hmacSecret");
  if (!token(16).safeParse(hmacSecret).success) return { success: false, error: "invalid_hmac_secret" };

  const rawCard = input.cardIntegrationId ?? saved?.cardIntegrationId;
  const card = integrationId.safeParse(rawCard);
  if (!card.success) return { success: false, error: "invalid_integration_id" };
  const rawWallet =
    input.walletIntegrationId !== undefined ? input.walletIntegrationId : saved?.walletIntegrationId;
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

function validateKashier(input: Record<string, unknown>, pick: Pick): ValidatedGateway {
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

/** The docs' example API key is 6 characters, so the floor is low; the HMAC secret is a long hex string. */
function validateEasykash(pick: Pick): ValidatedGateway {
  const apiKey = pick("apiKey");
  if (!token(6).safeParse(apiKey).success) return { success: false, error: "invalid_api_key" };
  const hmacSecret = pick("hmacSecret");
  if (!token(16).safeParse(hmacSecret).success) return { success: false, error: "invalid_hmac_secret" };
  const secret: EasykashSecret = { apiKey, hmacSecret };
  return { success: true, secret, mode: "live", keyHint: apiKey.slice(-4) };
}

/** True when the secret has every field its provider needs (a decrypted row is re-checked). */
export function isCompleteSecret(provider: StoreGatewayProvider, secret: unknown): secret is StoreGatewaySecret {
  if (!secret || typeof secret !== "object") return false;
  const s = secret as Record<string, unknown>;
  switch (provider) {
    case "paymob":
      return (
        typeof s.secretKey === "string" &&
        typeof s.publicKey === "string" &&
        typeof s.hmacSecret === "string" &&
        typeof s.cardIntegrationId === "number"
      );
    case "kashier":
      return typeof s.merchantId === "string" && typeof s.paymentApiKey === "string" && typeof s.secretKey === "string";
    case "easykash":
      return typeof s.apiKey === "string" && typeof s.hmacSecret === "string";
    case "tallaby_pay":
      // No secret per store: Tallaby's own EasyKash keys are env vars.
      return false;
    default:
      return assertNeverProvider(provider);
  }
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
export type OrderGatewayMeta = {
  provider: StoreGatewayProvider;
  integrationId: string;
  /**
   * EasyKash and Tallaby Pay: the reference of the latest checkout attempt, for
   * the Inquiry API (docs/easykash.md §4.4). Tallaby Pay's carry the `tpay_` prefix.
   */
  lastReference?: string;
};

/**
 * The store's gateway as checkout sees it: the order snapshot fields plus,
 * for Tallaby Pay, who pays its fee (F-100j). `feePayer` never reaches an
 * order snapshot (storeGatewayOrderMetadata copies provider and integration only).
 */
export type StorefrontGatewayMeta = OrderGatewayMeta & { feePayer?: TallabyPayFeePayer };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readOrderGateway(metadata: unknown): OrderGatewayMeta | null {
  if (!metadata || typeof metadata !== "object") return null;
  const g = (metadata as Record<string, unknown>).paymentGateway;
  if (!g || typeof g !== "object") return null;
  const { provider, integrationId, lastReference } = g as Record<string, unknown>;
  if (!isStoreGatewayProvider(provider) || typeof integrationId !== "string" || !UUID.test(integrationId)) return null;
  return {
    provider,
    integrationId,
    ...(typeof lastReference === "string" && parseOrderGatewayReference(provider, lastReference) && { lastReference }),
  };
}

/**
 * The seller gateway a COD order's deposit (ROADMAP.md F-21) is paid on:
 * `orders.metadata.deposit.gateway`, snapshotted at checkout. Kept apart from
 * `paymentGateway`, which means the whole order is a card order.
 */
export function readOrderDepositGateway(metadata: unknown): OrderGatewayMeta | null {
  if (!metadata || typeof metadata !== "object") return null;
  const deposit = (metadata as Record<string, unknown>).deposit;
  if (!deposit || typeof deposit !== "object") return null;
  return readOrderGateway({ paymentGateway: (deposit as Record<string, unknown>).gateway });
}

/** Unique per checkout attempt (gateways refuse a reused reference); carries the order id. */
export const buildGatewayReference = buildKashierOrderReference;
export const parseGatewayReference = parseKashierOrderReference;

/* ------------------------------------------------------------------ */
/* Tallaby Pay (ROADMAP.md F-100, design 2026-11-18)                   */
/* ------------------------------------------------------------------ */

/**
 * Keeps Tallaby Pay references apart from anything else that may later use
 * Tallaby's EasyKash account (design §2.4): `tpay_<orderId>_<suffix>`.
 */
export const TALLABY_PAY_REFERENCE_PREFIX = "tpay_";

export function buildTallabyPayReference(orderId: string): string {
  return `${TALLABY_PAY_REFERENCE_PREFIX}${buildGatewayReference(orderId)}`;
}

/** The order id of a `tpay_` reference, or null for anything else (a seller gateway's reference included). */
export function parseTallabyPayReference(reference: string | null | undefined): string | null {
  if (!reference || !reference.startsWith(TALLABY_PAY_REFERENCE_PREFIX)) return null;
  return parseGatewayReference(reference.slice(TALLABY_PAY_REFERENCE_PREFIX.length));
}

/** The order id in a reference made for this provider's checkout. */
export function parseOrderGatewayReference(provider: StoreGatewayProvider, reference: string): string | null {
  return provider === "tallaby_pay" ? parseTallabyPayReference(reference) : parseGatewayReference(reference);
}

/** The seller terms shown on Turn on (design §2.1); stored on the integration row and on each order. */
export const TALLABY_PAY_TERMS_VERSION = "2026-11-18";

/** `store_integrations.config` of a Tallaby Pay row. `mode` is always live, so readGatewayConfig accepts it. */
export type TallabyPayGatewayConfig = {
  mode: "live";
  termsVersion: string;
  termsAcceptedAt: string;
  enabledAt: string;
  /**
   * Who pays the Tallaby Pay fee (F-100j). Missing means `seller`, the
   * behaviour before F-100j, so rows written earlier keep it.
   */
  feePayer?: TallabyPayFeePayer;
};

/** The fee payer saved on a Tallaby Pay row's config; anything unreadable is `seller` (the default). */
export function readTallabyPayFeePayer(config: unknown): TallabyPayFeePayer {
  if (!config || typeof config !== "object") return "seller";
  const value = (config as Record<string, unknown>).feePayer;
  return isTallabyPayFeePayer(value) ? value : "seller";
}

/**
 * `orders.metadata.tallabyPay`: the fee and hold read once at placement
 * (design §3), so a later rate change never alters an order already placed.
 *
 * F-100j: when the shopper paid the fee, `feePayer` is `'customer'` and
 * `customerFeePiastres` is the surcharge added to the order total at
 * placement (also stored as `orders.payment_fee_amount`). A snapshot without
 * `feePayer` is seller-pays (every order before F-100j, and every seller-pays
 * order after it: their snapshot is unchanged).
 */
export type TallabyPayOrderSnapshot = {
  feeBps: number;
  holdDays: number;
  termsVersion: string;
  feePayer?: "customer";
  customerFeePiastres?: number;
};

export function readOrderTallabyPay(metadata: unknown): TallabyPayOrderSnapshot | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).tallabyPay;
  if (!raw || typeof raw !== "object") return null;
  const { feeBps, holdDays, termsVersion, feePayer, customerFeePiastres } = raw as Record<string, unknown>;
  if (typeof feeBps !== "number" || !Number.isInteger(feeBps) || feeBps < 0 || feeBps > 2_000) return null;
  if (typeof holdDays !== "number" || !Number.isInteger(holdDays) || holdDays < 0 || holdDays > 60) return null;
  if (typeof termsVersion !== "string" || !termsVersion) return null;
  if (feePayer === undefined || feePayer === "seller") return { feeBps, holdDays, termsVersion };
  // An unreadable customer-pays snapshot must never settle at a guessed split.
  if (feePayer !== "customer") return null;
  if (typeof customerFeePiastres !== "number" || !Number.isSafeInteger(customerFeePiastres) || customerFeePiastres < 0) return null;
  return { feeBps, holdDays, termsVersion, feePayer, customerFeePiastres };
}

/**
 * What a storefront order paid (in full, or its COD deposit) on the store's
 * gateway records at placement (design §3): who collects, the gateway
 * snapshot, and for Tallaby Pay the fee and hold snapshot. `settings` is
 * required for Tallaby Pay and ignored otherwise.
 */
export function storeGatewayOrderMetadata(
  gateway: { provider: StoreGatewayProvider; integrationId: string },
  settings: { feeBps: number; holdDays: number } | null,
  /** F-100j: the surcharge the shopper pays on top (customer-pays orders only). */
  customerFee: { feePiastres: number } | null = null,
): {
  paymentCollector: "seller" | "tallaby";
  paymentGateway: { provider: StoreGatewayProvider; integrationId: string };
  tallabyPay?: TallabyPayOrderSnapshot;
} {
  const paymentCollector = gatewayCollector(gateway.provider);
  const paymentGateway = { provider: gateway.provider, integrationId: gateway.integrationId };
  if (gateway.provider !== "tallaby_pay") return { paymentCollector, paymentGateway };
  if (!settings) throw new Error("A Tallaby Pay order needs the fee settings snapshot");
  return {
    paymentCollector,
    paymentGateway,
    tallabyPay: {
      feeBps: settings.feeBps,
      holdDays: settings.holdDays,
      termsVersion: TALLABY_PAY_TERMS_VERSION,
      ...(customerFee && { feePayer: "customer" as const, customerFeePiastres: customerFee.feePiastres }),
    },
  };
}

/**
 * The one Callback URL of Tallaby's EasyKash account (design §2.3), set once
 * by the owner in EasyKash. Null without a public https backend, like the
 * seller gateways' webhook URL. The route itself is F-100c.
 */
export function tallabyPayCallbackUrl(
  base: string | undefined = process.env.STORE_PAYMENTS_WEBHOOK_BASE_URL || process.env.BACKEND_API_URL,
): string | null {
  const root = base?.trim().replace(/\/+$/, "");
  if (!root || !/^https:\/\//i.test(root)) return null;
  return `${root}/api/webhooks/tallaby-pay/easykash`;
}

/**
 * The EasyKash account and latest reference of an order's own snapshot
 * (`paymentGateway`, or `deposit.gateway` for a deposit), for the Inquiry
 * API. Null unless the snapshot is EasyKash and the reference is this
 * order's (docs/easykash.md §4.4).
 */
export function readEasykashInquiryTarget(
  orderId: string,
  metadata: unknown,
  purpose: "order" | "deposit",
): { integrationId: string; reference: string } | null {
  const meta = purpose === "deposit" ? readOrderDepositGateway(metadata) : readOrderGateway(metadata);
  if (meta?.provider !== "easykash" || !meta.lastReference) return null;
  const refOrderId = parseGatewayReference(meta.lastReference);
  if (!refOrderId || refOrderId.toLowerCase() !== orderId.toLowerCase()) return null;
  return { integrationId: meta.integrationId, reference: meta.lastReference };
}

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

/**
 * EasyKash's Callback URL (docs/easykash.md §4.2). EasyKash keeps one per
 * account, set once by the seller, so it names the seller, not the
 * integration: it survives a disconnect and reconnect. The seller id is only
 * a routing hint; the store's HMAC secret is the proof. Null without a public
 * https backend, like storeGatewayWebhookUrl.
 */
export function easykashCallbackUrl(
  sellerId: string,
  base: string | undefined = process.env.STORE_PAYMENTS_WEBHOOK_BASE_URL || process.env.BACKEND_API_URL,
): string | null {
  if (!UUID.test(sellerId)) return null;
  const root = storeGatewayWebhookUrl("easykash", base);
  return root ? `${root}/${sellerId.toLowerCase()}` : null;
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
