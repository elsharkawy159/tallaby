import {
  and,
  db,
  desc,
  eq,
  orderItems,
  orders,
  sql,
  storeIntegrations,
  stores,
  userAddresses,
  users,
} from "@workspace/db";
import { decryptCredentials, encryptCredentials } from "./crypto.server";
import {
  createSpreadsheet,
  isValidSpreadsheetId,
  planSheetWrite,
  readOrderIdColumn,
  refreshGoogleAccessToken,
  revokeGoogleToken,
  SHEETS_EXPORT_MAX_ORDERS,
  writeOrderRows,
  type GoogleSheetsSecret,
  type SheetOrder,
} from "./google-sheets.lib";
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
 * Google Sheets data access (PLAN.md §9.2, P7-06). The refresh token is
 * encrypted per store; access tokens are minted per run and never stored.
 * Orders are the store's own (`orders.store_id`), checked against the seller.
 */

const PROVIDER = "google_sheets" as const;

export type GoogleClientCreds = { clientId: string; clientSecret: string };
export type GoogleCallOptions = { fetchImpl?: typeof fetch; timeoutMs?: number };

/** Saves the grant after a verified OAuth callback. Keeps a previously created sheet. */
export async function saveGoogleSheetsConnection(
  sellerId: string,
  actorId: string,
  storeId: string,
  grant: { refreshToken: string; scopes: string[] },
  q: Queryable = db,
): Promise<IntegrationResult<StoreIntegrationSummary, "not_found" | "store_read_only" | "not_available">> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (INTEGRATIONS[PROVIDER].availability !== "available") return { success: false, error: "not_available" };
  const secret: GoogleSheetsSecret = { refreshToken: grant.refreshToken };
  const credentialsEncrypted = encryptCredentials(secret, { storeId, provider: PROVIDER });
  const scopes = grant.scopes.slice(0, 10);

  return q.transaction(async (tx) => {
    const store = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;
    const [row] = await tx
      .insert(storeIntegrations)
      .values({
        storeId,
        sellerId,
        provider: PROVIDER,
        status: "connected",
        config: {},
        credentialsEncrypted,
        scopes,
        connectedBy: actorId,
        connectedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [storeIntegrations.storeId, storeIntegrations.provider],
        set: {
          status: "connected",
          credentialsEncrypted,
          scopes,
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

type Loaded = { refreshToken: string; config: Record<string, unknown>; storeStatus: string };

async function loadGoogle(q: Queryable, sellerId: string, storeId: string): Promise<Loaded | null> {
  if (!UUID_RE.test(storeId)) return null;
  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return null;
  const [row] = await q
    .select({ config: storeIntegrations.config, secret: storeIntegrations.credentialsEncrypted })
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
    )
    .limit(1);
  if (!row?.secret) return null;
  try {
    const { refreshToken } = decryptCredentials<GoogleSheetsSecret>(row.secret, { storeId, provider: PROVIDER });
    return { refreshToken, config: (row.config ?? {}) as Record<string, unknown>, storeStatus: store.status };
  } catch {
    return null;
  }
}

async function recordGoogle(
  q: Queryable,
  sellerId: string,
  storeId: string,
  outcome: { ok: true; config?: Record<string, unknown> } | { ok: false; error: string },
): Promise<void> {
  await q
    .update(storeIntegrations)
    .set(
      outcome.ok
        ? {
            status: "connected",
            lastError: null,
            lastSyncedAt: sql`now()`,
            updatedAt: sql`now()`,
            ...(outcome.config ? { config: sql`${storeIntegrations.config} || ${JSON.stringify(outcome.config)}::jsonb` } : {}),
          }
        : { status: "error", lastError: outcome.error.slice(0, 300), updatedAt: sql`now()` },
    )
    .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)));
}

export type GoogleSheetsError = "not_connected" | "store_read_only" | "auth" | "no_sheet" | "failed";

async function accessToken(
  client: GoogleClientCreds,
  loaded: Loaded,
  options: GoogleCallOptions,
): Promise<{ ok: true; token: string } | { ok: false; error: "auth" | "failed" }> {
  const result = await refreshGoogleAccessToken(client, loaded.refreshToken, options);
  if (result.ok) return { ok: true, token: result.data };
  return { ok: false, error: result.error === "auth" ? "auth" : "failed" };
}

const AUTH_MESSAGE = "Google access was revoked or expired. Connect again.";
const FAILED_MESSAGE = "Google Sheets request failed. Try again.";

/** Creates a new spreadsheet with a header row and remembers it on the store. */
export async function createStoreSpreadsheet(
  sellerId: string,
  storeId: string,
  input: { title: string; headers: string[] },
  client: GoogleClientCreds,
  options: GoogleCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<{ spreadsheetId: string }, GoogleSheetsError>> {
  const { q = db, ...callOptions } = options;
  const loaded = await loadGoogle(q, sellerId, storeId);
  if (!loaded) return { success: false, error: "not_connected" };
  if (loaded.storeStatus !== "active") return { success: false, error: "store_read_only" };

  const token = await accessToken(client, loaded, callOptions);
  if (!token.ok) {
    await recordGoogle(q, sellerId, storeId, { ok: false, error: token.error === "auth" ? AUTH_MESSAGE : FAILED_MESSAGE });
    return { success: false, error: token.error };
  }
  const title = input.title.trim().slice(0, 100) || "Tallaby orders";
  const created = await createSpreadsheet(token.token, title, input.headers, callOptions);
  if (!created.ok) {
    await recordGoogle(q, sellerId, storeId, { ok: false, error: FAILED_MESSAGE });
    return { success: false, error: created.error === "auth" ? "auth" : "failed" };
  }
  await recordGoogle(q, sellerId, storeId, {
    ok: true,
    config: { spreadsheetId: created.data.spreadsheetId, spreadsheetTitle: title, exportedOrders: 0 },
  });
  return { success: true, data: created.data };
}

/** The store's orders for the sheet, newest first, at most SHEETS_EXPORT_MAX_ORDERS. */
export async function loadStoreOrdersForSheet(sellerId: string, storeId: string, q: Queryable = db): Promise<SheetOrder[]> {
  if (!UUID_RE.test(storeId)) return [];
  const rows = await q
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      customerName: sql<string | null>`COALESCE(${userAddresses.fullName}, ${users.fullName})`,
      customerPhone: sql<string | null>`COALESCE(${userAddresses.phone}, ${users.phone})`,
      city: userAddresses.city,
      itemCount: sql<number>`(SELECT COALESCE(SUM(${orderItems.quantity}), 0)::int FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`,
      subtotal: orders.subtotal,
      shippingCost: orders.shippingCost,
      discountAmount: orders.discountAmount,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
    })
    .from(orders)
    // The store must be the seller's; orders of any other store never match.
    .innerJoin(stores, and(eq(stores.id, orders.storeId), eq(stores.sellerId, sellerId)))
    .leftJoin(users, eq(users.id, orders.userId))
    .leftJoin(userAddresses, eq(userAddresses.id, orders.shippingAddressId))
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.createdAt))
    .limit(SHEETS_EXPORT_MAX_ORDERS);
  return rows.map((r) => ({ ...r, itemCount: Number(r.itemCount) || 0 }));
}

