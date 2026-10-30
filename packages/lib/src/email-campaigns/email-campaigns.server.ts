/**
 * Store email campaigns and win-back emails (ROADMAP.md F-16a, F-16e; 0129).
 * Server-only, never cached: emails are personal data, never logged and only
 * shown to the store's own seller as counts.
 *
 * Dashboard functions take the session's sellerId and an explicit storeId;
 * every query joins `stores` on that seller (CLAUDE.md rule 5), so a foreign
 * store or campaign reads as not found. Cron functions (claim / mark /
 * release / plan) work across stores and never take input from a browser.
 */
import { and, db, desc, eq, isNull, sql, storeEmailCampaigns, stores } from "@workspace/db";
import { listStoreCustomers } from "../customers/customers.server";
import { listAllStoreSubscribers } from "../store-forms/subscribers.server";
import { listStoreBlockedPhones } from "../stores/blocked-phones.server";
import {
  buildRecipientList,
  campaignLocale,
  campaignSendError,
  canQueueCampaign,
  customersForAudience,
  EMAIL_CLAIM_STALE_MINUTES,
  EMAIL_SEND_MAX_ATTEMPTS,
  emailCampaignLimits,
  isEmailUnsubscribeToken,
  isUuid,
  parseWinbackSettings,
  selectWinbackCustomers,
  statusAfterFailure,
  WINBACK_STORES_PER_RUN,
  type CampaignAudience,
  type CampaignContent,
  type CampaignSendError,
  type CampaignStatus,
  type RecipientList,
  type WinbackSettings,
} from "./email-campaigns.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const rowsOf = <T,>(result: unknown): T[] => [...(result as Iterable<T>)];

export type StoreCampaign = {
  id: string;
  storeId: string;
  subject: string;
  body: string;
  ctaLabel: string | null;
  productIds: string[];
  audience: CampaignAudience;
  inactiveDays: number | null;
  locale: "ar" | "en";
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  testSendCount: number;
  createdAt: string;
  queuedAt: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
};

const campaignColumns = {
  id: storeEmailCampaigns.id,
  storeId: storeEmailCampaigns.storeId,
  subject: storeEmailCampaigns.subject,
  body: storeEmailCampaigns.body,
  ctaLabel: storeEmailCampaigns.ctaLabel,
  productIds: storeEmailCampaigns.productIds,
  audience: storeEmailCampaigns.audience,
  inactiveDays: storeEmailCampaigns.inactiveDays,
  locale: storeEmailCampaigns.locale,
  status: storeEmailCampaigns.status,
  recipientCount: storeEmailCampaigns.recipientCount,
  sentCount: storeEmailCampaigns.sentCount,
  failedCount: storeEmailCampaigns.failedCount,
  skippedCount: storeEmailCampaigns.skippedCount,
  testSendCount: storeEmailCampaigns.testSendCount,
  createdAt: storeEmailCampaigns.createdAt,
  queuedAt: storeEmailCampaigns.queuedAt,
  scheduledAt: storeEmailCampaigns.scheduledAt,
  completedAt: storeEmailCampaigns.completedAt,
};

type CampaignRow = { [K in keyof typeof campaignColumns]: unknown };
const toCampaign = (row: CampaignRow): StoreCampaign => ({
  ...(row as unknown as StoreCampaign),
  productIds: Array.isArray(row.productIds) ? (row.productIds as string[]) : [],
  locale: campaignLocale(row.locale),
});

const ownStore = (sellerId: string, storeId: string) =>
  and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt));

/** The store's campaigns, newest first (up to 50). */
export async function listStoreCampaigns(sellerId: string, storeId: string, q: Queryable = db): Promise<StoreCampaign[]> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return [];
  const rows = await q
    .select(campaignColumns)
    .from(storeEmailCampaigns)
    .innerJoin(stores, and(eq(stores.id, storeEmailCampaigns.storeId), ownStore(sellerId, storeId)))
    .where(and(eq(storeEmailCampaigns.storeId, storeId), eq(storeEmailCampaigns.sellerId, sellerId)))
    .orderBy(desc(storeEmailCampaigns.createdAt))
    .limit(50);
  return rows.map(toCampaign);
}

