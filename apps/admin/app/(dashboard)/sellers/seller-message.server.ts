import { billingTags, createCachedQuery } from "@workspace/cache";
import { db, sql } from "@workspace/db";
import { exchangeRateSource, isProActive } from "@workspace/lib/billing";
import { getBillingState } from "@workspace/lib/billing/server";
import {
  FEED_MESSAGE_CURRENCIES,
  buildSellerWhatsAppMessage,
  currencyFor,
  dialectFor,
  messageMoney,
  resolveMessageCountry,
  sellerMessageActivation,
  sellerMessageStep,
  type MessageRates,
} from "./seller-message.lib";

/**
 * Server side of the Admin → seller WhatsApp message (seller-message.lib.ts):
 * the per-seller facts in one batched query, and the rates read once per call.
 * Server-only (not a server action): callers are Admin loaders that already
 * checked the admin session. Never throws; a seller without facts gets no
 * entry, and the caller falls back to the plain welcome message.
 */

/** Seller ids per query: keeps an export of thousands of sellers to a few round trips. */
const CHUNK = 500;
const FEED_TIMEOUT_MS = 4000;

type FactsRow = {
  id: string;
  business_name: string;
  owner_name: string | null;
  owner_phone: string | null;
  support_phone: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  plan_grace_until: string | null;
  store_name: string | null;
  store_currency: string | null;
  template_chosen: boolean;
  has_active_product: boolean;
  has_top_up: boolean;
  had_positive_balance: boolean;
  has_pending_top_up: boolean;
};

/**
 * One row per seller. "Template chosen" is storeTemplateChosen
 * (packages/lib/src/store-sites/template-choice.server.ts) over any live store;
 * the activation columns are getOrderLock's (billing/order-lock.server.ts).
 */
async function loadFacts(sellerIds: string[]): Promise<FactsRow[]> {
  const ids = sql.join(sellerIds.map((id) => sql`${id}::uuid`), sql`, `);
  const result = await db.execute<FactsRow>(sql`
    SELECT
      s.id,
      s.business_name,
      u.full_name AS owner_name,
      u.phone AS owner_phone,
      s.support_phone,
      s.plan,
      s.plan_expires_at::text AS plan_expires_at,
      s.plan_grace_until::text AS plan_grace_until,
      ps.name AS store_name,
      ps.settings->>'currency' AS store_currency,
      EXISTS (
        SELECT 1 FROM stores st
        WHERE st.seller_id = s.id AND st.deleted_at IS NULL
          AND (st.first_published_at IS NOT NULL
            OR st.site_status IN ('published', 'unpublished')
            OR EXISTS (SELECT 1 FROM template_installs ti WHERE ti.store_id = st.id AND ti.undone_at IS NULL))
      ) AS template_chosen,
      EXISTS (
        SELECT 1 FROM products p
        WHERE p.seller_id = s.id AND p.status = 'active' AND p.deleted_at IS NULL
      ) AS has_active_product,
      (EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = s.id AND t.status = 'succeeded')
        OR EXISTS (SELECT 1 FROM wallet_transactions wt WHERE wt.seller_id = s.id AND wt.type = 'top_up')
      ) AS has_top_up,
      (coalesce((SELECT w.balance FROM seller_wallet w WHERE w.seller_id = s.id), 0) > 0
        OR EXISTS (SELECT 1 FROM wallet_transactions wt WHERE wt.seller_id = s.id AND wt.currency = 'USD' AND wt.balance_after > 0)
      ) AS had_positive_balance,
      EXISTS (
        SELECT 1 FROM seller_wallet_top_ups t
        WHERE t.seller_id = s.id AND t.status = 'pending' AND t.provider IN ('instapay', 'vodafone_cash')
      ) AS has_pending_top_up
    FROM sellers s
    LEFT JOIN users u ON u.id = s.id
    LEFT JOIN LATERAL (
      SELECT st.name, st.settings FROM stores st
      WHERE st.seller_id = s.id AND st.deleted_at IS NULL
      ORDER BY st.is_primary DESC, st.created_at ASC
      LIMIT 1
    ) ps ON true
    WHERE s.id IN (${ids})
  `);
  return Array.isArray(result) ? result : ((result as { rows?: FactsRow[] }).rows ?? []);
}

