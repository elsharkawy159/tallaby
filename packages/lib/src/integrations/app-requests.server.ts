import { and, db, eq, storeAppRequests } from "@workspace/db";
import { getStoreApp, isStoreAppRequestable } from "./catalog";

/**
 * A seller asks for an app that isn't open to everyone yet (ROADMAP.md F-62).
 * Server-only. Callers pass the session's seller and an explicit store.
 */

export type StoreAppRequestStatus = "requested" | "enabled" | "declined";
export type StoreAppRequestSummary = { appKey: string; status: StoreAppRequestStatus };
export type RequestStoreAppResult = { success: true } | { success: false; error: "not_requestable" };

/** Saved once per store: asking again changes nothing, and a declined request stays declined. */
export async function requestStoreApp(input: {
  sellerId: string;
  storeId: string;
  appKey: string;
  actorId: string;
}): Promise<RequestStoreAppResult> {
  const app = getStoreApp(input.appKey);
  if (!app || !isStoreAppRequestable(app)) return { success: false, error: "not_requestable" };
  await db
    .insert(storeAppRequests)
    .values({ sellerId: input.sellerId, storeId: input.storeId, appKey: app.key, requestedBy: input.actorId })
    .onConflictDoNothing();
  return { success: true };
}

/** A store's requests, for the Apps page. */
export async function listStoreAppRequests(sellerId: string, storeId: string): Promise<StoreAppRequestSummary[]> {
  const rows = await db
    .select({ appKey: storeAppRequests.appKey, status: storeAppRequests.status })
    .from(storeAppRequests)
    .where(and(eq(storeAppRequests.sellerId, sellerId), eq(storeAppRequests.storeId, storeId)));
  return rows as StoreAppRequestSummary[];
}