export async function getStoreCampaign(sellerId: string, storeId: string, campaignId: string, q: Queryable = db): Promise<StoreCampaign | null> {
  if (!isUuid(sellerId) || !isUuid(storeId) || !isUuid(campaignId)) return null;
  const [row] = await q
    .select(campaignColumns)
    .from(storeEmailCampaigns)
    .innerJoin(stores, and(eq(stores.id, storeEmailCampaigns.storeId), ownStore(sellerId, storeId)))
    .where(
      and(
        eq(storeEmailCampaigns.id, campaignId),
        eq(storeEmailCampaigns.storeId, storeId),
        eq(storeEmailCampaigns.sellerId, sellerId),
      ),
    )
    .limit(1);
  return row ? toCampaign(row) : null;
}

/** A new empty draft in the store's language; null when the store is not the seller's. */
export async function createCampaignDraft(
  sellerId: string,
  storeId: string,
  userId: string | null,
  q: Queryable = db,
): Promise<string | null> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return null;
  const [store] = await q.select({ defaultLocale: stores.defaultLocale }).from(stores).where(ownStore(sellerId, storeId)).limit(1);
  if (!store) return null;
  const [row] = await q
    .insert(storeEmailCampaigns)
    .values({
      storeId,
      sellerId,
      locale: campaignLocale(store.defaultLocale),
      createdBy: userId && isUuid(userId) ? userId : null,
    })
    .returning({ id: storeEmailCampaigns.id });
  return row?.id ?? null;
}

/** Saves a draft's content. Only drafts change; false when not found or no longer a draft. */
export async function saveCampaignDraft(
  sellerId: string,
  storeId: string,
  campaignId: string,
  content: CampaignContent,
  q: Queryable = db,
): Promise<boolean> {
  if (!isUuid(sellerId) || !isUuid(storeId) || !isUuid(campaignId)) return false;
  // Featured products: only the seller's own live products are kept.
  const productIds = await filterOwnProducts(sellerId, content.productIds, q);
  const rows = rowsOf<{ id: string }>(
    await q.execute(sql`
      UPDATE store_email_campaigns c
         SET subject = ${content.subject}, body = ${content.body}, cta_label = ${content.ctaLabel},
             product_ids = ${uuidArray(productIds)}, audience = ${content.audience},
             inactive_days = ${content.inactiveDays}, updated_at = now()
        FROM stores st
       WHERE c.id = ${campaignId} AND c.store_id = ${storeId} AND c.seller_id = ${sellerId} AND c.status = 'draft'
         AND st.id = c.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
      RETURNING c.id
    `),
  );
  return rows.length > 0;
}

export async function deleteCampaignDraft(sellerId: string, storeId: string, campaignId: string, q: Queryable = db): Promise<boolean> {
  if (!isUuid(sellerId) || !isUuid(storeId) || !isUuid(campaignId)) return false;
  const rows = rowsOf<{ id: string }>(
    await q.execute(sql`
      DELETE FROM store_email_campaigns c
       USING stores st
       WHERE c.id = ${campaignId} AND c.store_id = ${storeId} AND c.seller_id = ${sellerId} AND c.status = 'draft'
         AND st.id = c.store_id AND st.seller_id = ${sellerId}
      RETURNING c.id
    `),
  );
  return rows.length > 0;
}

/** Stops a queued or sending campaign: its unsent recipients become 'skipped'. */
export async function cancelCampaign(sellerId: string, storeId: string, campaignId: string, q: Queryable = db): Promise<boolean> {
  if (!isUuid(sellerId) || !isUuid(storeId) || !isUuid(campaignId)) return false;
  return (q as typeof db).transaction(async (tx) => {
    const rows = rowsOf<{ id: string }>(
      await tx.execute(sql`
        UPDATE store_email_campaigns c
           SET status = 'cancelled', cancelled_at = now(), updated_at = now()
          FROM stores st
         WHERE c.id = ${campaignId} AND c.store_id = ${storeId} AND c.seller_id = ${sellerId}
           AND c.status IN ('scheduled', 'sending')
           AND st.id = c.store_id AND st.seller_id = ${sellerId}
        RETURNING c.id
      `),
    );
    if (!rows.length) return false;
    await tx.execute(sql`
      UPDATE store_email_campaign_recipients SET status = 'skipped'
       WHERE campaign_id = ${campaignId} AND status = 'pending'
    `);
    await refreshCampaignCounts(tx, sql`c.id = ${campaignId}`);
    return true;
  });
}

