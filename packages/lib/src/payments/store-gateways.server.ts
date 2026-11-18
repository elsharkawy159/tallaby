import { and, db, eq, inArray, not, orders, payments, sql, storeIntegrations, storeSettingsAudit, stores } from "@workspace/db";
import { chargeOrderPlacementFee } from "@workspace/db/wallet";
import { randomUUID } from "node:crypto";
import { decryptCredentials, encryptCredentials } from "../integrations/crypto.server";
import { INTEGRATIONS } from "../integrations/registry";
import {
  ownStoreStatus,
  summaryColumns,
  toIntegrationSummary,
  UUID_RE,
  type IntegrationResult,
  type Queryable,
  type StoreIntegrationSummary,
} from "../integrations/store-integrations.server";
import {
  buildEasykashPayBody,
  easykashVoucherFromInquiry,
  isEasykashPaidStatus,
  readEasykashCallback,
  verifyEasykashSignature,
  type EasykashVoucher,
} from "../easykash/easykash.lib";
import { EasykashApiError, createEasykashPayLink, inquireEasykashPayment } from "../easykash/easykash.server";
import { createKashierSession } from "../kashier/kashier";
import { isDepositPending } from "../orders/cod-deposit.lib";
import { notifyDeposit } from "../orders/cod-deposit.server";
import { buildBillingData, PAYMOB_EGYPT_BASE_URL } from "../paymob/paymob.lib";
import { buildPaymobCheckoutUrl } from "../paymob/paymob";
import { isSwitchOn } from "../stores/platform-switches.server";
import { getTallabyPaySettings } from "../tallaby-pay/settings.server";
import type { TallabyPaySettings } from "../tallaby-pay/settings.lib";
import { parseStoreCurrency } from "../utils/formatPrice";
import {
  STORE_GATEWAY_PROVIDERS,
  TALLABY_PAY_TERMS_VERSION,
  assertNeverProvider,
  buildGatewayReference,
  buildTallabyPayReference,
  easykashCallbackUrl,
  isCompleteSecret,
  isStoreGatewayProvider,
  parseGatewayReference,
  parseKashierWebhook,
  parsePaymobWebhook,
  readEasykashInquiryTarget,
  readGatewayConfig,
  readOrderDepositGateway,
  readOrderGateway,
  storeGatewayReturnPath,
  storeGatewayWebhookUrl,
  tallabyPayCallbackUrl,
  toPiastres,
  validateGatewayInput,
  type GatewayEvent,
  type GatewayInputError,
  type GatewayMode,
  type EasykashSecret,
  type GatewayWebhookRequest,
  type KashierSecret,
  type OrderGatewayMeta,
  type PaymobSecret,
  type StoreGatewayConfig,
  type StoreGatewayProvider,
  type StoreGatewaySecret,
  type TallabyPayGatewayConfig,
} from "./store-gateways.lib";

/**
 * The seller's own payment gateway (ROADMAP.md F-39). Server-only. Modelled
 * on integrations/bosta.server.ts: the keys are encrypted with the store id +
 * provider as AAD, never selected into a summary, never logged and never sent
 * to a client. Every seller-facing function takes the session seller and an
 * explicit store id (CLAUDE.md rule 5).
 */

type FetchLike = typeof fetch;
export type GatewayCallOptions = { fetch?: FetchLike; timeoutMs?: number };

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export type StoreGatewayOverview = {
  /** At most one row: one gateway per store. A turned-off Tallaby Pay row is not "connected". */
  connected: (StoreIntegrationSummary & { provider: StoreGatewayProvider }) | null;
  /** False when no public backend URL is configured: gateways can't be connected. */
  webhooksReady: boolean;
  /** Tallaby Pay's live fee, hold, minimum withdrawal and launch switch, for its Turn on sheet (F-100). */
  tallabyPay: TallabyPaySettings;
};

/**
 * Turning Tallaby Pay off keeps its row as `disconnected` (design §2.1, so
 * orders already placed still settle); that row is not the store's gateway.
 */
function activeGatewayRow() {
  return not(and(eq(storeIntegrations.provider, "tallaby_pay"), eq(storeIntegrations.status, "disconnected"))!);
}

export async function getStoreGatewayOverview(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<StoreGatewayOverview | null> {
  if (!UUID_RE.test(storeId)) return null;
  if (!(await ownStoreStatus(q, sellerId, storeId))) return null;
  const rows = await q
    .select(summaryColumns)
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.sellerId, sellerId),
        inArray(storeIntegrations.provider, [...STORE_GATEWAY_PROVIDERS]),
        activeGatewayRow(),
      ),
    );
  const tallabyPay = await getTallabyPaySettings(q);
  const row = rows.find((r) => isStoreGatewayProvider(r.provider));
  return {
    connected: row ? { ...toIntegrationSummary(row.provider as StoreGatewayProvider, row), provider: row.provider as StoreGatewayProvider } : null,
    webhooksReady: storeGatewayWebhookUrl("00000000-0000-0000-0000-000000000000") !== null,
    tallabyPay,
  };
}

export type ConnectGatewayError =
  | "not_found"
  | "store_read_only"
  | "unsupported"
  | "not_available"
  | "other_gateway_connected"
  | "webhooks_not_configured"
  | "keys_rejected"
  | "gateway_unreachable"
  | GatewayInputError;

export type TallabyPayToggleError =
  | "not_found"
  | "store_read_only"
  /** The `tallaby_pay_live` launch switch is off (design §2.1, §10). */
  | "not_live"
  | "terms_required"
  /** v1 is EGP stores only. */
  | "currency_not_supported"
  | "other_gateway_connected";

async function readRow(q: Queryable, storeId: string, sellerId: string, provider: StoreGatewayProvider) {
  const [row] = await q
    .select({ id: storeIntegrations.id, secret: storeIntegrations.credentialsEncrypted, config: storeIntegrations.config })
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, provider)),
    )
    .limit(1);
  return row ?? null;
}

/** One gateway per store: true when any of the other providers has a row (a turned-off Tallaby Pay row does not count). */
async function hasOtherGateway(q: Queryable, storeId: string, sellerId: string, others: StoreGatewayProvider[]) {
  if (others.length === 0) return false;
  const [row] = await q
    .select({ id: storeIntegrations.id })
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.sellerId, sellerId),
        inArray(storeIntegrations.provider, others),
        activeGatewayRow(),
      ),
    )
    .limit(1);
  return Boolean(row);
}

