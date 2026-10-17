import { and, db, eq, sql, storeIntegrations, stores } from "@workspace/db";
import {
  INTEGRATIONS,
  isIntegrationProvider,
  type IntegrationProvider,
  type IntegrationStatus,
  type StorefrontTrackingConfig,
} from "./registry";
import { readIntegrationId, validateIdentifierConfig } from "./validate";

/**
 * Store apps data access (PLAN.md §9.1, P7-02). Server-only; every function
 * takes the session seller and an explicit store id and checks the store
 * belongs to that seller. Credentials are never selected here.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type IntegrationResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };

export type StoreIntegrationSummary = {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  /** The public identifier (pixel id, measurement id, container id), when valid. */
  identifier: string | null;
  lastError: string | null;
  connectedAt: string | null;
  updatedAt: string;
};

async function ownStoreStatus(q: Queryable, sellerId: string, storeId: string, lock = false) {
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
    .select({
      provider: storeIntegrations.provider,
      status: storeIntegrations.status,
      config: storeIntegrations.config,
      lastError: storeIntegrations.lastError,
      connectedAt: storeIntegrations.connectedAt,
      updatedAt: storeIntegrations.updatedAt,
    })
    .from(storeIntegrations)
    .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId)));

  return rows.flatMap((row) =>
    isIntegrationProvider(row.provider)
      ? [
          {
            provider: row.provider,
            status: row.status as IntegrationStatus,
            identifier: readIntegrationId(row.provider, row.config),
            lastError: row.lastError,
            connectedAt: row.connectedAt,
            updatedAt: row.updatedAt,
          },
        ]
      : [],
  );
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
          config: validated.config,
          lastError: null,
          connectedBy: actorId,
          connectedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning({
        status: storeIntegrations.status,
        config: storeIntegrations.config,
        lastError: storeIntegrations.lastError,
        connectedAt: storeIntegrations.connectedAt,
        updatedAt: storeIntegrations.updatedAt,
      });

    return {
      success: true,
      data: {
        provider,
        status: row!.status as IntegrationStatus,
        identifier: readIntegrationId(provider, row!.config),
        lastError: row!.lastError,
        connectedAt: row!.connectedAt,
        updatedAt: row!.updatedAt,
      },
    } as const;
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

  const rows = await q
    .select({ provider: storeIntegrations.provider, config: storeIntegrations.config })
    .from(storeIntegrations)
    .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.status, "connected"),
        // The owner check the 0056 trigger enforces, again at read time.
        eq(stores.sellerId, storeIntegrations.sellerId),
      ),
    );

  const idFor = (provider: IntegrationProvider) => {
    if (INTEGRATIONS[provider].availability !== "available") return null;
    const row = rows.find((r) => r.provider === provider);
    return row ? readIntegrationId(provider, row.config) : null;
  };

  return {
    metaPixelId: idFor("meta_pixel"),
    ga4MeasurementId: idFor("google_analytics"),
    gtmContainerId: idFor("google_tag_manager"),
  };
}