const uuidArray = (ids: readonly string[]) =>
  ids.length ? sql`ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}]::uuid[]` : sql`'{}'::uuid[]`;

/** The ids that are this seller's active, non-trashed products, in the given order. */
async function filterOwnProducts(sellerId: string, ids: readonly string[], q: Queryable): Promise<string[]> {
  const wanted = ids.filter(isUuid);
  if (!wanted.length) return [];
  const rows = rowsOf<{ id: string }>(
    await q.execute(sql`
      SELECT id FROM products
       WHERE seller_id = ${sellerId} AND id = ANY(${uuidArray(wanted)}) AND status = 'active' AND deleted_at IS NULL
    `),
  );
  const own = new Set(rows.map((r) => String(r.id)));
  return wanted.filter((id) => own.has(id));
}

export type CampaignProductOption = { id: string; title: string; image: string | null };

/** Products the composer can feature: the store's live catalog, newest first (up to 200). */
export async function listCampaignProductOptions(
  sellerId: string,
  storeId: string,
  locale: string,
  q: Queryable = db,
): Promise<CampaignProductOption[]> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return [];
  const rows = rowsOf<{ id: string; title: string | null; images: unknown }>(
    await q.execute(sql`
      SELECT p.id, p.images,
             coalesce(
               (SELECT t.title FROM product_translations t WHERE t.product_id = p.id AND t.locale = ${locale === "en" ? "en" : "ar"} LIMIT 1),
               (SELECT t.title FROM product_translations t WHERE t.product_id = p.id ORDER BY t.locale LIMIT 1),
               p.sku
             ) AS title
        FROM products p
        JOIN stores st ON st.id = ${storeId} AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
       WHERE p.seller_id = ${sellerId} AND p.status = 'active' AND p.deleted_at IS NULL
         AND (st.catalog_mode <> 'selected'
              OR EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = st.id AND sp.product_id = p.id))
       ORDER BY p.created_at DESC NULLS LAST
       LIMIT 200
    `),
  );
  return rows.map((r) => ({ id: String(r.id), title: r.title ? String(r.title) : "—", image: firstImage(r.images) }));
}

function firstImage(images: unknown): string | null {
  const first = Array.isArray(images) ? images[0] : images;
  if (typeof first === "string") return first || null;
  const url = (first as { url?: unknown } | null)?.url;
  return typeof url === "string" && url ? url : null;
}

// ---------------------------------------------------------------------------
// Audiences

/** Every email on the store's unsubscribe list (the store must be the seller's). */
export async function loadStoreUnsubscribed(sellerId: string, storeId: string, q: Queryable = db): Promise<Set<string>> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return new Set();
  const rows = rowsOf<{ email: string }>(
    await q.execute(sql`
      SELECT u.email FROM store_email_unsubscribes u
        JOIN stores st ON st.id = u.store_id AND st.seller_id = ${sellerId}
       WHERE u.store_id = ${storeId}
    `),
  );
  return new Set(rows.map((r) => String(r.email)));
}

/**
 * Raw contact emails of an audience, newest first. Subscribers: subscribed
 * newsletter sign-ups. Customers: signed-in buyers' account emails (guests
 * have none), minus phones on the store's blocklist (F-02).
 */
export async function loadAudienceEmails(
  sellerId: string,
  storeId: string,
  audience: CampaignAudience,
  options: { inactiveDays?: number | null; now?: Date } = {},
  q: Queryable = db,
): Promise<Array<string | null>> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return [];
  if (audience === "subscribers") {
    const subscribers = await listAllStoreSubscribers(sellerId, storeId, { status: "subscribed" }, q);
    return subscribers.map((s) => s.email);
  }
  const customers = await listStoreCustomers(sellerId, storeId, q);
  if (!customers.length) return [];
  const blocked = new Set((await listStoreBlockedPhones(storeId)).map((b) => b.phone));
  return customersForAudience(customers, audience, { now: options.now ?? new Date(), inactiveDays: options.inactiveDays })
    .filter((c) => !(c.phone && blocked.has(c.phone)))
    .map((c) => c.email);
}

