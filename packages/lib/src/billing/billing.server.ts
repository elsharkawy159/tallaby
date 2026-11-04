import { billingSettings, db, desc, eq, exchangeRates } from "@workspace/db";
import { egpRateFromResponse, exchangeRateSource, type BillingState } from "./billing.lib";

/**
 * Billing settings and the current exchange rate (ROADMAP.md F-56b). Read
 * fresh, not cached: a top-up quote and an order fee must see the switch and
 * the Admin's rate as soon as they change. Server-only.
 */
export async function getBillingState(): Promise<BillingState> {
  const [[settings], [latest]] = await Promise.all([
    db.select().from(billingSettings).limit(1),
    db.select().from(exchangeRates).orderBy(desc(exchangeRates.fetchedAt)).limit(1),
  ]);
  const override = settings?.rateOverride ? Number(settings.rateOverride) : null;
  const fetched = latest ? Number(latest.marketRate) : null;
  return {
    usdLive: settings?.usdLive === true,
    marketRate: override ?? fetched ?? (settings?.conversionRate ? Number(settings.conversionRate) : null),
    taxEnabled: settings?.taxEnabled === true,
    taxRateBps: settings?.taxRateBps ?? 1400,
    rateFetchedAt: latest?.fetchedAt ?? null,
  };
}

/**
 * Saves the current market rate. Only the cron calls this, every 3 hours;
 * everything else reads the saved row, so no page calls the provider. A failed
 * or implausible fetch saves nothing, so the last good rate stays in use and the
 * caller can alert the Admin. Never log the URL: it can hold the API key.
 */
export async function refreshExchangeRate(
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; rate: number } | { ok: false; reason: string }> {
  try {
    const { url, source } = exchangeRateSource(process.env.EXCHANGE_RATE_API_KEY);
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return { ok: false, reason: `http_${response.status}` };
    const rate = egpRateFromResponse(await response.json());
    if (rate === null) return { ok: false, reason: "bad_response" };
    await db.insert(exchangeRates).values({ marketRate: rate.toFixed(4), source });
    return { ok: true, rate };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.name : "unknown" };
  }
}

/** Admin › Billing: tax switch and an optional fixed rate. Numbers already validated by the caller. */
export async function updateBillingSettings(
  input: {
    rateOverride: number | null;
    taxEnabled: boolean;
    updatedBy: string;
  },
  q: Pick<typeof db, "update"> = db,
): Promise<void> {
  await q
    .update(billingSettings)
    .set({
      rateOverride: input.rateOverride === null ? null : input.rateOverride.toFixed(4),
      taxEnabled: input.taxEnabled,
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(billingSettings.id, true));
}