export type ExportSummary = { appended: number; updated: number; spreadsheetId: string };

/**
 * Exports the store's orders: rows already in the sheet (by order id in
 * column A) are refreshed in place, new orders are appended. Safe to re-run.
 */
export async function exportStoreOrdersToSheet(
  sellerId: string,
  storeId: string,
  client: GoogleClientCreds,
  options: GoogleCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<ExportSummary, GoogleSheetsError>> {
  const { q = db, ...callOptions } = options;
  const loaded = await loadGoogle(q, sellerId, storeId);
  if (!loaded) return { success: false, error: "not_connected" };
  const spreadsheetId = loaded.config.spreadsheetId;
  if (!isValidSpreadsheetId(spreadsheetId)) return { success: false, error: "no_sheet" };

  const token = await accessToken(client, loaded, callOptions);
  if (!token.ok) {
    await recordGoogle(q, sellerId, storeId, { ok: false, error: token.error === "auth" ? AUTH_MESSAGE : FAILED_MESSAGE });
    return { success: false, error: token.error };
  }

  const existing = await readOrderIdColumn(token.token, spreadsheetId, callOptions);
  if (!existing.ok) {
    const missing = existing.error === "not_found";
    await recordGoogle(q, sellerId, storeId, {
      ok: false,
      error: missing ? "The spreadsheet was deleted or is no longer shared with Tallaby. Create a new one." : FAILED_MESSAGE,
    });
    return { success: false, error: missing ? "no_sheet" : existing.error === "auth" ? "auth" : "failed" };
  }

  const storeOrders = await loadStoreOrdersForSheet(sellerId, storeId, q);
  const plan = planSheetWrite(storeOrders, existing.data);
  const written = await writeOrderRows(token.token, spreadsheetId, plan, callOptions);
  if (!written.ok) {
    await recordGoogle(q, sellerId, storeId, { ok: false, error: FAILED_MESSAGE });
    return { success: false, error: written.error === "auth" ? "auth" : "failed" };
  }

  await recordGoogle(q, sellerId, storeId, {
    ok: true,
    config: { exportedOrders: existing.data.size + plan.appends.length },
  });
  return { success: true, data: { appended: plan.appends.length, updated: plan.updates.length, spreadsheetId } };
}

/**
 * Disconnects: revokes the grant at Google (best effort; a token Google no
 * longer knows counts as revoked), then deletes the row.
 */
export async function disconnectGoogleSheets(
  sellerId: string,
  storeId: string,
  options: GoogleCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<null, "not_found" | "store_read_only">> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const loaded = await loadGoogle(q, sellerId, storeId);
  if (loaded) {
    const revoked = await revokeGoogleToken(loaded.refreshToken, callOptions);
    if (!revoked) console.error("[google-sheets] revoke failed for store", storeId);
  }
  await q
    .delete(storeIntegrations)
    .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)));
  return { success: true, data: null };
}

/** Stores with a connected sheet, for the daily append (cron). */
export async function listStoresForDailySheetExport(q: Queryable = db): Promise<Array<{ sellerId: string; storeId: string }>> {
  const rows = await q
    .select({ sellerId: storeIntegrations.sellerId, storeId: storeIntegrations.storeId, config: storeIntegrations.config })
    .from(storeIntegrations)
    .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
    .where(
      and(
        eq(storeIntegrations.provider, PROVIDER),
        eq(storeIntegrations.status, "connected"),
        eq(stores.sellerId, storeIntegrations.sellerId),
        sql`${stores.deletedAt} IS NULL`,
      ),
    );
  return rows
    .filter((r) => isValidSpreadsheetId((r.config as Record<string, unknown> | null)?.spreadsheetId))
    .map(({ sellerId, storeId }) => ({ sellerId, storeId }));
}