export type AudiencePreview = Omit<RecipientList, "emails"> & { recipients: number; max: number };

/** Recipient count for the composer, after unsubscribes, placeholders and the plan cap. */
export async function previewCampaignAudience(
  sellerId: string,
  storeId: string,
  audience: CampaignAudience,
  options: { inactiveDays?: number | null; plan?: string | null },
  q: Queryable = db,
): Promise<AudiencePreview> {
  const max = emailCampaignLimits(options.plan).maxRecipients;
  const [raw, unsubscribed] = await Promise.all([
    loadAudienceEmails(sellerId, storeId, audience, { inactiveDays: options.inactiveDays }, q),
    loadStoreUnsubscribed(sellerId, storeId, q),
  ]);
  const { emails, ...rest } = buildRecipientList(raw, { unsubscribed, max });
  return { ...rest, recipients: emails.length, max };
}

/** Campaigns the store queued in the last 24 hours (the daily cap). */
export async function countCampaignsQueuedToday(sellerId: string, storeId: string, q: Queryable = db): Promise<number> {
  const rows = rowsOf<{ n: number }>(
    await q.execute(sql`
      SELECT count(*)::int AS n FROM store_email_campaigns
       WHERE store_id = ${storeId} AND seller_id = ${sellerId} AND queued_at > now() - interval '24 hours'
    `),
  );
  return rows[0]?.n ?? 0;
}

export type QueueCampaignResult =
  | { ok: true; recipients: number }
  | { ok: false; error: "notFound" | "notDraft" | "storeOffline" | "dailyLimit" | "noRecipients" | CampaignSendError };

/**
 * "Send now": checks the draft, the store (published and active) and the
 * daily cap under a lock on the store row, snapshots the recipients and
 * queues the campaign for the cron. The language is the store's default.
 */
export async function queueCampaign(
  sellerId: string,
  storeId: string,
  campaignId: string,
  options: { plan?: string | null; now?: Date; scheduledAt?: Date | null } = {},
  q: typeof db = db,
): Promise<QueueCampaignResult> {
  const scheduledAt = options.scheduledAt ? options.scheduledAt.toISOString() : null;
  if (!isUuid(sellerId) || !isUuid(storeId) || !isUuid(campaignId)) return { ok: false, error: "notFound" };
  const limits = emailCampaignLimits(options.plan);
  return q.transaction(async (tx) => {
    // One queue at a time per store: the daily cap can't be raced.
    const [store] = rowsOf<{ status: string; site_status: string; default_locale: string }>(
      await tx.execute(sql`
        SELECT status, site_status, default_locale FROM stores
         WHERE id = ${storeId} AND seller_id = ${sellerId} AND deleted_at IS NULL
         FOR UPDATE
      `),
    );
    if (!store) return { ok: false, error: "notFound" } as const;
    const campaign = await getStoreCampaign(sellerId, storeId, campaignId, tx);
    if (!campaign) return { ok: false, error: "notFound" } as const;
    if (campaign.status !== "draft") return { ok: false, error: "notDraft" } as const;
    const contentError = campaignSendError(campaign);
    if (contentError) return { ok: false, error: contentError } as const;
    if (store.status !== "active" || store.site_status !== "published") return { ok: false, error: "storeOffline" } as const;
    if (!canQueueCampaign(await countCampaignsQueuedToday(sellerId, storeId, tx), limits)) {
      return { ok: false, error: "dailyLimit" } as const;
    }

    const [raw, unsubscribed] = await Promise.all([
      loadAudienceEmails(sellerId, storeId, campaign.audience, { inactiveDays: campaign.inactiveDays, now: options.now }, tx),
      loadStoreUnsubscribed(sellerId, storeId, tx),
    ]);
    const { emails } = buildRecipientList(raw, { unsubscribed, max: limits.maxRecipients });
    if (!emails.length) return { ok: false, error: "noRecipients" } as const;

    for (let i = 0; i < emails.length; i += 250) {
      const chunk = emails.slice(i, i + 250);
      await tx.execute(sql`
        INSERT INTO store_email_campaign_recipients (campaign_id, store_id, email)
        SELECT ${campaignId}::uuid, ${storeId}::uuid, e FROM unnest(${sql`ARRAY[${sql.join(chunk.map((e) => sql`${e}`), sql`, `)}]::text[]`}) AS e
        ON CONFLICT (campaign_id, email) DO NOTHING
      `);
    }
    await tx.execute(sql`
      UPDATE store_email_campaigns
         SET status = 'scheduled', scheduled_at = coalesce(${scheduledAt}::timestamptz, now()), queued_at = now(), updated_at = now(),
             locale = ${campaignLocale(store.default_locale)}, recipient_count = ${emails.length},
             sent_count = 0, failed_count = 0, skipped_count = 0
       WHERE id = ${campaignId} AND seller_id = ${sellerId} AND status = 'draft'
    `);
    return { ok: true, recipients: emails.length } as const;
  });
}