function decryptSecret(provider: StoreGatewayProvider, storeId: string, payload: string | null): StoreGatewaySecret | null {
  if (!payload) return null;
  try {
    const secret = decryptCredentials(payload, { storeId, provider });
    return isCompleteSecret(provider, secret) ? secret : null;
  } catch {
    return null;
  }
}

/**
 * Connects (or updates the keys of) the store's gateway. The keys are checked
 * with the gateway first, by creating a 1 EGP checkout that is never paid, and
 * only then saved. Blank key fields keep the saved ones. Only one gateway per
 * store: connecting the other one is refused until this one is disconnected.
 */
export async function connectStoreGateway(
  sellerId: string,
  actorId: string,
  storeId: string,
  provider: string,
  rawInput: unknown,
  options: GatewayCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<StoreGatewayOverview, ConnectGatewayError>> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  // Tallaby Pay has no keys: enableTallabyPay turns it on, with the terms.
  if (!isStoreGatewayProvider(provider) || provider === "tallaby_pay") return { success: false, error: "unsupported" };
  if (INTEGRATIONS[provider].availability !== "available") return { success: false, error: "not_available" };

  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const others = STORE_GATEWAY_PROVIDERS.filter((p) => p !== provider);
  if (await hasOtherGateway(q, storeId, sellerId, others)) return { success: false, error: "other_gateway_connected" };

  const existing = await readRow(q, storeId, sellerId, provider);
  const saved = existing ? decryptSecret(provider, storeId, existing.secret) : null;
  const validated = validateGatewayInput(provider, rawInput, saved);
  if (!validated.success) return { success: false, error: validated.error };

  // Webhooks are the only way an order is marked paid; without a public URL
  // a connected gateway would take money that Tallaby never sees.
  const resultUrl =
    provider === "easykash"
      ? easykashCallbackUrl(sellerId)
      : storeGatewayWebhookUrl(existing?.id ?? "00000000-0000-0000-0000-000000000000");
  if (!resultUrl) return { success: false, error: "webhooks_not_configured" };

  // Checked outside the transaction: a slow gateway must not hold the store row lock.
  const check = await verifyGatewayKeys(provider, validated.secret, validated.mode, callOptions);
  if (check !== "ok") return { success: false, error: check };

  return q.transaction(async (tx) => {
    const locked = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!locked) return { success: false, error: "not_found" } as const;
    if (locked.status !== "active") return { success: false, error: "store_read_only" } as const;
    if (await hasOtherGateway(tx, storeId, sellerId, others)) return { success: false, error: "other_gateway_connected" } as const;

    const previous = readGatewayConfig((await readRow(tx, storeId, sellerId, provider))?.config);
    const sameKeys = saved && JSON.stringify(saved) === JSON.stringify(validated.secret) && previous?.mode === validated.mode;
    const config: StoreGatewayConfig = {
      mode: validated.mode,
      keyHint: validated.keyHint,
      // New keys must prove themselves with a signed webhook again.
      ...(sameKeys && previous?.webhookVerifiedAt && { webhookVerifiedAt: previous.webhookVerifiedAt }),
    };
    const credentialsEncrypted = encryptCredentials(validated.secret, { storeId, provider });

    const [row] = await tx
      .insert(storeIntegrations)
      .values({
        storeId,
        sellerId,
        provider,
        status: "connected",
        config,
        credentialsEncrypted,
        connectedBy: actorId,
        connectedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [storeIntegrations.storeId, storeIntegrations.provider],
        set: {
          status: "connected",
          config,
          credentialsEncrypted,
          lastError: null,
          connectedBy: actorId,
          connectedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning(summaryColumns);

    // Payment destinations are a fraud target after an account takeover
    // (PLAN.md §8.6): every change is audited, keys never.
    await tx.insert(storeSettingsAudit).values({
      storeId,
      sellerId,
      actorId,
      section: "payments",
      action: existing ? "gateway_updated" : "gateway_connected",
      changes: { gateway: provider, mode: config.mode, keyHint: `•••${config.keyHint}` },
    });

    return {
      success: true,
      data: { connected: { ...toIntegrationSummary(provider, row!), provider }, webhooksReady: true, tallabyPay: await getTallabyPaySettings(tx) },
    } as const;
  });
}

/**
 * Disconnects the store's gateway: the row (and its keys) is deleted, so
 * checkout stops offering card payment at once. Orders already sent to the
 * gateway can no longer be confirmed by webhook (their result is ignored);
 * they stay awaiting payment. Known limit, ROADMAP.md F-39f.
 */
export async function disconnectStoreGateway(
  sellerId: string,
  actorId: string,
  storeId: string,
  provider: string,
  q: Queryable = db,
): Promise<IntegrationResult<null, "not_found" | "store_read_only" | "unsupported">> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  // Tallaby Pay's row is kept when it is turned off (disableTallabyPay).
  if (!isStoreGatewayProvider(provider) || provider === "tallaby_pay") return { success: false, error: "unsupported" };

  return q.transaction(async (tx) => {
    const store = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;
    const deleted = await tx
      .delete(storeIntegrations)
      .where(
        and(
          eq(storeIntegrations.storeId, storeId),
          eq(storeIntegrations.sellerId, sellerId),
          eq(storeIntegrations.provider, provider),
        ),
      )
      .returning({ id: storeIntegrations.id });
    if (deleted.length > 0) {
      await tx.insert(storeSettingsAudit).values({
        storeId,
        sellerId,
        actorId,
        section: "payments",
        action: "gateway_disconnected",
        changes: { gateway: provider },
      });
    }
    return { success: true, data: null } as const;
  });
}

/**
 * Turns Tallaby Pay on for a store (ROADMAP.md F-100b, design §2.1): no keys.
 * The session seller must own the active store, the store must sell in EGP,
 * the seller must have ticked the terms, the `tallaby_pay_live` switch must be
 * on, and no other gateway may be connected (one gateway per store, §2.2).
 * Writes the row (no credentials) and a `store_settings_audit` entry. Checks
 * run again under the store row lock.
 */
export async function enableTallabyPay(
  sellerId: string,
  actorId: string,
  storeId: string,
  input: { termsAccepted: boolean },
  q: Queryable = db,
): Promise<IntegrationResult<StoreGatewayOverview, TallabyPayToggleError>> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (input.termsAccepted !== true) return { success: false, error: "terms_required" };
  const provider = "tallaby_pay" as const;
  const others = STORE_GATEWAY_PROVIDERS.filter((p) => p !== provider);

  return q.transaction(async (tx) => {
    const [store] = await tx
      .select({ status: stores.status, settings: stores.settings })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), sql`${stores.deletedAt} IS NULL`))
      .for("update");
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;
    if (parseStoreCurrency(store.settings).currency !== "EGP") return { success: false, error: "currency_not_supported" } as const;
    const settings = await getTallabyPaySettings(tx);
    if (!settings.live) return { success: false, error: "not_live" } as const;
    if (await hasOtherGateway(tx, storeId, sellerId, others)) return { success: false, error: "other_gateway_connected" } as const;

    const now = new Date().toISOString();
    const config: TallabyPayGatewayConfig = {
      mode: "live",
      termsVersion: TALLABY_PAY_TERMS_VERSION,
      termsAcceptedAt: now,
      enabledAt: now,
    };
    const [row] = await tx
      .insert(storeIntegrations)
      .values({
        storeId,
        sellerId,
        provider,
        status: "connected",
        config,
        credentialsEncrypted: null,
        connectedBy: actorId,
        connectedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [storeIntegrations.storeId, storeIntegrations.provider],
        set: {
          status: "connected",
          config,
          credentialsEncrypted: null,
          lastError: null,
          connectedBy: actorId,
          connectedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning(summaryColumns);

    await tx.insert(storeSettingsAudit).values({
      storeId,
      sellerId,
      actorId,
      section: "payments",
      action: "tallaby_pay_enabled",
      changes: { gateway: provider, termsVersion: TALLABY_PAY_TERMS_VERSION, feeBps: settings.feeBps, holdDays: settings.holdDays },
    });

    return {
      success: true,
      data: { connected: { ...toIntegrationSummary(provider, row!), provider }, webhooksReady: true, tallabyPay: settings },
    } as const;
  });
}

