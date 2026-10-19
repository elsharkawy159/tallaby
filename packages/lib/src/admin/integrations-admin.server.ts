/**
 * Admin integrations hub (docs/admin-saas.md §3.5): provider summary, all
 * connections across stores, and two audited actions. Credentials are never
 * selected, only whether they exist.
 */
import { and, db, desc, eq, sellers, sql, storeIntegrations, stores } from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { INTEGRATION_PROVIDERS, INTEGRATIONS, type IntegrationProvider } from "../integrations/registry";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import {
  ADMIN_LIST_PAGE_SIZE,
  integrationAdminActionSchema,
  isUuid,
  likePattern,
  publicIntegrationConfig,
  type AdminIntegrationStatus,
  type SaasAdminError,
} from "./saas.lib";

export interface IntegrationProviderSummary {
  provider: IntegrationProvider;
  category: string;
  availability: string;
  connected: number;
  error: number;
  disconnected: number;
  lastErrorAt: string | null;
}

/** One card per registry provider, counts from one GROUP BY. */
export async function getIntegrationSummary(q: Queryable = db): Promise<IntegrationProviderSummary[]> {
  const rows = await q
    .select({
      provider: storeIntegrations.provider,
      status: storeIntegrations.status,
      count: sql<number>`count(*)::int`,
      lastErrorAt: sql<string | null>`max(${storeIntegrations.updatedAt}) FILTER (WHERE ${storeIntegrations.status} = 'error')::text`,
    })
    .from(storeIntegrations)
    .groupBy(storeIntegrations.provider, storeIntegrations.status);

  return INTEGRATION_PROVIDERS.map((provider) => {
    const mine = rows.filter((row) => row.provider === provider);
    const count = (status: string) => Number(mine.find((row) => row.status === status)?.count ?? 0);
    const lastErrorAt = mine.map((row) => row.lastErrorAt).filter(Boolean).sort().at(-1) ?? null;
    return {
      provider,
      category: INTEGRATIONS[provider].category,
      availability: INTEGRATIONS[provider].availability,
      connected: count("connected"),
      error: count("error"),
      disconnected: count("disconnected"),
      lastErrorAt,
    };
  });
}

export interface AdminIntegrationListInput {
  provider: IntegrationProvider | null;
  status: AdminIntegrationStatus | null;
  q: string | null;
  /** One seller's integrations across all their stores (seller page tab). */
  sellerId?: string | null;
  page: number;
}

/** Every store integration row, newest change first. Public config only. */
export async function listIntegrationsForAdmin(input: AdminIntegrationListInput, q: Queryable = db) {
  const conditions: SQL[] = [];
  if (input.provider) conditions.push(eq(storeIntegrations.provider, input.provider));
  if (input.status) conditions.push(eq(storeIntegrations.status, input.status));
  if (input.sellerId && isUuid(input.sellerId)) conditions.push(eq(stores.sellerId, input.sellerId));
  if (input.q) {
    const like = likePattern(input.q);
    conditions.push(sql`(${stores.name} ILIKE ${like} OR ${stores.subdomain} ILIKE ${like} OR ${sellers.businessName} ILIKE ${like} OR ${storeIntegrations.externalAccountId} ILIKE ${like})`);
  }

  const rows = await q
    .select({
      id: storeIntegrations.id,
      provider: storeIntegrations.provider,
      status: storeIntegrations.status,
      config: storeIntegrations.config,
      scopes: storeIntegrations.scopes,
      externalAccountId: storeIntegrations.externalAccountId,
      hasCredentials: sql<boolean>`${storeIntegrations.credentialsEncrypted} IS NOT NULL`,
      lastError: storeIntegrations.lastError,
      lastSyncedAt: storeIntegrations.lastSyncedAt,
      connectedAt: storeIntegrations.connectedAt,
      updatedAt: storeIntegrations.updatedAt,
      storeId: storeIntegrations.storeId,
      storeName: stores.name,
      subdomain: stores.subdomain,
      sellerId: storeIntegrations.sellerId,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
      totalCount: sql<number>`count(*) OVER ()::int`,
    })
    .from(storeIntegrations)
    .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
    .innerJoin(sellers, eq(sellers.id, storeIntegrations.sellerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(storeIntegrations.updatedAt), desc(storeIntegrations.id))
    .limit(ADMIN_LIST_PAGE_SIZE)
    .offset((input.page - 1) * ADMIN_LIST_PAGE_SIZE);

  return {
    rows: rows.map(({ config, totalCount: _total, ...row }) => ({ ...row, publicConfig: publicIntegrationConfig(config) })),
    total: Number(rows[0]?.totalCount ?? 0),
  };
}

export type AdminIntegrationRow = Awaited<ReturnType<typeof listIntegrationsForAdmin>>["rows"][number];

export type IntegrationAdminActionResult = { sellerId: string; storeId: string; auditId: string };

/**
 * - disconnect_integration: wipes the encrypted credentials and marks the row
 *   disconnected, so the storefront stops rendering its script and syncs stop.
 * - clear_integration_error: back to `connected` when credentials (or a public
 *   id) exist, so the next sync retries.
 */
export async function applyIntegrationAdminAction(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<{ success: true; data: IntegrationAdminActionResult } | { success: false; error: SaasAdminError }> {
  const parsed = integrationAdminActionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { action, integrationId, reason } = parsed.data;

  try {
    const data = await q.transaction(async (tx): Promise<IntegrationAdminActionResult | { error: SaasAdminError }> => {
      await assertAdminActor(tx, actorId);
      const [row] = await tx
        .select({
          id: storeIntegrations.id,
          storeId: storeIntegrations.storeId,
          sellerId: stores.sellerId,
          provider: storeIntegrations.provider,
          status: storeIntegrations.status,
          config: storeIntegrations.config,
          hasCredentials: sql<boolean>`${storeIntegrations.credentialsEncrypted} IS NOT NULL`,
        })
        .from(storeIntegrations)
        // The owner comes from the store row, not from store_integrations.seller_id alone.
        .innerJoin(stores, and(eq(stores.id, storeIntegrations.storeId), eq(stores.sellerId, storeIntegrations.sellerId)))
        .where(eq(storeIntegrations.id, integrationId))
        .for("update", { of: storeIntegrations });
      if (!row) return { error: "not_found" };

      let after: Record<string, unknown>;
      if (action === "disconnect_integration") {
        if (row.status === "disconnected" && !row.hasCredentials) return { error: "no_change" };
        await tx
          .update(storeIntegrations)
          .set({
            status: "disconnected",
            credentialsEncrypted: null,
            lastError: `Disconnected by Tallaby admin: ${reason}`.slice(0, 500),
            updatedAt: sql`now()`,
          })
          .where(eq(storeIntegrations.id, row.id));
        after = { status: "disconnected", credentials: "removed" };
      } else {
        if (row.status !== "error") return { error: "no_change" };
        const hasPublicId = Object.keys(publicIntegrationConfig(row.config)).length > 0;
        const next = row.hasCredentials || hasPublicId ? "connected" : "disconnected";
        await tx
          .update(storeIntegrations)
          .set({ status: next, lastError: null, updatedAt: sql`now()` })
          .where(eq(storeIntegrations.id, row.id));
        after = { status: next };
      }

      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: row.sellerId,
        storeId: row.storeId,
        action,
        before: { integrationId: row.id, provider: row.provider, status: row.status },
        after: { integrationId: row.id, provider: row.provider, ...after },
        reason,
      });
      return { sellerId: row.sellerId, storeId: row.storeId, auditId };
    });
    if ("error" in data) return { success: false, error: data.error };
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }
}