/** Counts one test send if the campaign is under the cap; false when over it or not found. */
export async function claimCampaignTestSend(
  sellerId: string,
  storeId: string,
  campaignId: string,
  max: number,
  q: Queryable = db,
): Promise<boolean> {
  if (!isUuid(sellerId) || !isUuid(storeId) || !isUuid(campaignId)) return false;
  const rows = rowsOf<{ id: string }>(
    await q.execute(sql`
      UPDATE store_email_campaigns c
         SET test_send_count = test_send_count + 1, last_test_at = now()
        FROM stores st
       WHERE c.id = ${campaignId} AND c.store_id = ${storeId} AND c.seller_id = ${sellerId}
         AND c.test_send_count < ${max}
         AND st.id = c.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
      RETURNING c.id
    `),
  );
  return rows.length > 0;
}

/** Gives a test send back after the email failed. */
export async function releaseCampaignTestSend(sellerId: string, campaignId: string, q: Queryable = db): Promise<void> {
  await q.execute(sql`
    UPDATE store_email_campaigns SET test_send_count = greatest(test_send_count - 1, 0)
     WHERE id = ${campaignId} AND seller_id = ${sellerId}
  `);
}

// ---------------------------------------------------------------------------
// Win-back settings (stores.settings.winback)

export type WinbackOverview = WinbackSettings & { sentLast30Days: number; pending: number };

export async function getStoreWinback(sellerId: string, storeId: string, q: Queryable = db): Promise<WinbackOverview | null> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return null;
  const [store] = await q.select({ settings: stores.settings }).from(stores).where(ownStore(sellerId, storeId)).limit(1);
  if (!store) return null;
  const [counts] = rowsOf<{ sent: number; pending: number }>(
    await q.execute(sql`
      SELECT count(*) FILTER (WHERE status = 'sent' AND sent_at > now() - interval '30 days')::int AS sent,
             count(*) FILTER (WHERE status IN ('pending', 'sending'))::int AS pending
        FROM store_winback_sends WHERE store_id = ${storeId} AND seller_id = ${sellerId}
    `),
  );
  return { ...parseWinbackSettings(store.settings), sentLast30Days: counts?.sent ?? 0, pending: counts?.pending ?? 0 };
}

