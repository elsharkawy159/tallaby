import { and, db, eq, sql, storeIntegrations, stores } from "@workspace/db";
import {
  INTEGRATIONS,
  isIntegrationProvider,
  type IntegrationProvider,
  type IntegrationStatus,
  type StorefrontTrackingConfig,
} from "./registry";
import { browserBlockedMetaEvents, readMetaTrackingSettings } from "./meta-tracking.lib";
import {
  readIntegrationId,
  readPublicDetails,
  validateIdentifierConfig,
  type IntegrationPublicDetails,
} from "./validate";

/**
 * Store apps data access (PLAN.md §9.1, P7-02). Server-only; every function
 * takes the session seller and an explicit store id and checks the store
 * belongs to that seller. Credentials are never selected here: summaries only
 * say whether a secret is saved.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Queryable = Tx | typeof db;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type IntegrationResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };

export type StoreIntegrationSummary = {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  /** The public identifier (pixel id, measurement id, container id), when valid. */
  identifier: string | null;
  /** True when an encrypted secret is stored (the UI shows "token saved", never the token). */
  credentialsSaved: boolean;
  /** Whitelisted public config (shop domain, spreadsheet id, …). */
  details: IntegrationPublicDetails;
  lastError: string | null;
  lastSyncedAt: string | null;
  connectedAt: string | null;
  updatedAt: string;
};

/** The columns a summary is built from; never `credentials_encrypted` itself. */
export const summaryColumns = {
  provider: storeIntegrations.provider,
  status: storeIntegrations.status,
  config: storeIntegrations.config,
  credentialsSaved: sql<boolean>`(${storeIntegrations.credentialsEncrypted} IS NOT NULL)`,
  lastError: storeIntegrations.lastError,
  lastSyncedAt: storeIntegrations.lastSyncedAt,
  connectedAt: storeIntegrations.connectedAt,
  updatedAt: storeIntegrations.updatedAt,
};

type SummaryRow = {
  provider: string;
  status: string;
  config: unknown;
  credentialsSaved: boolean;
  lastError: string | null;
  lastSyncedAt: string | null;
  connectedAt: string | null;
  updatedAt: string;
};

export function toIntegrationSummary(provider: IntegrationProvider, row: SummaryRow): StoreIntegrationSummary {
  return {
    provider,
    status: row.status as IntegrationStatus,
    identifier: readIntegrationId(provider, row.config),
    credentialsSaved: Boolean(row.credentialsSaved),
    details: readPublicDetails(provider, row.config),
    lastError: row.lastError,
    lastSyncedAt: row.lastSyncedAt,
    connectedAt: row.connectedAt,
    updatedAt: row.updatedAt,
  };
}

export async function ownStoreStatus(q: Queryable, sellerId: string, storeId: string, lock = false) {
  const query = q
    .select({ status: stores.status })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), sql`${stores.deletedAt} IS NULL`));
  const [store] = lock ? await query.for("update") : await query;
  return store ?? null;
}

/** The store's integrations, one per provider that has a row. */
export async function listStoreIntegrations(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<StoreIntegrationSummary[] | null> {
  if (!UUID_RE.test(storeId)) return null;
  if (!(await ownStoreStatus(q, sellerId, storeId))) return null;

  const rows = await q
    .select(summaryColumns)
    .from(storeIntegrations)
    .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId)));

  return rows.flatMap((row) => (isIntegrationProvider(row.provider) ? [toIntegrationSummary(row.provider, row)] : []));
}

export type ConnectIntegrationError = "not_found" | "store_read_only" | "unsupported" | "not_available" | "invalid_id";

/**
 * Connects (or updates) an identifier app such as the Meta Pixel. The id is
 * validated and normalised; nothing else from the client is stored.
 */
