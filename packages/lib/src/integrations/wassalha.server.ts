import { db } from "@workspace/db";
import {
  readIntegrationConfig,
  saveSettingsIntegration,
  type IntegrationResult,
  type Queryable,
  type StoreIntegrationSummary,
} from "./store-integrations.server";
import { readWassalhaSettings, wassalhaSettingsSchema, type WassalhaSettings } from "./wassalha.lib";

/**
 * Store › Apps › Wassalha (ROADMAP.md F-12c). Server-only; every function
 * takes the session seller and an explicit store id (CLAUDE.md rule 5).
 */

const PROVIDER = "wassalha" as const;

export type WassalhaOverview = { summary: StoreIntegrationSummary; settings: WassalhaSettings | null };

export async function getWassalhaOverview(sellerId: string, storeId: string, q: Queryable = db): Promise<WassalhaOverview | null> {
  const row = await readIntegrationConfig(sellerId, storeId, PROVIDER, q);
  return row ? { summary: row.summary, settings: readWassalhaSettings(row.config) } : null;
}

/** The connected account the export prints, or null when Wassalha isn't set up for this store. */
export async function getStoreWassalha(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<{ integrationId: string; settings: WassalhaSettings } | null> {
  const row = await readIntegrationConfig(sellerId, storeId, PROVIDER, q);
  const settings = row && row.summary.status === "connected" ? readWassalhaSettings(row.config) : null;
  return row && settings ? { integrationId: row.integrationId, settings } : null;
}

export type SaveWassalhaError = "not_found" | "store_read_only" | "not_available" | "invalid_settings";

export async function saveWassalhaSettings(
  sellerId: string,
  actorId: string,
  storeId: string,
  raw: unknown,
  q: Queryable = db,
): Promise<IntegrationResult<WassalhaOverview, SaveWassalhaError>> {
  const parsed = wassalhaSettingsSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "invalid_settings" };
  const saved = await saveSettingsIntegration(sellerId, actorId, storeId, PROVIDER, parsed.data, q);
  return saved.success ? { success: true, data: { summary: saved.data, settings: parsed.data } } : saved;
}