/**
 * Turns Tallaby Pay off: checkout stops offering it at once, but the row is
 * kept as `disconnected` (design §2.1), so orders already sent to EasyKash
 * still settle and the earnings keep working. Audited. Never refused by the
 * launch switch: a seller can always turn it off.
 */
export async function disableTallabyPay(
  sellerId: string,
  actorId: string,
  storeId: string,
  q: Queryable = db,
): Promise<IntegrationResult<null, "not_found" | "store_read_only">> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  return q.transaction(async (tx) => {
    const store = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;
    const updated = await tx
      .update(storeIntegrations)
      .set({ status: "disconnected", updatedAt: sql`now()` })
      .where(
        and(
          eq(storeIntegrations.storeId, storeId),
          eq(storeIntegrations.sellerId, sellerId),
          eq(storeIntegrations.provider, "tallaby_pay"),
          eq(storeIntegrations.status, "connected"),
        ),
      )
      .returning({ id: storeIntegrations.id });
    if (updated.length > 0) {
      await tx.insert(storeSettingsAudit).values({
        storeId,
        sellerId,
        actorId,
        section: "payments",
        action: "tallaby_pay_disabled",
        changes: { gateway: "tallaby_pay" },
      });
    }
    return { success: true, data: null } as const;
  });
}

/** Tallaby's own EasyKash API key (design §2.3). Server-only env, never `NEXT_PUBLIC_*`, never logged. */
function tallabyEasykashApiKey(): string | null {
  const key = process.env.TALLABY_EASYKASH_API_KEY?.trim();
  return key ? key : null;
}