export async function connectIdentifierIntegration(
  sellerId: string,
  actorId: string,
  storeId: string,
  provider: string,
  rawId: unknown,
  q: Queryable = db,
): Promise<IntegrationResult<StoreIntegrationSummary, ConnectIntegrationError>> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (!isIntegrationProvider(provider)) return { success: false, error: "unsupported" };
  if (INTEGRATIONS[provider].availability !== "available") return { success: false, error: "not_available" };
  const validated = validateIdentifierConfig(provider, rawId);
  if (!validated.success) return { success: false, error: validated.error };

  return q.transaction(async (tx) => {
    const store = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;

    const [row] = await tx
      .insert(storeIntegrations)
      .values({
        storeId,
        sellerId,
        provider,
        status: "connected",
        config: validated.config,
        connectedBy: actorId,
        connectedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [storeIntegrations.storeId, storeIntegrations.provider],
        set: {
          status: "connected",
          // Merged, so a new id keeps the row's other settings (Meta `tracking`, F-30).
          config: sql`coalesce(${storeIntegrations.config}, '{}'::jsonb) || ${JSON.stringify(validated.config)}::jsonb`,
          lastError: null,
          connectedBy: actorId,
          connectedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning(summaryColumns);

    return { success: true, data: toIntegrationSummary(provider, row!) } as const;
  });
}

/** Disconnects an app: the row is deleted, so its script stops rendering. */
export async function disconnectStoreIntegration(
  sellerId: string,
  storeId: string,
  provider: string,
  q: Queryable = db,
): Promise<IntegrationResult<null, "not_found" | "store_read_only" | "unsupported">> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (!isIntegrationProvider(provider)) return { success: false, error: "unsupported" };

  return q.transaction(async (tx) => {
    const store = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;
    await tx
      .delete(storeIntegrations)
      .where(
        and(
          eq(storeIntegrations.storeId, storeId),
          eq(storeIntegrations.sellerId, sellerId),
          eq(storeIntegrations.provider, provider),
        ),
      );
    return { success: true, data: null } as const;
  });
}

/**
 * Public tracking ids for one store's storefront (P7-03): only connected,
 * available identifier apps, each id re-validated. The caller resolves the
 * store from the request host, never from client input.
 */
export async function getStorefrontTracking(storeId: string, q: Queryable = db): Promise<StorefrontTrackingConfig> {
  const empty: StorefrontTrackingConfig = { metaPixelId: null, ga4MeasurementId: null, gtmContainerId: null };
  if (!UUID_RE.test(storeId)) return empty;

  const all = await q
    .select({
      provider: storeIntegrations.provider,
      status: storeIntegrations.status,
      config: storeIntegrations.config,
      hasSecret: sql<boolean>`(${storeIntegrations.credentialsEncrypted} IS NOT NULL)`,
    })
    .from(storeIntegrations)
    .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        // The owner check the 0056 trigger enforces, again at read time.
        eq(stores.sellerId, storeIntegrations.sellerId),
      ),
    );
  const rows = all.filter((r) => r.status === "connected");

  const idFor = (provider: IntegrationProvider) => {
    if (INTEGRATIONS[provider].availability !== "available") return null;
    const row = rows.find((r) => r.provider === provider);
    return row ? readIntegrationId(provider, row.config) : null;
  };

  const metaPixelId = idFor("meta_pixel");
  const config: StorefrontTrackingConfig = {
    metaPixelId,
    ga4MeasurementId: idFor("google_analytics"),
    gtmContainerId: idFor("google_tag_manager"),
  };
  if (metaPixelId) {
    // F-30: the events this store's browser Pixel must not send. CAPI counts
    // as connected exactly as getStoreMetaCapiCredentials reads it, so the
    // browser and the server agree on when Purchase is sent.
    const pixel = rows.find((r) => r.provider === "meta_pixel");
    config.metaBlockedEvents = browserBlockedMetaEvents(
      readMetaTrackingSettings(pixel?.config),
      isMetaCapiUsable(all),
    );
  }
  return config;
}

/** CAPI is usable when its row holds a secret and is not disconnected (same rule as the sender). */
export function isMetaCapiUsable(rows: Array<{ provider: string; status: string; hasSecret: boolean }>): boolean {
  return (
    INTEGRATIONS.meta_capi.availability === "available" &&
    rows.some((r) => r.provider === "meta_capi" && r.status !== "disconnected" && Boolean(r.hasSecret))
  );
}