/** Saves stores.settings.winback (other keys kept). False when the store is not the seller's. */
export async function saveStoreWinback(sellerId: string, storeId: string, value: WinbackSettings, q: Queryable = db): Promise<boolean> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return false;
  const rows = await q
    .update(stores)
    .set({
      settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('winback', ${JSON.stringify(value)}::jsonb)`,
      updatedAt: sql`now()`,
    })
    .where(ownStore(sellerId, storeId))
    .returning({ id: stores.id });
  if (rows.length && !value.enabled) {
    // Turning it off stops what was planned and not sent yet.
    await q.execute(sql`UPDATE store_winback_sends SET status = 'skipped' WHERE store_id = ${storeId} AND status = 'pending'`);
  }
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Cron: campaigns

/** Moves due 'scheduled' campaigns to 'sending'. */
export async function startDueCampaigns(q: Queryable = db): Promise<number> {
  return rowsOf<{ id: string }>(
    await q.execute(sql`
      UPDATE store_email_campaigns SET status = 'sending', started_at = coalesce(started_at, now()), updated_at = now()
       WHERE status = 'scheduled' AND (scheduled_at IS NULL OR scheduled_at <= now())
      RETURNING id
    `),
  ).length;
}

/**
 * Claims up to `limit` recipients of sending campaigns (oldest campaign
 * first): pending rows, or rows a crashed run left in 'sending'. The claim is
 * status 'sending' + claimed_at + attempts + 1, under FOR UPDATE SKIP LOCKED.
 */
export async function claimCampaignRecipients(
  { limit, campaignId }: { limit: number; campaignId?: string | null },
  q: Queryable = db,
): Promise<string[]> {
  const n = Math.max(1, Math.min(500, Math.floor(limit)));
  const only = campaignId && isUuid(campaignId) ? sql`AND c.id = ${campaignId}` : sql``;
  return rowsOf<{ id: string }>(
    await q.execute(sql`
      UPDATE store_email_campaign_recipients r
         SET status = 'sending', claimed_at = now(), attempts = r.attempts + 1
       WHERE r.id IN (
         SELECT x.id
           FROM store_email_campaign_recipients x
           JOIN store_email_campaigns c ON c.id = x.campaign_id AND c.status = 'sending'
          WHERE ((x.status = 'pending' AND (x.claimed_at IS NULL OR x.claimed_at < now() - interval '10 minutes'))
                 OR (x.status = 'sending' AND x.claimed_at < now() - make_interval(mins => ${EMAIL_CLAIM_STALE_MINUTES})))
            AND x.attempts < ${EMAIL_SEND_MAX_ATTEMPTS}
            ${only}
          ORDER BY c.started_at NULLS LAST, x.created_at
          LIMIT ${n}
          FOR UPDATE OF x SKIP LOCKED
       )
      RETURNING r.id
    `),
  ).map((r) => String(r.id));
}

/** Records the backend's answer for one claimed recipient. */
export async function markCampaignRecipient(id: string, result: "sent" | "skipped", q: Queryable = db): Promise<void> {
  await q.execute(sql`
    UPDATE store_email_campaign_recipients
       SET status = ${result}, sent_at = CASE WHEN ${result} = 'sent' THEN now() ELSE sent_at END
     WHERE id = ${id} AND status = 'sending'
  `);
}

/** A failed send: back to 'pending' for the next batch, or 'failed' after the last try. */
export async function releaseCampaignRecipient(id: string, q: Queryable = db): Promise<void> {
  const [row] = rowsOf<{ attempts: number }>(
    await q.execute(sql`SELECT attempts FROM store_email_campaign_recipients WHERE id = ${id}`),
  );
  const next = statusAfterFailure(row?.attempts ?? EMAIL_SEND_MAX_ATTEMPTS);
  await q.execute(sql`
    UPDATE store_email_campaign_recipients SET status = ${next}, claimed_at = now()
     WHERE id = ${id} AND status = 'sending'
  `);
}

async function refreshCampaignCounts(q: Queryable, where: ReturnType<typeof sql>) {
  await q.execute(sql`
    UPDATE store_email_campaigns c
       SET sent_count = k.sent, failed_count = k.failed, skipped_count = k.skipped, updated_at = now(),
           status = CASE WHEN c.status = 'sending' AND k.open = 0 THEN 'sent' ELSE c.status END,
           completed_at = CASE WHEN c.status = 'sending' AND k.open = 0 THEN now() ELSE c.completed_at END
      FROM (
        SELECT r.campaign_id,
               count(*) FILTER (WHERE r.status = 'sent')::int AS sent,
               count(*) FILTER (WHERE r.status = 'failed')::int AS failed,
               count(*) FILTER (WHERE r.status = 'skipped')::int AS skipped,
               count(*) FILTER (WHERE r.status IN ('pending', 'sending'))::int AS open
          FROM store_email_campaign_recipients r
          JOIN store_email_campaigns c ON c.id = r.campaign_id
         WHERE ${where}
         GROUP BY r.campaign_id
      ) k
     WHERE c.id = k.campaign_id
  `);
}

/** Updates the counts of campaigns in progress and closes the finished ones ('sent'). */
export async function finalizeCampaigns(q: Queryable = db): Promise<void> {
  await refreshCampaignCounts(q, sql`c.status = 'sending'`);
  // A sending campaign with no recipients at all (all rows removed) closes too.
  await q.execute(sql`
    UPDATE store_email_campaigns c SET status = 'sent', completed_at = now(), updated_at = now()
     WHERE c.status = 'sending' AND NOT EXISTS (SELECT 1 FROM store_email_campaign_recipients r WHERE r.campaign_id = c.id)
  `);
}

// ---------------------------------------------------------------------------
// Cron: win-back

export type WinbackPlanSummary = { stores: number; planned: number };

/**
 * Plans today's win-back emails: for each live store with win-back on, its
 * eligible customers (see isWinbackEligible) minus unsubscribed, blocked and
 * already-planned ones, up to the store's daily cap. One row per email and
 * inactivity period (unique), so a customer is written to once per period.
 */
export async function planWinbackSends(options: { now?: Date; plan?: string | null } = {}, q: typeof db = db): Promise<WinbackPlanSummary> {
  const now = options.now ?? new Date();
  const storesOn = rowsOf<{ id: string; seller_id: string; settings: unknown; default_locale: string; plan: string | null }>(
    await q.execute(sql`
      SELECT st.id, st.seller_id, st.settings, st.default_locale, se.plan
        FROM stores st
        JOIN sellers se ON se.id = st.seller_id
       WHERE st.deleted_at IS NULL AND st.status = 'active' AND st.site_status = 'published'
         AND (st.settings -> 'winback' ->> 'enabled') = 'true'
       ORDER BY st.id
       LIMIT ${WINBACK_STORES_PER_RUN}
    `),
  );

  const summary: WinbackPlanSummary = { stores: 0, planned: 0 };
  for (const store of storesOn) {
    const settings = parseWinbackSettings(store.settings);
    if (!settings.enabled) continue;
    summary.stores++;
    const sellerId = String(store.seller_id);
    const storeId = String(store.id);
    const cap = emailCampaignLimits(store.plan).winbackPerStorePerDay;
    const [today] = rowsOf<{ n: number }>(
      await q.execute(sql`
        SELECT count(*)::int AS n FROM store_winback_sends
         WHERE store_id = ${storeId} AND created_at > now() - interval '24 hours'
      `),
    );
    const room = cap - (today?.n ?? 0);
    if (room <= 0) continue;

    const [customers, unsubscribed, blocked, recent] = await Promise.all([
      listStoreCustomers(sellerId, storeId, q),
      loadStoreUnsubscribed(sellerId, storeId, q),
      listStoreBlockedPhones(storeId),
      // Emails written to (or planned) within the period: never twice in N days.
      q.execute(sql`
        SELECT DISTINCT email FROM store_winback_sends
         WHERE store_id = ${storeId} AND created_at > now() - make_interval(days => ${settings.days})
      `),
    ]);
    for (const row of rowsOf<{ email: string }>(recent)) unsubscribed.add(String(row.email));
    const picked = selectWinbackCustomers(customers, {
      now,
      days: settings.days,
      unsubscribed,
      blockedPhones: new Set(blocked.map((b) => b.phone)),
      max: room,
    });
    if (!picked.length) continue;

    const locale = campaignLocale(store.default_locale);
    const inserted = rowsOf<{ id: string }>(
      await q.execute(sql`
        INSERT INTO store_winback_sends (store_id, seller_id, email, last_order_at, locale)
        SELECT ${storeId}::uuid, ${sellerId}::uuid, x.email, x.last_order_at::timestamptz, ${locale}
          FROM jsonb_to_recordset(${JSON.stringify(picked.map((p) => ({ email: p.email, last_order_at: p.lastOrderAt })))}::jsonb)
               AS x(email text, last_order_at text)
        ON CONFLICT (store_id, email, last_order_at) DO NOTHING
        RETURNING id
      `),
    );
    summary.planned += inserted.length;
  }
  return summary;
}

/** Claims up to `limit` planned win-back emails of stores that still have win-back on. */
export async function claimWinbackSends({ limit }: { limit: number }, q: Queryable = db): Promise<string[]> {
  const n = Math.max(1, Math.min(500, Math.floor(limit)));
  return rowsOf<{ id: string }>(
    await q.execute(sql`
      UPDATE store_winback_sends w
         SET status = 'sending', claimed_at = now(), attempts = w.attempts + 1
       WHERE w.id IN (
         SELECT x.id FROM store_winback_sends x
          WHERE ((x.status = 'pending' AND (x.claimed_at IS NULL OR x.claimed_at < now() - interval '10 minutes'))
                 OR (x.status = 'sending' AND x.claimed_at < now() - make_interval(mins => ${EMAIL_CLAIM_STALE_MINUTES})))
            AND x.attempts < ${EMAIL_SEND_MAX_ATTEMPTS}
          ORDER BY x.created_at
          LIMIT ${n}
          FOR UPDATE OF x SKIP LOCKED
       )
      RETURNING w.id
    `),
  ).map((r) => String(r.id));
}

export async function markWinbackSend(id: string, result: "sent" | "skipped", q: Queryable = db): Promise<void> {
  await q.execute(sql`
    UPDATE store_winback_sends
       SET status = ${result}, sent_at = CASE WHEN ${result} = 'sent' THEN now() ELSE sent_at END
     WHERE id = ${id} AND status = 'sending'
  `);
}

export async function releaseWinbackSend(id: string, q: Queryable = db): Promise<void> {
  const [row] = rowsOf<{ attempts: number }>(await q.execute(sql`SELECT attempts FROM store_winback_sends WHERE id = ${id}`));
  const next = statusAfterFailure(row?.attempts ?? EMAIL_SEND_MAX_ATTEMPTS);
  await q.execute(sql`UPDATE store_winback_sends SET status = ${next}, claimed_at = now() WHERE id = ${id} AND status = 'sending'`);
}

// ---------------------------------------------------------------------------
// Unsubscribe

/** Whether the store's unsubscribe list holds this (lower-cased) email. */
export async function isStoreEmailUnsubscribed(storeId: string, email: string, q: Queryable = db): Promise<boolean> {
  const rows = rowsOf<{ one: number }>(
    await q.execute(sql`SELECT 1 AS one FROM store_email_unsubscribes WHERE store_id = ${storeId} AND email = ${email.toLowerCase()} LIMIT 1`),
  );
  return rows.length > 0;
}

/**
 * The emails' unsubscribe link (campaign recipient or win-back token): adds
 * the email to the store's list and skips its unsent campaign and win-back
 * emails on that store. Returns the store name, or null for an unknown token.
 */
export async function unsubscribeByEmailToken(token: unknown, q: typeof db = db): Promise<{ storeName: string } | null> {
  if (!isEmailUnsubscribeToken(token)) return null;
  const [row] = rowsOf<{ store_id: string; email: string; store_name: string }>(
    await q.execute(sql`
      SELECT x.store_id, x.email, st.name AS store_name FROM (
        SELECT store_id, email FROM store_email_campaign_recipients WHERE unsubscribe_token = ${token}
        UNION ALL
        SELECT store_id, email FROM store_winback_sends WHERE unsubscribe_token = ${token}
      ) x JOIN stores st ON st.id = x.store_id
      LIMIT 1
    `),
  );
  if (!row) return null;
  await q.transaction(async (tx) => {
    await tx.execute(sql`
      INSERT INTO store_email_unsubscribes (store_id, email, source) VALUES (${row.store_id}, ${row.email}, 'link')
      ON CONFLICT (store_id, email) DO NOTHING
    `);
    await tx.execute(sql`
      UPDATE store_email_campaign_recipients SET status = 'skipped'
       WHERE store_id = ${row.store_id} AND email = ${row.email} AND status = 'pending'
    `);
    await tx.execute(sql`
      UPDATE store_winback_sends SET status = 'skipped'
       WHERE store_id = ${row.store_id} AND email = ${row.email} AND status = 'pending'
    `);
  });
  return { storeName: String(row.store_name) };
}

/** How many emails are on the store's unsubscribe list (dashboard). */
export async function countStoreUnsubscribed(sellerId: string, storeId: string, q: Queryable = db): Promise<number> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return 0;
  const [row] = rowsOf<{ n: number }>(
    await q.execute(sql`
      SELECT count(*)::int AS n FROM store_email_unsubscribes u
        JOIN stores st ON st.id = u.store_id AND st.seller_id = ${sellerId}
       WHERE u.store_id = ${storeId}
    `),
  );
  return row?.n ?? 0;
}