/** True when this app has Tallaby's EasyKash API key; storefront checkout hides Tallaby Pay without it. */
export function isTallabyPayConfigured(): boolean {
  return tallabyEasykashApiKey() !== null;
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Paymob and Kashier: creates a 1 EGP checkout with the keys (never paid; it
 * simply expires). 401/403/4xx → the keys are wrong; network, timeout or 5xx
 * → try again. EasyKash: a Payment Inquiry for a reference that never
 * existed (nothing is created); only 401/403 mean a wrong key, since its
 * answer for an unknown reference is not documented (docs/easykash.md §1.10).
 */
export async function verifyGatewayKeys(
  provider: StoreGatewayProvider,
  secret: StoreGatewaySecret,
  mode: GatewayMode,
  options: GatewayCallOptions = {},
): Promise<"ok" | "keys_rejected" | "gateway_unreachable"> {
  switch (provider) {
    case "paymob":
    case "kashier":
      return verifyCheckoutKeys(provider, secret, mode, options);
    case "easykash":
      return verifyEasykashKey(secret as EasykashSecret, options);
    case "tallaby_pay":
      // No keys to check; connectStoreGateway refuses Tallaby Pay before this.
      return "keys_rejected";
    default:
      return assertNeverProvider(provider);
  }
}

async function verifyEasykashKey(
  secret: EasykashSecret,
  { fetch: fetchImpl = fetch, timeoutMs = 15_000 }: GatewayCallOptions,
): Promise<"ok" | "keys_rejected" | "gateway_unreachable"> {
  const probe = `tallaby-keycheck-${randomUUID()}`;
  try {
    await inquireEasykashPayment(secret.apiKey, probe, { fetch: fetchImpl, timeoutMs });
    return "ok";
  } catch (error) {
    if (!(error instanceof EasykashApiError)) return "gateway_unreachable";
    if (error.status === 401 || error.status === 403) return "keys_rejected";
    return error.status >= 500 ? "gateway_unreachable" : "ok";
  }
}

async function verifyCheckoutKeys(
  provider: "paymob" | "kashier",
  secret: StoreGatewaySecret,
  mode: GatewayMode,
  { fetch: fetchImpl = fetch, timeoutMs = 15_000 }: GatewayCallOptions,
): Promise<"ok" | "keys_rejected" | "gateway_unreachable"> {
  try {
    const response = await withTimeout(timeoutMs, (signal) =>
      provider === "paymob"
        ? fetchImpl(`${PAYMOB_EGYPT_BASE_URL}/v1/intention/`, {
            method: "POST",
            signal,
            headers: { Authorization: `Token ${(secret as PaymobSecret).secretKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(
              paymobIntentionBody(secret as PaymobSecret, {
                amountPiastres: 100,
                currency: "EGP",
                reference: `tallaby_check_${Date.now().toString(36)}`,
                itemName: "Tallaby connection check",
                billing: buildBillingData({
                  fullName: "Tallaby Check",
                  phone: "01000000000",
                  email: "check@tallaby.com",
                  addressLine1: "NA",
                  city: "Cairo",
                  state: "Cairo",
                }),
              }),
            ),
          })
        : fetchImpl(`${mode === "live" ? "https://api.kashier.io" : "https://test-api.kashier.io"}/v3/payment/sessions`, {
            method: "POST",
            signal,
            headers: {
              Authorization: (secret as KashierSecret).secretKey,
              "api-key": (secret as KashierSecret).paymentApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              merchantId: (secret as KashierSecret).merchantId,
              order: `tallaby_check_${Date.now().toString(36)}`,
              amount: "1.00",
              currency: "EGP",
              type: "one-time",
              allowedMethods: "card",
              merchantRedirect: "https://tallaby.com",
              display: "en",
              // Kashier rejects a session without customer.reference (400 "customer" is required).
              customer: { reference: "tallaby_check" },
            }),
          }),
    );
    if (response.ok) return "ok";
    return response.status >= 500 ? "gateway_unreachable" : "keys_rejected";
  } catch {
    return "gateway_unreachable";
  }
}

/* ------------------------------------------------------------------ */
/* Storefront checkout                                                 */
/* ------------------------------------------------------------------ */

/**
 * The store's connected gateway for checkout, or null. No secrets. The caller
 * resolves the store from the request host and passes its owner. Tallaby Pay
 * counts only while its launch switch is on (design §10).
 */
export async function getStorefrontGateway(storeId: string, sellerId: string, q: Queryable = db): Promise<OrderGatewayMeta | null> {
  if (!UUID_RE.test(storeId)) return null;
  const rows = await q
    .select({ id: storeIntegrations.id, provider: storeIntegrations.provider, config: storeIntegrations.config })
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.sellerId, sellerId),
        eq(storeIntegrations.status, "connected"),
        inArray(storeIntegrations.provider, [...STORE_GATEWAY_PROVIDERS]),
      ),
    );
  const row = rows.find((r) => isStoreGatewayProvider(r.provider) && readGatewayConfig(r.config));
  if (!row) return null;
  if (row.provider === "tallaby_pay" && !(await isSwitchOn("tallaby_pay_live", q))) return null;
  return { provider: row.provider as StoreGatewayProvider, integrationId: row.id };
}

type GatewayAccount = {
  integrationId: string;
  storeId: string;
  sellerId: string;
  provider: StoreGatewayProvider;
  status: string;
  config: StoreGatewayConfig;
  /** The store's own keys; null only for Tallaby Pay, which pays on Tallaby's account. */
  secret: StoreGatewaySecret | null;
};

/** The account behind an integration id (checkout and webhooks). Server-only. */
async function loadGatewayAccount(integrationId: string, q: Queryable = db): Promise<GatewayAccount | null> {
  if (!UUID_RE.test(integrationId)) return null;
  const [row] = await q
    .select({
      id: storeIntegrations.id,
      storeId: storeIntegrations.storeId,
      sellerId: storeIntegrations.sellerId,
      provider: storeIntegrations.provider,
      status: storeIntegrations.status,
      config: storeIntegrations.config,
      secret: storeIntegrations.credentialsEncrypted,
    })
    .from(storeIntegrations)
    .where(eq(storeIntegrations.id, integrationId))
    .limit(1);
  if (!row || !isStoreGatewayProvider(row.provider)) return null;
  const config = readGatewayConfig(row.config);
  const keyless = row.provider === "tallaby_pay";
  const secret = keyless ? null : decryptSecret(row.provider, row.storeId, row.secret);
  if (!config || (!keyless && !secret)) return null;
  return {
    integrationId: row.id,
    storeId: row.storeId,
    sellerId: row.sellerId,
    provider: row.provider,
    status: row.status,
    config,
    secret,
  };
}

/** Where the gateway posts payment results for this account, or null without a public https backend. */
function gatewayResultUrl(account: GatewayAccount): string | null {
  switch (account.provider) {
    case "paymob":
    case "kashier":
      return storeGatewayWebhookUrl(account.integrationId);
    case "easykash":
      return easykashCallbackUrl(account.sellerId);
    case "tallaby_pay":
      return tallabyPayCallbackUrl();
    default:
      return assertNeverProvider(account.provider);
  }
}

function paymobIntentionBody(
  secret: PaymobSecret,
  input: {
    amountPiastres: number;
    currency: string;
    reference: string;
    itemName: string;
    billing: ReturnType<typeof buildBillingData>;
    notificationUrl?: string;
    redirectionUrl?: string;
  },
) {
  return {
    amount: input.amountPiastres,
    currency: input.currency,
    payment_methods: [secret.cardIntegrationId, ...(secret.walletIntegrationId ? [secret.walletIntegrationId] : [])],
    items: [{ name: input.itemName.slice(0, 50), amount: input.amountPiastres, description: input.itemName.slice(0, 255), quantity: 1 }],
    billing_data: input.billing,
    special_reference: input.reference,
    ...(input.notificationUrl && { notification_url: input.notificationUrl }),
    ...(input.redirectionUrl && { redirection_url: input.redirectionUrl }),
  };
}

export type StoreGatewayCheckoutError = "not_payable" | "gateway_missing" | "gateway_failed";

/**
 * Starts a card payment for a storefront order on the seller's own gateway.
 * The order must be the caller's (the action checks the user) and carry the
 * gateway snapshot from checkout; the integration must still belong to the
 * order's store. Returns the gateway's hosted checkout URL.
 */
export async function createStoreGatewayCheckout(input: {
  orderId: string;
  userId: string;
  /** The storefront origin the shopper is on, e.g. https://shop.tallaby.com */
  siteUrl: string;
  locale: string;
  /**
   * `deposit`: pay a COD order's deposit (ROADMAP.md F-21) on the gateway
   * snapshotted at checkout, for the deposit amount only.
   */
  purpose?: "order" | "deposit";
}): Promise<IntegrationResult<{ checkoutUrl: string }, StoreGatewayCheckoutError>> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, input.orderId), eq(orders.userId, input.userId)),
    with: { user: true, userAddress_shippingAddressId: true },
  });
  const isDeposit = input.purpose === "deposit";
  if (
    !order ||
    (isDeposit
      ? !isDepositCheckoutOpen(order)
      : !isOrderCheckoutOpen(order))
  ) {
    return { success: false, error: "not_payable" };
  }
  const meta = isDeposit ? readOrderDepositGateway(order.metadata) : readOrderGateway(order.metadata);
  if (!meta || !order.storeId) return { success: false, error: "gateway_missing" };
  const account = await loadGatewayAccount(meta.integrationId);
  if (!account || account.storeId !== order.storeId || account.provider !== meta.provider) {
    return { success: false, error: "gateway_missing" };
  }
  const webhookUrl = gatewayResultUrl(account);
  if (!webhookUrl) return { success: false, error: "gateway_missing" };

  const reference = account.provider === "tallaby_pay" ? buildTallabyPayReference(order.id) : buildGatewayReference(order.id);
  const siteUrl = input.siteUrl.replace(/\/+$/, "");
  const returnUrl = `${siteUrl}${storeGatewayReturnPath(order.id)}`;
  const currency = order.currency || "EGP";
  const description = isDeposit ? `Deposit, order ${order.orderNumber}` : `Order ${order.orderNumber}`;
  const amount = isDeposit ? (order.depositAmount ?? "0") : order.totalAmount;

  try {
    switch (account.provider) {
      case "paymob": {
        const secret = account.secret as PaymobSecret;
        const address = order.userAddress_shippingAddressId;
        const response = await fetch(`${PAYMOB_EGYPT_BASE_URL}/v1/intention/`, {
          method: "POST",
          headers: { Authorization: `Token ${secret.secretKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(
            paymobIntentionBody(secret, {
              amountPiastres: toPiastres(amount),
              currency,
              reference,
              itemName: description,
              notificationUrl: webhookUrl,
              redirectionUrl: returnUrl,
              billing: buildBillingData({
                fullName: address?.fullName || order.user?.fullName || "Customer",
                phone: address?.phone || order.user?.phone || "",
                email: order.user?.email || "customer@tallaby.com",
                addressLine1: address?.addressLine1 || "NA",
                addressLine2: address?.addressLine2,
                city: address?.city || "Cairo",
                state: address?.state || "Cairo",
                country: address?.country,
                postalCode: address?.postalCode,
              }),
            }),
          ),
        });
        const body = (await response.json().catch(() => ({}))) as { client_secret?: string };
        if (!response.ok || !body.client_secret) {
          console.error("[store-gateway] paymob intention failed", { status: response.status, integrationId: account.integrationId });
          return { success: false, error: "gateway_failed" };
        }
        return { success: true, data: { checkoutUrl: buildPaymobCheckoutUrl(secret.publicKey, body.client_secret) } };
      }
      case "kashier": {
        const secret = account.secret as KashierSecret;
        const session = await createKashierSession(
          // Egyptian mobile wallets charge EGP only; another currency pays by card.
          { ...secret, mode: account.config.mode, webhookUrl, allowedMethods: currency === "EGP" ? "card,wallet" : "card" },
          {
            orderReference: reference,
            amount,
            currency,
            customerEmail: order.user?.email,
            // Kashier requires customer.reference; fall back to the order if there is no user.
            customerReference: order.userId || order.id,
            merchantRedirect: returnUrl,
            display: input.locale === "ar" ? "ar" : "en",
            description,
            metaData: { orderId: order.id, orderNumber: String(order.orderNumber) },
          },
        );
        return { success: true, data: { checkoutUrl: session.sessionUrl } };
      }
      case "easykash": {
        const address = order.userAddress_shippingAddressId;
        return await startEasykashCheckout({
          orderId: order.id,
          apiKey: (account.secret as EasykashSecret).apiKey,
          integrationId: account.integrationId,
          isDeposit,
          siteUrl,
          reference,
          currency,
          amount,
          buyer: {
            name: address?.fullName || order.user?.fullName,
            email: order.user?.email,
            mobile: address?.phone || order.user?.phone,
          },
        });
      }
      case "tallaby_pay": {
        // Tallaby's own EasyKash account (design §2.4). A new payment attempt
        // needs the row still on and the launch switch on; callbacks for
        // attempts already made settle either way (F-100c).
        if (account.status !== "connected" || !(await isSwitchOn("tallaby_pay_live"))) {
          return { success: false, error: "gateway_missing" };
        }
        const apiKey = tallabyEasykashApiKey();
        if (!apiKey) {
          console.error("[tallaby-pay] TALLABY_EASYKASH_API_KEY is not set", { integrationId: account.integrationId });
          return { success: false, error: "gateway_missing" };
        }
        const address = order.userAddress_shippingAddressId;
        return await startEasykashCheckout({
          orderId: order.id,
          apiKey,
          integrationId: account.integrationId,
          isDeposit,
          siteUrl,
          reference,
          currency,
          amount,
          buyer: {
            name: address?.fullName || order.user?.fullName,
            email: order.user?.email,
            mobile: address?.phone || order.user?.phone,
          },
        });
      }
      default:
        return assertNeverProvider(account.provider);
    }
  } catch (error) {
    // Never log the error body: it can echo the keys' owner details.
    console.error("[store-gateway] checkout failed", { provider: account.provider, name: (error as Error)?.name });
    return { success: false, error: "gateway_failed" };
  }
}

/**
 * EasyKash Pay API (docs/easykash.md §4.4), on the seller's own account or on
 * Tallaby's (Tallaby Pay: the key comes from env, and the body is the same:
 * EGP, cashExpiry 24, no paymentOptions, so instalments stay on, owner
 * 2026-11-18). EGP stores only in v1: EasyKash charges the buyer in EGP
 * whatever currency is sent. The reference is saved on the order first
 * (outside any transaction), so the return page and the sweeper can ask the
 * Inquiry API about it; older references stay valid for callbacks, since
 * they carry the order id.
 */
async function startEasykashCheckout(input: {
  orderId: string;
  apiKey: string;
  /** For logs only. */
  integrationId: string;
  isDeposit: boolean;
  siteUrl: string;
  reference: string;
  currency: string;
  amount: string;
  buyer: { name?: string | null; email?: string | null; mobile?: string | null };
}): Promise<IntegrationResult<{ checkoutUrl: string }, StoreGatewayCheckoutError>> {
  if (input.currency !== "EGP") {
    console.error("[store-gateway] easykash needs an EGP store", { integrationId: input.integrationId });
    return { success: false, error: "gateway_missing" };
  }
  // jsonb_set on the snapshot read above: only lastReference changes.
  const path = input.isDeposit ? "{deposit,gateway,lastReference}" : "{paymentGateway,lastReference}";
  await db
    .update(orders)
    .set({ metadata: sql`jsonb_set(${orders.metadata}, ${path}::text[], to_jsonb(${input.reference}::text), true)` })
    .where(eq(orders.id, input.orderId));

  try {
    const { redirectUrl } = await createEasykashPayLink(
      input.apiKey,
      buildEasykashPayBody({
        amountPiastres: toPiastres(input.amount),
        currency: input.currency,
        name: input.buyer.name,
        email: input.buyer.email,
        mobile: input.buyer.mobile,
        // Path form: EasyKash appends its own ?status=… (docs/easykash.md §1.3).
        redirectUrl: `${input.siteUrl}/api/store-payments/return/${encodeURIComponent(input.orderId)}`,
        customerReference: input.reference,
      }),
    );
    return { success: true, data: { checkoutUrl: redirectUrl } };
  } catch (error) {
    // Status only: the body can echo the buyer's or the account's details.
    console.error("[store-gateway] easykash pay failed", {
      integrationId: input.integrationId,
      status: error instanceof EasykashApiError ? error.status : undefined,
      name: (error as Error)?.name,
    });
    return { success: false, error: "gateway_failed" };
  }
}

/** A card order the shopper may still pay (or pay again). */
function isOrderCheckoutOpen(order: Pick<OrderRow, "paymentMethod" | "paymentStatus" | "status">): boolean {
  return (
    order.paymentMethod === "online_payment" &&
    ["pending", "failed"].includes(order.paymentStatus ?? "pending") &&
    ["payment_processing", "pending"].includes(order.status ?? "")
  );
}

export type { EasykashVoucher };

const VOUCHER_INQUIRY_TIMEOUT_MS = 4_000;

/**
 * The Fawry or Aman voucher of an unpaid EasyKash cash payment, for the order
 * page (docs/easykash.md §4.4, §5). The CALLER must already have authorised
 * the viewer for this order (session owner or signed order link) and passes
 * the row it loaded; the account comes from the order's own snapshot and must
 * belong to the order's store (CLAUDE.md rule 5). Asks EasyKash's Inquiry API
 * with the seller's key (never the return URL's forgeable query). Returns
 * only the voucher fields, never the key; any failure is null. Not cached
 * (rule 8).
 */
export async function getEasykashVoucher(
  order: Pick<
    OrderRow,
    "id" | "storeId" | "currency" | "metadata" | "paymentMethod" | "paymentStatus" | "status" | "depositStatus" | "depositAmount"
  >,
  options: GatewayCallOptions = {},
): Promise<EasykashVoucher | null> {
  if (!order.storeId || (order.currency || "EGP") !== "EGP") return null;
  const purpose = isDepositOrder(order) ? "deposit" : "order";
  if (purpose === "deposit" ? !isDepositCheckoutOpen(order) : !isOrderCheckoutOpen(order)) return null;
  const target = readEasykashInquiryTarget(order.id, order.metadata, purpose);
  if (!target) return null;
  try {
    const account = await loadGatewayAccount(target.integrationId);
    if (!account || account.provider !== "easykash" || account.storeId !== order.storeId) return null;
    const inquiry = await inquireEasykashPayment((account.secret as EasykashSecret).apiKey, target.reference, {
      fetch: options.fetch,
      timeoutMs: options.timeoutMs ?? VOUCHER_INQUIRY_TIMEOUT_MS,
    });
    return easykashVoucherFromInquiry(inquiry);
  } catch (error) {
    // Status only: never the key or the answer body (buyer details).
    console.error("[store-gateway] easykash voucher inquiry failed", {
      integrationId: target.integrationId,
      status: error instanceof EasykashApiError ? error.status : undefined,
      name: (error as Error)?.name,
    });
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Webhooks                                                            */
/* ------------------------------------------------------------------ */

export type GatewayWebhookResult = {
  status: 200 | 401 | 400 | 404 | 409 | 500;
  body: Record<string, unknown>;
  /** Set when this call moved the order to paid: the caller sends the emails. */
  paidOrderId?: string;
};

type ApplyOutcome = "paid" | "deposit_paid" | "failed" | "pending" | "duplicate" | "mismatch" | "not_found" | "foreign";

/**
 * `POST /api/webhooks/store-payments/:integrationId` (apps/backend). The
 * signature is checked with THAT store's keys, and the order must belong to
 * that store and name that integration, so a seller signing their own
 * webhooks can never touch another store's order.
 */
export async function handleStoreGatewayWebhook(integrationId: string, req: GatewayWebhookRequest): Promise<GatewayWebhookResult> {
  const account = await loadGatewayAccount(integrationId);
  // Unknown or disconnected: ack, so the gateway stops retrying a dead URL.
  if (!account) return { status: 200, body: { received: true, outcome: "ignored" } };

  let parsed: ReturnType<typeof parsePaymobWebhook>;
  switch (account.provider) {
    case "paymob":
      parsed = parsePaymobWebhook(req, account.secret as PaymobSecret);
      break;
    case "kashier":
      parsed = parseKashierWebhook(req, account.secret as KashierSecret);
      break;
    case "easykash":
      // EasyKash calls the per-seller URL (handleEasykashCallback), never this one.
      return { status: 200, body: { received: true, outcome: "ignored" } };
    case "tallaby_pay":
      // Tallaby's EasyKash account calls its own platform URL (F-100c), never this one.
      return { status: 200, body: { received: true, outcome: "ignored" } };
    default:
      return assertNeverProvider(account.provider);
  }

  if (parsed.kind === "invalid_signature") {
    console.error("[store-gateway] webhook signature failed", { provider: account.provider, integrationId });
    return { status: 401, body: { error: "Invalid signature" } };
  }
  if (parsed.kind === "invalid_payload") return { status: 400, body: { error: "Invalid webhook payload" } };

  await markWebhookVerified(account);
  if (parsed.kind === "ignored") return { status: 200, body: { received: true, outcome: "ignored" } };

  const orderId = parseGatewayReference(parsed.event.reference);
  if (!orderId) return { status: 200, body: { received: true, outcome: "ignored" } };

  const outcome = await applyGatewayEvent(account, orderId, parsed.event);
  if (outcome === "duplicate") return { status: 409, body: { received: true, duplicate: true } };
  if (outcome === "not_found") return { status: 404, body: { error: "Order not found" } };
  return {
    status: 200,
    body: { received: true, outcome },
    ...(outcome === "paid" && { paidOrderId: orderId }),
  };
}

const IGNORED: GatewayWebhookResult = { status: 200, body: { received: true, outcome: "ignored" } };

/**
 * `GET|POST /api/webhooks/store-payments/easykash/:sellerId` (apps/backend;
 * docs/easykash.md §4.2–§4.3). EasyKash calls one URL per account, and only
 * for paid payments. The order comes from our reference; it must be a store
 * order whose (deposit) gateway snapshot names an EasyKash integration of
 * that seller still connected on the order's store, and the signature must
 * check out with THAT store's HMAC secret, so a callback can only ever change
 * an order of the store whose secret signed it. The payment is then confirmed
 * with the Inquiry API before anything moves. Unknown, foreign or stale
 * callbacks are acked (200) so EasyKash stops retrying; a duplicate is 200 too.
 */
export async function handleEasykashCallback(sellerId: string, raw: unknown): Promise<GatewayWebhookResult> {
  const fields = readEasykashCallback(raw);
  if (!fields.customerReference || !fields.signatureHash) return { status: 400, body: { error: "Invalid callback payload" } };
  if (!UUID_RE.test(sellerId)) return IGNORED;

  const orderId = parseGatewayReference(fields.customerReference);
  if (!orderId) return IGNORED;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, storeId: true, currency: true, metadata: true, paymentMethod: true, depositStatus: true, depositAmount: true },
  });
  if (!order?.storeId) return IGNORED;
  const meta = isDepositOrder(order) ? readOrderDepositGateway(order.metadata) : readOrderGateway(order.metadata);
  if (meta?.provider !== "easykash") return IGNORED;
  const account = await loadGatewayAccount(meta.integrationId);
  // The integration row's seller is the store owner (connectStoreGateway checks it).
  if (
    !account ||
    account.provider !== "easykash" ||
    account.storeId !== order.storeId ||
    account.sellerId.toLowerCase() !== sellerId.toLowerCase()
  ) {
    return IGNORED;
  }
  // v1 is EGP stores only; checkout never sends another currency to EasyKash.
  if ((order.currency || "EGP") !== "EGP") return IGNORED;

  const secret = account.secret as EasykashSecret;
  if (!verifyEasykashSignature(fields, secret.hmacSecret)) {
    // Never the body: it carries the buyer's details.
    console.error("[store-gateway] easykash callback signature failed", { integrationId: account.integrationId });
    return { status: 401, body: { error: "Invalid signature" } };
  }
  await markWebhookVerified(account);

  // The signed string covers no currency or timestamp, so a replay verifies:
  // only EasyKash's own answer, fetched with the seller's key, moves the order.
  let inquiry: Awaited<ReturnType<typeof inquireEasykashPayment>>;
  try {
    inquiry = await inquireEasykashPayment(secret.apiKey, fields.customerReference);
  } catch (error) {
    console.error("[store-gateway] easykash inquiry failed", {
      integrationId: account.integrationId,
      status: error instanceof EasykashApiError ? error.status : undefined,
    });
    return { status: 500, body: { error: "Payment inquiry failed" } };
  }
  if (!inquiry || (isEasykashPaidStatus(inquiry.status) && inquiry.amountPiastres === null)) {
    console.error("[store-gateway] easykash inquiry unreadable", { integrationId: account.integrationId });
    return { status: 500, body: { error: "Payment inquiry failed" } };
  }
  if (!isEasykashPaidStatus(inquiry.status)) return { status: 200, body: { received: true, outcome: "not_paid" } };

  // applyGatewayEvent keeps the exact amount match (owner, 2026-11-18, option A):
  // a different amount is recorded for review and never marked paid.
  const outcome = await applyGatewayEvent(account, orderId, {
    transactionId: `easykash:${fields.easykashRef}`,
    reference: fields.customerReference,
    status: "SUCCESS",
    amountPiastres: inquiry.amountPiastres!,
    currency: order.currency || "EGP",
  });
  if (outcome === "mismatch") {
    console.error("[store-gateway] easykash payment not applied", { integrationId: account.integrationId, orderId });
  }
  if (outcome === "not_found" || outcome === "foreign") return IGNORED;
  if (outcome === "duplicate") return { status: 200, body: { received: true, duplicate: true } };
  return {
    status: 200,
    body: { received: true, outcome },
    ...(outcome === "paid" && { paidOrderId: orderId }),
  };
}

async function markWebhookVerified(account: GatewayAccount) {
  if (account.config.webhookVerifiedAt) return;
  await db
    .update(storeIntegrations)
    .set({
      config: sql`${storeIntegrations.config} || jsonb_build_object('webhookVerifiedAt', now()::text)`,
      lastError: null,
      updatedAt: sql`now()`,
    })
    .where(and(eq(storeIntegrations.id, account.integrationId), sql`NOT (${storeIntegrations.config} ? 'webhookVerifiedAt')`));
}

/** Same lifecycle as Tallaby's Kashier webhook (apps/backend/src/routes/kashier.ts), scoped to one store. */
export async function applyGatewayEvent(account: GatewayAccount, orderId: string, event: GatewayEvent): Promise<ApplyOutcome> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return "not_found";
  // A COD order with a deposit (F-21): the event pays the deposit, never the order.
  if (isDepositOrder(order)) return applyDepositGatewayEvent(account, order, event);
  const meta = readOrderGateway(order.metadata);
  if (order.storeId !== account.storeId || meta?.integrationId !== account.integrationId) {
    console.error("[store-gateway] event for another store's order", { integrationId: account.integrationId, orderId });
    return "foreign";
  }

  // Every seller can sign any transaction id with their own keys, so the id is
  // namespaced by the integration: one store can never claim or settle
  // another store's payment row.
  const transactionId = `store:${account.integrationId}:${event.transactionId}`;
  const paymentData = { provider: account.provider, collector: "seller", integrationId: account.integrationId, event };
  return db.transaction((tx) => claimGatewayPayment(tx, { order, purpose: "order", event, transactionId, paymentData }));
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type GatewayPaymentClaim = {
  /** The order row loaded before the transaction; the claim re-checks its state with guarded updates. */
  order: OrderRow;
  /** `order`: the event pays the whole card order; `deposit`: a COD order's deposit (F-21). */
  purpose: "order" | "deposit";
  event: GatewayEvent;
  /** `payments.transaction_id`, already namespaced by the caller; also the advisory lock key. */
  transactionId: string;
  /** Stored in `payments.payment_data`. Never secrets. */
  paymentData: Record<string, unknown>;
};

/**
 * The paid-state claim shared by every store gateway (the seller's own and
 * Tallaby Pay, design §6.2), inside the caller's transaction: serialise on
 * the transaction id, skip duplicates, require the exact amount, move the
 * order (or its deposit) to paid with a guarded update, write the `payments`
 * row and, for an order, charge the plan order fee. Returns `paid` or
 * `deposit_paid` only when THIS call moved the state, so a caller can add its
 * own writes (Tallaby Pay's sale credit) in the same transaction.
 */
export async function claimGatewayPayment(tx: Tx, claim: GatewayPaymentClaim): Promise<ApplyOutcome> {
  const { order, purpose, event, transactionId, paymentData } = claim;
  const isDeposit = purpose === "deposit";
  const now = new Date().toISOString();
  const amount = (event.amountPiastres / 100).toFixed(2);

  // Gateways retry and may deliver concurrently; payments has no unique
  // transaction_id, so serialise on it (same as the Kashier route).
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${transactionId}))`);
  const existing = await tx.query.payments.findFirst({
    where: and(eq(payments.transactionId, transactionId), eq(payments.orderId, order.id)),
  });
  if (existing && (existing.status === "paid" || existing.status === "failed")) return "duplicate";
  if (existing && event.status === "PENDING") return "duplicate";

  const writePayment = async (values: { status: "paid" | "failed" | "pending"; errorMessage?: string; capturedAt?: string }) => {
    const row = {
      orderId: order.id,
      amount,
      method: isDeposit ? "cod_deposit" : "online_payment",
      currency: event.currency || order.currency || "EGP",
      transactionId,
      paymentData,
      ...values,
    };
    if (existing) await tx.update(payments).set({ ...row, updatedAt: now }).where(eq(payments.id, existing.id));
    else await tx.insert(payments).values(row);
  };

  if (event.status === "SUCCESS") {
    const expected = toPiastres(isDeposit ? (order.depositAmount ?? 0) : order.totalAmount);
    if (event.amountPiastres !== expected || (order.currency && event.currency !== order.currency)) {
      // Paid, but not what we asked for: never confirm; keep it for review.
      await writePayment({
        status: "pending",
        errorMessage: `${isDeposit ? "Deposit amount" : "Amount"} mismatch: expected ${(expected / 100).toFixed(2)} ${order.currency}, received ${amount} ${event.currency}`,
      });
      return "mismatch";
    }
    const [claimed] = isDeposit
      ? await tx
          .update(orders)
          .set({
            depositStatus: "paid",
            depositPaidAt: now,
            updatedAt: now,
            metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || jsonb_build_object('depositPaidVia', 'gateway')`,
          })
          .where(
            and(
              eq(orders.id, order.id),
              inArray(orders.depositStatus, ["awaiting", "reported"]),
              // A cancelled order stays cancelled; the money is kept for review.
              inArray(orders.status, ["pending", "confirmed"]),
            ),
          )
          .returning({ id: orders.id })
      : await tx
          .update(orders)
          .set({ paymentStatus: "paid", status: "confirmed", paidAt: now, processedAt: now, updatedAt: now })
          .where(
            and(
              eq(orders.id, order.id),
              inArray(orders.paymentStatus, ["pending", "failed"]),
              // A cancelled order stays cancelled; the money is kept for review.
              inArray(orders.status, ["payment_processing", "pending"]),
            ),
          )
          .returning({ id: orders.id });
    if (!claimed) {
      const current = await tx.query.orders.findFirst({
        where: eq(orders.id, order.id),
        columns: { paymentStatus: true, depositStatus: true },
      });
      if ((isDeposit ? current?.depositStatus : current?.paymentStatus) === "paid") return "duplicate";
      // Paid on the gateway, but the order was cancelled meanwhile: record it
      // (refunded from the gateway) and never confirm the order.
      await writePayment({
        status: "pending",
        errorMessage: isDeposit
          ? "Deposit paid after the order was cancelled; refund from the gateway"
          : "Paid after the order was cancelled; refund from the gateway",
      });
      return "mismatch";
    }
    await writePayment({ status: "paid", capturedAt: now });
    // A deposit's fee was taken when the COD order was created.
    if (isDeposit) return "deposit_paid";
    // The order is real now: the EGP 5 fee (PLAN.md §13.3; held sellers wait for delivery).
    await chargeOrderPlacementFee(tx, order.id);
    return "paid";
  }

  if (event.status === "FAILURE") {
    if (!isDeposit) {
      await tx
        .update(orders)
        .set({ paymentStatus: "failed", updatedAt: now })
        .where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")));
    }
    await writePayment({ status: "failed", errorMessage: isDeposit ? "Deposit payment failed" : "Payment failed" });
    return "failed";
  }

  await writePayment({ status: "pending" });
  return "pending";
}

