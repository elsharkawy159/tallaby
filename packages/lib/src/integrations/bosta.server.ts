import { randomBytes } from "node:crypto";
import { and, db, eq, sql, storeIntegrations, stores } from "@workspace/db";
import {
  listBostaPickupLocations,
  redactBostaSecrets,
  type BostaCallOptions,
} from "../shipping/bosta/bosta.client.server";
import type { BostaErrorReason } from "../shipping/bosta/bosta-errors.lib";
import type { BostaPickupLocation } from "../shipping/bosta/bosta.types";
import {
  bostaKeyHint,
  readBostaSettings,
  validateBostaKeyInput,
  validateBostaSettingsInput,
  type BostaKeyInputError,
  type BostaSettings,
} from "./bosta.lib";
import { decryptCredentials, encryptCredentials } from "./crypto.server";
import { INTEGRATIONS } from "./registry";
import {
  ownStoreStatus,
  summaryColumns,
  toIntegrationSummary,
  UUID_RE,
  type IntegrationResult,
  type Queryable,
  type StoreIntegrationSummary,
} from "./store-integrations.server";

/**
 * Per-store Bosta account (docs/superpowers/plans/2026-10-26-bosta-shipping.md,
 * BS-05), modelled on meta-capi.server.ts. The seller's API key and the
 * store's webhook token are encrypted with the store id + provider as AAD,
 * never selected into a summary, never logged and never returned to a client.
 */

const PROVIDER = "bosta" as const;

export type BostaSecret = { apiKey: string; webhookToken: string };

/** Everything the shipping code needs for one store. Server-only. */
export type StoreBostaAccount = {
  integrationId: string;
  storeId: string;
  sellerId: string;
  apiKey: string;
  webhookToken: string;
  settings: BostaSettings;
};

/** What the dashboard shows: no key, no token. */
export type BostaOverview = {
  summary: StoreIntegrationSummary;
  settings: BostaSettings;
};

export type SaveBostaKeyError =
  | "not_found"
  | "store_read_only"
  | "not_available"
  | "key_required"
  | "key_rejected"
  | "bosta_unreachable"
  | BostaKeyInputError;

function newWebhookToken(): string {
  return randomBytes(32).toString("base64url");
}

async function readSecret(q: Queryable, storeId: string, sellerId: string): Promise<BostaSecret | null> {
  const [row] = await q
    .select({ secret: storeIntegrations.credentialsEncrypted })
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
    )
    .limit(1);
  if (!row?.secret) return null;
  try {
    const secret = decryptCredentials<BostaSecret>(row.secret, { storeId, provider: PROVIDER });
    return typeof secret.apiKey === "string" && secret.apiKey && typeof secret.webhookToken === "string" ? secret : null;
  } catch {
    return null;
  }
}

async function readSettings(q: Queryable, storeId: string, sellerId: string): Promise<BostaSettings> {
  const [row] = await q
    .select({ config: storeIntegrations.config })
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
    )
    .limit(1);
  return readBostaSettings(row?.config);
}

function keyFailure(reason: BostaErrorReason): "key_rejected" | "bosta_unreachable" {
  return reason === "timeout" || reason === "network" || reason === "server" ? "bosta_unreachable" : "key_rejected";
}

/**
 * Wizard step 3, "Verify key": checks the key against Bosta
 * (`GET /pickup-locations`, read-only) and only then saves it. An empty key
 * re-checks the saved one. The webhook token is made once and kept when the
 * key is replaced, so shipments already at Bosta keep reporting back. When no
 * pickup location is chosen yet, Bosta's default one is preselected.
 */
export async function saveBostaKey(
  sellerId: string,
  actorId: string,
  storeId: string,
  rawKey: unknown,
  options: BostaCallOptions & { q?: Queryable } = {},
): Promise<
  IntegrationResult<{ overview: BostaOverview; pickupLocations: BostaPickupLocation[] }, SaveBostaKeyError> & { message?: string }
> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (INTEGRATIONS[PROVIDER].availability !== "available") return { success: false, error: "not_available" };
  const input = validateBostaKeyInput(rawKey);
  if (!input.success) return { success: false, error: input.error };

  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const saved = await readSecret(q, storeId, sellerId);
  const apiKey = input.apiKey || saved?.apiKey;
  if (!apiKey) return { success: false, error: "key_required" };

  // Checked outside the transaction: a slow Bosta must not hold the store row lock.
  const check = await listBostaPickupLocations(apiKey, callOptions);
  if (!check.ok) return { success: false, error: keyFailure(check.error.reason), message: check.error.message };
  const pickupLocations = check.data;

  return q.transaction(async (tx) => {
    const locked = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!locked) return { success: false, error: "not_found" } as const;
    if (locked.status !== "active") return { success: false, error: "store_read_only" } as const;

    const current = await readSettings(tx, storeId, sellerId);
    const secret: BostaSecret = { apiKey, webhookToken: (await readSecret(tx, storeId, sellerId))?.webhookToken ?? newWebhookToken() };
    const credentialsEncrypted = encryptCredentials(secret, { storeId, provider: PROVIDER });

    const chosen = pickupLocations.find((l) => l._id === current.pickupLocationId);
    const fallback = pickupLocations.find((l) => l.isDefault) ?? (pickupLocations.length === 1 ? pickupLocations[0] : undefined);
    const location = chosen ?? fallback;
    const config: BostaSettings = {
      ...current,
      keyHint: bostaKeyHint(apiKey),
      pickupLocationId: location?._id ?? null,
      pickupLocationName: location?.locationName ?? null,
    };

    const [row] = await tx
      .insert(storeIntegrations)
      .values({
        storeId,
        sellerId,
        provider: PROVIDER,
        status: "connected",
        config,
        credentialsEncrypted,
        connectedBy: actorId,
        connectedAt: sql`now()`,
        lastSyncedAt: sql`now()`,
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
          lastSyncedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning(summaryColumns);

    return {
      success: true,
      data: { overview: { summary: toIntegrationSummary(PROVIDER, row!), settings: config }, pickupLocations },
    } as const;
  });
}

export type SaveBostaSettingsError =
  | "not_found"
  | "store_read_only"
  | "not_connected"
  | "invalid_settings"
  | "unknown_pickup_location"
  | "bosta_unreachable";

/**
 * Saves part of the settings (wizard step 4, the settings page, or the
 * Shipping page's "Create Bosta shipments" choice). A new pickup location is
 * checked against the account's list, which also gives its name.
 */
export async function saveBostaSettings(
  sellerId: string,
  storeId: string,
  rawInput: unknown,
  options: BostaCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<BostaOverview, SaveBostaSettingsError>> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  const input = validateBostaSettingsInput(rawInput);
  if (!input.success) return { success: false, error: input.error };

  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };
  const secret = await readSecret(q, storeId, sellerId);
  if (!secret) return { success: false, error: "not_connected" };

  let pickupLocationName: string | undefined;
  if (input.data.pickupLocationId !== undefined) {
    const list = await listBostaPickupLocations(secret.apiKey, callOptions);
    if (!list.ok) return { success: false, error: keyFailure(list.error.reason) === "bosta_unreachable" ? "bosta_unreachable" : "not_connected" };
    const location = list.data.find((l) => l._id === input.data.pickupLocationId);
    if (!location) return { success: false, error: "unknown_pickup_location" };
    pickupLocationName = location.locationName;
  }

  return q.transaction(async (tx) => {
    const locked = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!locked) return { success: false, error: "not_found" } as const;
    if (locked.status !== "active") return { success: false, error: "store_read_only" } as const;

    const current = await readSettings(tx, storeId, sellerId);
    const config: BostaSettings = {
      ...current,
      ...input.data,
      ...(pickupLocationName !== undefined ? { pickupLocationName } : {}),
    };
    const [row] = await tx
      .update(storeIntegrations)
      .set({ config, updatedAt: sql`now()` })
      .where(
        and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
      )
      .returning(summaryColumns);
    if (!row) return { success: false, error: "not_connected" } as const;
    return { success: true, data: { summary: toIntegrationSummary(PROVIDER, row), settings: config } } as const;
  });
}

/** The store's Bosta status and settings for the dashboard, or null when not connected. */
export async function getBostaOverview(sellerId: string, storeId: string, q: Queryable = db): Promise<BostaOverview | null> {
  if (!UUID_RE.test(storeId) || !(await ownStoreStatus(q, sellerId, storeId))) return null;
  const [row] = await q
    .select(summaryColumns)
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
    )
    .limit(1);
  if (!row) return null;
  return { summary: toIntegrationSummary(PROVIDER, row), settings: readBostaSettings(row.config) };
}

/** The account's pickup locations for the settings form (the key stays on the server). */
export async function listStoreBostaPickupLocations(
  sellerId: string,
  storeId: string,
  options: BostaCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<BostaPickupLocation[], "not_found" | "not_connected" | "key_rejected" | "bosta_unreachable">> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId) || !(await ownStoreStatus(q, sellerId, storeId))) return { success: false, error: "not_found" };
  const secret = await readSecret(q, storeId, sellerId);
  if (!secret) return { success: false, error: "not_connected" };
  const result = await listBostaPickupLocations(secret.apiKey, callOptions);
  if (!result.ok) {
    await recordBostaResult(storeId, { ok: false, error: result.error.message }, q);
    return { success: false, error: keyFailure(result.error.reason) };
  }
  return { success: true, data: result.data };
}

type AccountRow = {
  integrationId: string;
  storeId: string;
  sellerId: string;
  config: unknown;
  secret: string | null;
};

function toAccount(row: AccountRow): StoreBostaAccount | null {
  if (!row.secret) return null;
  try {
    const secret = decryptCredentials<BostaSecret>(row.secret, { storeId: row.storeId, provider: PROVIDER });
    if (typeof secret.apiKey !== "string" || !secret.apiKey || typeof secret.webhookToken !== "string") return null;
    return {
      integrationId: row.integrationId,
      storeId: row.storeId,
      sellerId: row.sellerId,
      apiKey: secret.apiKey,
      webhookToken: secret.webhookToken,
      settings: readBostaSettings(row.config),
    };
  } catch {
    return null;
  }
}

