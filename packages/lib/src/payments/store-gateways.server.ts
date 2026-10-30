import { and, db, eq, inArray, orders, payments, sql, storeIntegrations, storeSettingsAudit } from "@workspace/db";
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
import { createKashierSession } from "../kashier/kashier";
import { buildBillingData, PAYMOB_EGYPT_BASE_URL } from "../paymob/paymob.lib";
import { buildPaymobCheckoutUrl } from "../paymob/paymob";
import {
  STORE_GATEWAY_PROVIDERS,
  buildGatewayReference,
  isCompleteSecret,
  isStoreGatewayProvider,
  parseGatewayReference,
  parseKashierWebhook,
  parsePaymobWebhook,
  readGatewayConfig,
  readOrderGateway,
  storeGatewayReturnPath,
  storeGatewayWebhookUrl,
  toPiastres,
  validateGatewayInput,
  type GatewayEvent,
  type GatewayInputError,
  type GatewayMode,
  type GatewayWebhookRequest,
  type KashierSecret,
  type OrderGatewayMeta,
  type PaymobSecret,
  type StoreGatewayConfig,
  type StoreGatewayProvider,
  type StoreGatewaySecret,
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
  /** At most one row: one gateway per store. */
  connected: (StoreIntegrationSummary & { provider: StoreGatewayProvider }) | null;
  /** False when no public backend URL is configured: gateways can't be connected. */
  webhooksReady: boolean;
};

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
      ),
    );
  const row = rows.find((r) => isStoreGatewayProvider(r.provider));
  return {
    connected: row ? { ...toIntegrationSummary(row.provider as StoreGatewayProvider, row), provider: row.provider as StoreGatewayProvider } : null,
    webhooksReady: storeGatewayWebhookUrl("00000000-0000-0000-0000-000000000000") !== null,
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
  if (!isStoreGatewayProvider(provider)) return { success: false, error: "unsupported" };
  if (INTEGRATIONS[provider].availability !== "available") return { success: false, error: "not_available" };

  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const other = STORE_GATEWAY_PROVIDERS.find((p) => p !== provider)!;
  if (await readRow(q, storeId, sellerId, other)) return { success: false, error: "other_gateway_connected" };

  const existing = await readRow(q, storeId, sellerId, provider);
  const saved = existing ? decryptSecret(provider, storeId, existing.secret) : null;
  const validated = validateGatewayInput(provider, rawInput, saved);
  if (!validated.success) return { success: false, error: validated.error };

  // Webhooks are the only way an order is marked paid; without a public URL
  // a connected gateway would take money that Tallaby never sees.
  if (!storeGatewayWebhookUrl(existing?.id ?? "00000000-0000-0000-0000-000000000000")) {
    return { success: false, error: "webhooks_not_configured" };
  }

  // Checked outside the transaction: a slow gateway must not hold the store row lock.
  const check = await verifyGatewayKeys(provider, validated.secret, validated.mode, callOptions);
  if (check !== "ok") return { success: false, error: check };

  return q.transaction(async (tx) => {
    const locked = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!locked) return { success: false, error: "not_found" } as const;
    if (locked.status !== "active") return { success: false, error: "store_read_only" } as const;
    if (await readRow(tx, storeId, sellerId, other)) return { success: false, error: "other_gateway_connected" } as const;

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
      data: { connected: { ...toIntegrationSummary(provider, row!), provider }, webhooksReady: true },
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
  if (!isStoreGatewayProvider(provider)) return { success: false, error: "unsupported" };

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
 * Creates a 1 EGP checkout with the keys (never paid; it simply expires).
 * 401/403/4xx → the keys are wrong; network, timeout or 5xx → try again.
 */
export async function verifyGatewayKeys(
  provider: StoreGatewayProvider,
  secret: StoreGatewaySecret,
  mode: GatewayMode,
  { fetch: fetchImpl = fetch, timeoutMs = 15_000 }: GatewayCallOptions = {},
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
 * resolves the store from the request host and passes its owner.
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
  return row ? { provider: row.provider as StoreGatewayProvider, integrationId: row.id } : null;
}

type GatewayAccount = {
  integrationId: string;
  storeId: string;
  sellerId: string;
  provider: StoreGatewayProvider;
  config: StoreGatewayConfig;
  secret: StoreGatewaySecret;
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
  const secret = decryptSecret(row.provider, row.storeId, row.secret);
  if (!config || !secret) return null;
  return { integrationId: row.id, storeId: row.storeId, sellerId: row.sellerId, provider: row.provider, config, secret };
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
}): Promise<IntegrationResult<{ checkoutUrl: string }, StoreGatewayCheckoutError>> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, input.orderId), eq(orders.userId, input.userId)),
    with: { user: true, userAddress_shippingAddressId: true },
  });
  if (
    !order ||
    order.paymentMethod !== "online_payment" ||
    !["pending", "failed"].includes(order.paymentStatus ?? "pending") ||
    !["payment_processing", "pending"].includes(order.status ?? "")
  ) {
    return { success: false, error: "not_payable" };
  }
  const meta = readOrderGateway(order.metadata);
  if (!meta || !order.storeId) return { success: false, error: "gateway_missing" };
  const account = await loadGatewayAccount(meta.integrationId);
  if (!account || account.storeId !== order.storeId || account.provider !== meta.provider) {
    return { success: false, error: "gateway_missing" };
  }
  const webhookUrl = storeGatewayWebhookUrl(account.integrationId);
  if (!webhookUrl) return { success: false, error: "gateway_missing" };

  const reference = buildGatewayReference(order.id);
  const returnUrl = `${input.siteUrl.replace(/\/+$/, "")}${storeGatewayReturnPath(order.id)}`;
  const currency = order.currency || "EGP";
  const description = `Order ${order.orderNumber}`;

  try {
    if (account.provider === "paymob") {
      const secret = account.secret as PaymobSecret;
      const address = order.userAddress_shippingAddressId;
      const response = await fetch(`${PAYMOB_EGYPT_BASE_URL}/v1/intention/`, {
        method: "POST",
        headers: { Authorization: `Token ${secret.secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          paymobIntentionBody(secret, {
            amountPiastres: toPiastres(order.totalAmount),
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

    const secret = account.secret as KashierSecret;
    const session = await createKashierSession(
      { ...secret, mode: account.config.mode, webhookUrl, allowedMethods: "card,wallet" },
      {
        orderReference: reference,
        amount: order.totalAmount,
        currency,
        customerEmail: order.user?.email,
        customerReference: order.userId,
        merchantRedirect: returnUrl,
        display: input.locale === "ar" ? "ar" : "en",
        description,
        metaData: { orderId: order.id, orderNumber: String(order.orderNumber) },
      },
    );
    return { success: true, data: { checkoutUrl: session.sessionUrl } };
  } catch (error) {
    // Never log the error body: it can echo the keys' owner details.
    console.error("[store-gateway] checkout failed", { provider: account.provider, name: (error as Error)?.name });
    return { success: false, error: "gateway_failed" };
  }
}

/* ------------------------------------------------------------------ */
/* Webhooks                                                            */
/* ------------------------------------------------------------------ */

export type GatewayWebhookResult = {
  status: 200 | 401 | 400 | 404 | 409;
  body: Record<string, unknown>;
  /** Set when this call moved the order to paid: the caller sends the emails. */
  paidOrderId?: string;
};

type ApplyOutcome = "paid" | "failed" | "pending" | "duplicate" | "mismatch" | "not_found" | "foreign";

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

  const parsed =
    account.provider === "paymob"
      ? parsePaymobWebhook(req, account.secret as PaymobSecret)
      : parseKashierWebhook(req, account.secret as KashierSecret);

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
  const meta = readOrderGateway(order.metadata);
  if (order.storeId !== account.storeId || meta?.integrationId !== account.integrationId) {
    console.error("[store-gateway] event for another store's order", { integrationId: account.integrationId, orderId });
    return "foreign";
  }

  const now = new Date().toISOString();
  const amount = (event.amountPiastres / 100).toFixed(2);
  // Every seller can sign any transaction id with their own keys, so the id is
  // namespaced by the integration: one store can never claim or settle
  // another store's payment row.
  const transactionId = `store:${account.integrationId}:${event.transactionId}`;
  const paymentData = { provider: account.provider, collector: "seller", integrationId: account.integrationId, event };
  let outcome: ApplyOutcome = "pending";

  await db.transaction(async (tx) => {
    // Gateways retry and may deliver concurrently; payments has no unique
    // transaction_id, so serialise on it (same as the Kashier route).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${transactionId}))`);
    const existing = await tx.query.payments.findFirst({
      where: and(eq(payments.transactionId, transactionId), eq(payments.orderId, orderId)),
    });
    if (existing && (existing.status === "paid" || existing.status === "failed")) {
      outcome = "duplicate";
      return;
    }
    if (existing && event.status === "PENDING") {
      outcome = "duplicate";
      return;
    }

    const writePayment = async (values: { status: "paid" | "failed" | "pending"; errorMessage?: string; capturedAt?: string }) => {
      const row = {
        orderId,
        amount,
        method: "online_payment",
        currency: event.currency || order.currency || "EGP",
        transactionId,
        paymentData,
        ...values,
      };
      if (existing) await tx.update(payments).set({ ...row, updatedAt: now }).where(eq(payments.id, existing.id));
      else await tx.insert(payments).values(row);
    };

    if (event.status === "SUCCESS") {
      const expected = toPiastres(order.totalAmount);
      if (event.amountPiastres !== expected || (order.currency && event.currency !== order.currency)) {
        // Paid, but not what we asked for: never confirm; keep it for review.
        await writePayment({
          status: "pending",
          errorMessage: `Amount mismatch: expected ${(expected / 100).toFixed(2)} ${order.currency}, received ${amount} ${event.currency}`,
        });
        outcome = "mismatch";
        return;
      }
      const [claimed] = await tx
        .update(orders)
        .set({ paymentStatus: "paid", status: "confirmed", paidAt: now, processedAt: now, updatedAt: now })
        .where(
          and(
            eq(orders.id, orderId),
            inArray(orders.paymentStatus, ["pending", "failed"]),
            // A cancelled order stays cancelled; the money is kept for review.
            inArray(orders.status, ["payment_processing", "pending"]),
          ),
        )
        .returning({ id: orders.id });
      if (!claimed) {
        const current = await tx.query.orders.findFirst({ where: eq(orders.id, orderId), columns: { paymentStatus: true } });
        if (current?.paymentStatus === "paid") {
          outcome = "duplicate";
          return;
        }
        // Paid on the gateway, but the order was cancelled meanwhile: record it
        // (the seller refunds from their gateway) and never confirm the order.
        await writePayment({ status: "pending", errorMessage: "Paid after the order was cancelled; refund from the gateway" });
        outcome = "mismatch";
        return;
      }
      await writePayment({ status: "paid", capturedAt: now });
      outcome = "paid";
      return;
    }

    if (event.status === "FAILURE") {
      await tx
        .update(orders)
        .set({ paymentStatus: "failed", updatedAt: now })
        .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "pending")));
      await writePayment({ status: "failed", errorMessage: "Payment failed" });
      outcome = "failed";
      return;
    }

    await writePayment({ status: "pending" });
    outcome = "pending";
  });

  return outcome;
}
