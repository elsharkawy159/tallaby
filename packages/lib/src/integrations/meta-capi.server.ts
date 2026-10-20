import { and, db, eq, inArray, sql, storeIntegrations, stores } from "@workspace/db";
import { decryptCredentials, encryptCredentials } from "./crypto.server";
import {
  checkMetaCapiAccess,
  postMetaCapiEvents,
  redactSecrets,
  validateMetaCapiInput,
  type MetaCapiCredentials,
  type MetaCapiInputError,
  type MetaCapiSecret,
} from "./meta-capi.lib";
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
import { readIntegrationId } from "./validate";

/**
 * Meta Conversions API per store (PLAN.md §9.2, P7-05). The token is
 * encrypted with the store id + provider as AAD, never selected into a
 * summary, never logged and never returned to a client. It is sent for the
 * Pixel connected on the SAME store, so the browser and server Purchase share
 * a Pixel and dedupe on `event_id = order id`.
 */

const PROVIDER = "meta_capi" as const;

export type SaveMetaCapiError =
  | "not_found"
  | "store_read_only"
  | "not_available"
  | "pixel_required"
  | "token_required"
  | MetaCapiInputError;

async function connectedPixelId(q: Queryable, storeId: string, sellerId: string): Promise<string | null> {
  const [row] = await q
    .select({ config: storeIntegrations.config })
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.sellerId, sellerId),
        eq(storeIntegrations.provider, "meta_pixel"),
        eq(storeIntegrations.status, "connected"),
      ),
    )
    .limit(1);
  return row ? readIntegrationId("meta_pixel", row.config) : null;
}

/**
 * Saves (or updates) the store's CAPI token and optional test event code.
 * An empty token keeps the saved one, so the seller can change only the test
 * code. Requires the store's Meta Pixel to be connected.
 */
export async function saveMetaCapiCredentials(
  sellerId: string,
  actorId: string,
  storeId: string,
  rawInput: unknown,
  q: Queryable = db,
): Promise<IntegrationResult<StoreIntegrationSummary, SaveMetaCapiError>> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (INTEGRATIONS[PROVIDER].availability !== "available") return { success: false, error: "not_available" };
  const input = validateMetaCapiInput(rawInput);
  if (!input.success) return { success: false, error: input.error };

  return q.transaction(async (tx) => {
    const store = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;
    if (!(await connectedPixelId(tx, storeId, sellerId))) return { success: false, error: "pixel_required" } as const;

    let accessToken = input.data.accessToken;
    if (!accessToken) {
      const [existing] = await tx
        .select({ secret: storeIntegrations.credentialsEncrypted })
        .from(storeIntegrations)
        .where(
          and(
            eq(storeIntegrations.storeId, storeId),
            eq(storeIntegrations.sellerId, sellerId),
            eq(storeIntegrations.provider, PROVIDER),
          ),
        )
        .limit(1);
      if (!existing?.secret) return { success: false, error: "token_required" } as const;
      try {
        accessToken = decryptCredentials<MetaCapiSecret>(existing.secret, { storeId, provider: PROVIDER }).accessToken;
      } catch {
        return { success: false, error: "token_required" } as const;
      }
    }

    const secret: MetaCapiSecret = { accessToken, testEventCode: input.data.testEventCode };
    const credentialsEncrypted = encryptCredentials(secret, { storeId, provider: PROVIDER });
    const config = { testMode: Boolean(input.data.testEventCode) };

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

    return { success: true, data: toIntegrationSummary(PROVIDER, row!) } as const;
  });
}

/**
 * The decrypted credentials for one store, or null when CAPI or the Pixel is
 * not connected, the store is not active, or the secret does not decrypt.
 * Server-only: the result must never reach a client or a log.
 */
export async function getStoreMetaCapiCredentials(storeId: string, q: Queryable = db): Promise<MetaCapiCredentials | null> {
  if (!UUID_RE.test(storeId) || INTEGRATIONS[PROVIDER].availability !== "available") return null;

  const rows = await q
    .select({
      provider: storeIntegrations.provider,
      status: storeIntegrations.status,
      config: storeIntegrations.config,
      secret: storeIntegrations.credentialsEncrypted,
    })
    .from(storeIntegrations)
    .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        inArray(storeIntegrations.provider, ["meta_pixel", PROVIDER]),
        eq(stores.sellerId, storeIntegrations.sellerId),
        eq(stores.status, "active"),
        sql`${stores.deletedAt} IS NULL`,
      ),
    );

  const pixel = rows.find((r) => r.provider === "meta_pixel" && r.status === "connected");
  const capi = rows.find((r) => r.provider === PROVIDER && r.status !== "disconnected" && r.secret);
  const pixelId = pixel ? readIntegrationId("meta_pixel", pixel.config) : null;
  if (!pixelId || !capi?.secret) return null;

  try {
    const secret = decryptCredentials<MetaCapiSecret>(capi.secret, { storeId, provider: PROVIDER });
    if (typeof secret.accessToken !== "string" || !secret.accessToken) return null;
    return { pixelId, accessToken: secret.accessToken, testEventCode: secret.testEventCode ?? null };
  } catch {
    await recordMetaCapiResult(storeId, { ok: false, error: "Saved token could not be read. Save it again." }, q);
    return null;
  }
}

/**
 * Stores the outcome of a CAPI call: errors set `status = 'error'` and a
 * redacted `last_error`; a success clears them. Never throws.
 */
export async function recordMetaCapiResult(
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
          : { status: "error", lastError: redactSecrets(result.error), updatedAt: sql`now()` },
      )
      .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.provider, PROVIDER)));
  } catch {
    // Status bookkeeping must never break the caller (checkout).
  }
}

export type MetaCapiSendOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  graphVersion?: string;
};

/**
 * Sends server events for a store with its own credentials and records the
 * outcome. Returns `skipped` when the store has no CAPI. Never throws.
 */
export async function sendStoreMetaCapiEvents(
  storeId: string,
  events: Array<Record<string, unknown>>,
  options: MetaCapiSendOptions & { q?: Queryable } = {},
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const { q = db, ...callOptions } = options;
  try {
    const credentials = await getStoreMetaCapiCredentials(storeId, q);
    if (!credentials) return { success: true, skipped: true };
    const result = await postMetaCapiEvents(credentials, events, callOptions);
    await recordMetaCapiResult(storeId, result.ok ? { ok: true } : { ok: false, error: result.error }, q);
    return result.ok ? { success: true } : { success: false, error: result.error };
  } catch {
    return { success: false, error: "Meta CAPI failed" };
  }
}

export type TestMetaCapiError = "not_found" | "not_connected" | "failed";

/** Dashboard "Test connection": checks the token can read this store's Pixel. */
export async function testStoreMetaCapi(
  sellerId: string,
  storeId: string,
  options: MetaCapiSendOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<StoreIntegrationSummary, TestMetaCapiError> & { message?: string }> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId) || !(await ownStoreStatus(q, sellerId, storeId))) return { success: false, error: "not_found" };

  const credentials = await getStoreMetaCapiCredentials(storeId, q);
  if (!credentials) return { success: false, error: "not_connected" };

  const result = await checkMetaCapiAccess(credentials, callOptions);
  await recordMetaCapiResult(storeId, result.ok ? { ok: true } : { ok: false, error: result.error }, q);

  const [row] = await q
    .select(summaryColumns)
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
    )
    .limit(1);
  if (!row) return { success: false, error: "not_connected" };
  const summary = toIntegrationSummary(PROVIDER, row);
  return result.ok ? { success: true, data: summary } : { success: false, error: "failed", message: summary.lastError ?? undefined };
}