/* ------------------------------------------------------------------ */
/* COD deposit (ROADMAP.md F-21)                                       */
/* ------------------------------------------------------------------ */

type OrderRow = NonNullable<Awaited<ReturnType<typeof db.query.orders.findFirst>>>;

/** A COD order that carries a deposit (0166): gateway events for it pay the deposit. */
export function isDepositOrder(order: Pick<OrderRow, "paymentMethod" | "depositStatus" | "depositAmount">): boolean {
  return order.paymentMethod === "cash_on_delivery" && order.depositStatus != null && order.depositAmount != null;
}

/** The customer may still pay the deposit by card: unpaid, and the order is open. */
function isDepositCheckoutOpen(order: Pick<OrderRow, "paymentMethod" | "depositStatus" | "depositAmount" | "status">): boolean {
  return (
    isDepositOrder(order) &&
    isDepositPending(order.depositStatus) &&
    ["pending", "confirmed"].includes(order.status ?? "") &&
    toPiastres(order.depositAmount ?? 0) > 0
  );
}

/**
 * A deposit payment on the seller's own gateway. Same guards as an order
 * payment (store and integration must match, the transaction id is
 * namespaced, serialised on it, amount must equal the deposit), but it only
 * moves `deposit_status` to `paid`: the order keeps its status and stays COD
 * for the remainder, and no fee is charged here (it was taken when the COD
 * order was created). The money is the seller's; nothing is ledgered.
 */
async function applyDepositGatewayEvent(account: GatewayAccount, order: OrderRow, event: GatewayEvent): Promise<ApplyOutcome> {
  const meta = readOrderDepositGateway(order.metadata);
  if (order.storeId !== account.storeId || meta?.integrationId !== account.integrationId) {
    console.error("[store-gateway] deposit event for another store's order", { integrationId: account.integrationId, orderId: order.id });
    return "foreign";
  }

  const transactionId = `store:${account.integrationId}:${event.transactionId}`;
  const paymentData = { provider: account.provider, collector: "seller", integrationId: account.integrationId, purpose: "deposit", event };
  const outcome = await db.transaction((tx) =>
    claimGatewayPayment(tx, { order, purpose: "deposit", event, transactionId, paymentData }),
  );

  if (outcome === "deposit_paid") await notifyDeposit(order.id, "deposit_paid");
  return outcome;
}
