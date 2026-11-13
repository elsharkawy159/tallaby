import { db, sql } from "@workspace/db";
import { isProActive } from "@workspace/lib/billing";
import { getBillingState } from "@workspace/lib/billing/server";
import { storeUrl } from "@workspace/lib/storefront";
import {
  buildSellerWhatsAppMessage,
  dialectFor,
  resolveMessageCountry,
  sellerMessageActivation,
  sellerMessageStep,
} from "./seller-message.lib";

/**
 * Server side of the Admin → seller WhatsApp message (seller-message.lib.ts):
 * the per-seller facts in one batched query, and the billing state read once per call.
 * Server-only (not a server action): callers are Admin loaders that already
 * checked the admin session. Never throws; a seller without facts gets no
 * entry, and the caller falls back to the plain welcome message.
 */

/** Seller ids per query: keeps an export of thousands of sellers to a few round trips. */
const CHUNK = 500;

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
  store_subdomain: string | null;
  store_site_status: string | null;
  store_custom_domain: string | null;
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
      ps.subdomain AS store_subdomain,
      ps.site_status AS store_site_status,
      (SELECT d.domain FROM seller_custom_domains d
        WHERE d.store_id = ps.id AND d.status = 'active' LIMIT 1) AS store_custom_domain,
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
      SELECT st.id, st.name, st.settings, st.subdomain, st.site_status FROM stores st
      WHERE st.seller_id = s.id AND st.deleted_at IS NULL
      ORDER BY st.is_primary DESC, st.created_at ASC
      LIMIT 1
    ) ps ON true
    WHERE s.id IN (${ids})
  `);
  return Array.isArray(result) ? result : ((result as { rows?: FactsRow[] }).rows ?? []);
}

/**
 * The WhatsApp message for each seller, keyed by seller id. Reads the billing
 * state once (only to tell a pending top-up apart; the message never asks for money).
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

    for (const row of rows) {
      const country = resolveMessageCountry({
        storeCurrency: row.store_currency,
        phones: [row.owner_phone, row.support_phone],
      });
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
          // Only a published website is public (an unpublished one shows the offline page).
          storeLink:
            row.store_site_status === "published" && row.store_subdomain
              ? storeUrl(row.store_subdomain, row.store_custom_domain)
              : null,
          step: sellerMessageStep({ templateChosen: row.template_chosen, hasActiveProduct: row.has_active_product }),
          activation: sellerMessageActivation({
            // No billing state: treat as before the switch, so no top-up is mentioned by mistake.
            usdLive: billing?.usdLive === true,
            isPro,
            hasTopUp: row.has_top_up,
            hasHadPositiveBalance: row.had_positive_balance,
            hasPendingTopUp: row.has_pending_top_up,
          }),
        }),
      );
    }
  } catch (error) {
    console.error("[sellers] WhatsApp messages failed", error);
  }
  return messages;
}
