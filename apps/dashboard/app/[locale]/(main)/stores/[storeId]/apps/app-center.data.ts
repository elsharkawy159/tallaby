import { cache } from "react";
import { notFound } from "next/navigation";
import { listStoreAppInstalls } from "@workspace/lib/billing/apps";
import { getBillingState } from "@workspace/lib/billing/server";
import { listStoreAppRequests, listStoreIntegrations, type StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import type { StoreRow } from "@workspace/lib/stores/server";
import { isGoogleSheetsConfigured } from "@/lib/integrations/google-oauth.server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import type { AppCenterStoreState } from "./app-center.lib";

/**
 * One store's App Center state (ROADMAP.md F-93). Every query is scoped to the
 * session seller's store (`loadStorePage` already checked it; the lib queries
 * filter by seller and store again, rule 5). Never cached: install state is
 * per store and changes on every connect (rule 8).
 */
export async function loadAppCenterState(store: StoreRow): Promise<AppCenterStoreState & { summaries: StoreIntegrationSummary[] }> {
  const [integrations, installs, requests, billing] = await Promise.all([
    listStoreIntegrations(store.sellerId, store.id),
    listStoreAppInstalls(store.sellerId, store.id),
    listStoreAppRequests(store.sellerId, store.id),
    getBillingState(),
  ]);
  if (!integrations) notFound();
  return {
    summaries: integrations,
    integrations: integrations.map(({ provider, status }) => ({ provider, status })),
    installs: installs.map(({ appKey, cancelAtPeriodEnd }) => ({ appKey, cancelAtPeriodEnd })),
    requests,
    googleSheetsEnabled: isGoogleSheetsConfigured(),
    usdLive: billing.usdLive,
  };
}

/**
 * The store and its App Center state, once per request: the app layout and
 * its pages both call this (React `cache`, keyed by the store id string).
 */
export const loadAppCenterPage = cache(async (storeId: string) => {
  const store = await loadStorePage(storeId);
  const state = await loadAppCenterState(store);
  return { store, state, readOnly: store.status !== "active" };
});