const accountColumns = {
  integrationId: storeIntegrations.id,
  storeId: storeIntegrations.storeId,
  sellerId: storeIntegrations.sellerId,
  config: storeIntegrations.config,
  secret: storeIntegrations.credentialsEncrypted,
};

/**
 * The store's decrypted Bosta account, or null when Bosta is not connected,
 * the store is not active or the secret does not decrypt. The store must
 * belong to the integration's seller. Server-only: never send it to a client.
 */
export async function getStoreBostaAccount(storeId: string, q: Queryable = db): Promise<StoreBostaAccount | null> {
  if (!UUID_RE.test(storeId) || INTEGRATIONS[PROVIDER].availability !== "available") return null;
  const [row] = await q
    .select(accountColumns)
    .from(storeIntegrations)
    .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.provider, PROVIDER),
        sql`${storeIntegrations.status} <> 'disconnected'`,
        eq(stores.sellerId, storeIntegrations.sellerId),
        eq(stores.status, "active"),
        sql`${stores.deletedAt} IS NULL`,
      ),
    )
    .limit(1);
  return row ? toAccount(row) : null;
}

/**
 * The account behind a webhook URL (`/webhooks/bosta/:integrationId`). Works
 * for a paused store too, so shipments already at Bosta keep updating.
 */
export async function getBostaAccountByIntegrationId(integrationId: string, q: Queryable = db): Promise<StoreBostaAccount | null> {
  if (!UUID_RE.test(integrationId)) return null;
  const [row] = await q
    .select(accountColumns)
    .from(storeIntegrations)
    .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
    .where(
      and(
        eq(storeIntegrations.id, integrationId),
        eq(storeIntegrations.provider, PROVIDER),
        eq(stores.sellerId, storeIntegrations.sellerId),
        sql`${stores.deletedAt} IS NULL`,
      ),
    )
    .limit(1);
  return row ? toAccount(row) : null;
}

/**
 * Stores the outcome of a Bosta account call: an error sets
 * `status = 'error'` and a redacted `last_error`; a success clears them.
 * Only key-level failures belong here, not one order's address error.
 * Never throws.
 */
export async function recordBostaResult(
  storeId: string,
  result: { ok: true } | { ok: false; error: string },
  q: Queryable = db,
): Promise<void> {
  try {
    await q
      .update(storeIntegrations)
      .set(
        result.ok
          ? { status: "connected", lastError: null, lastSyncedAt: sql`now()`, updatedAt: sql`now()` }
          : { status: "error", lastError: redactBostaSecrets(result.error), updatedAt: sql`now()` },
      )
      .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.provider, PROVIDER)));
  } catch {
    // Status bookkeeping must never break the caller.
  }
}

export type TestBostaError = "not_found" | "not_connected" | "failed";

/** Dashboard "Test connection": the saved key can still read the account. */
export async function testStoreBosta(
  sellerId: string,
  storeId: string,
  options: BostaCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<StoreIntegrationSummary, TestBostaError> & { message?: string }> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId) || !(await ownStoreStatus(q, sellerId, storeId))) return { success: false, error: "not_found" };
  const secret = await readSecret(q, storeId, sellerId);
  if (!secret) return { success: false, error: "not_connected" };

  const result = await listBostaPickupLocations(secret.apiKey, callOptions);
  await recordBostaResult(storeId, result.ok ? { ok: true } : { ok: false, error: result.error.message }, q);

  const overview = await getBostaOverview(sellerId, storeId, q);
  if (!overview) return { success: false, error: "not_connected" };
  return result.ok
    ? { success: true, data: overview.summary }
    : { success: false, error: "failed", message: overview.summary.lastError ?? undefined };
}

/**
 * The seller's stores whose Bosta is set up (key saved and a pickup location
 * chosen), with when they ship, for the orders page.
 */
export async function listSellerBostaStores(
  sellerId: string,
  q: Queryable = db,
): Promise<Map<string, Pick<BostaSettings, "autoShip" | "canCancel">>> {
  if (!UUID_RE.test(sellerId)) return new Map();
  const rows = await q
    .select({ storeId: storeIntegrations.storeId, config: storeIntegrations.config })
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.sellerId, sellerId),
        eq(storeIntegrations.provider, PROVIDER),
        sql`${storeIntegrations.status} <> 'disconnected'`,
        sql`${storeIntegrations.credentialsEncrypted} IS NOT NULL`,
        sql`coalesce(${storeIntegrations.config}->>'pickupLocationId', '') <> ''`,
      ),
    );
  return new Map(
    rows.map((row) => {
      const { autoShip, canCancel } = readBostaSettings(row.config);
      return [row.storeId, { autoShip, canCancel }];
    }),
  );
}