/** USD→X for the Gulf and Jordanian currencies, from the billing cron's feed. Cached 3 hours, cleared with the billing rate. */
const getCachedFeedRates = createCachedQuery({
  name: "admin:seller-message-rates:v1",
  ttl: 3 * 60 * 60,
  tags: () => [billingTags.rate()],
  query: async () => {
    const response = await fetch(exchangeRateSource(process.env.EXCHANGE_RATE_API_KEY).url, {
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`exchange rate feed http_${response.status}`);
    const body = (await response.json()) as { result?: string; rates?: unknown; conversion_rates?: unknown } | null;
    const table = (body?.result === "success" ? (body.conversion_rates ?? body.rates) : null) as Record<string, unknown> | null;
    const rates: Record<string, number> = {};
    for (const code of FEED_MESSAGE_CURRENCIES) {
      const rate = Number(table?.[code]);
      // Loose sanity range: KWD ≈ 0.3, SAR ≈ 3.75 per dollar.
      if (Number.isFinite(rate) && rate >= 0.1 && rate <= 100) rates[code] = rate;
    }
    // Throwing keeps a bad answer out of the cache.
    if (Object.keys(rates).length === 0) throw new Error("exchange rate feed bad_response");
    return rates;
  },
});

async function feedRates(): Promise<Record<string, number>> {
  try {
    return await getCachedFeedRates();
  } catch (error) {
    console.error("[sellers] message exchange rates unavailable", error instanceof Error ? error.message : error);
    return {};
  }
}

/**
 * The WhatsApp message for each seller, keyed by seller id. Reads the billing
 * state once, and the exchange-rate feed only if a seller needs a Gulf or
 * Jordanian price.
 */
export async function getSellerWhatsAppMessages(sellerIds: string[]): Promise<Map<string, string>> {
  const messages = new Map<string, string>();
  const unique = [...new Set(sellerIds)];
  if (!unique.length) return messages;
  try {
    const billing = await getBillingState().catch(() => null);
    const rows: FactsRow[] = [];
    // Sequential: the serverless DB pool is small.
    for (let i = 0; i < unique.length; i += CHUNK) rows.push(...(await loadFacts(unique.slice(i, i + CHUNK))));

    const countries = rows.map((row) =>
      resolveMessageCountry({ storeCurrency: row.store_currency, phones: [row.owner_phone, row.support_phone] }),
    );
    const needsFeed = countries.some((country) => !["EGP", "USD"].includes(currencyFor(country)));
    const rates: MessageRates = {
      egpPerUsd: billing?.marketRate ?? null,
      taxEnabled: billing?.taxEnabled === true,
      taxRateBps: billing?.taxRateBps ?? 0,
      usd: needsFeed ? await feedRates() : {},
    };

    rows.forEach((row, i) => {
      const country = countries[i] ?? null;
      const isPro = isProActive({
        plan: row.plan,
        planExpiresAt: row.plan_expires_at,
        planGraceUntil: row.plan_grace_until,
      });
      messages.set(
        row.id,
        buildSellerWhatsAppMessage({
          dialect: dialectFor(country),
          ownerName: row.owner_name,
          storeName: row.store_name?.trim() || row.business_name,
          plan: isPro ? "pro" : "free",
          step: sellerMessageStep({ templateChosen: row.template_chosen, hasActiveProduct: row.has_active_product }),
          activation: sellerMessageActivation({
            // No billing state: treat as before the switch, so nobody is told to top up by mistake.
            usdLive: billing?.usdLive === true,
            isPro,
            hasTopUp: row.has_top_up,
            hasHadPositiveBalance: row.had_positive_balance,
            hasPendingTopUp: row.has_pending_top_up,
          }),
          money: messageMoney(currencyFor(country), rates),
        }),
      );
    });
  } catch (error) {
    console.error("[sellers] WhatsApp messages failed", error);
  }
  return messages;
}
