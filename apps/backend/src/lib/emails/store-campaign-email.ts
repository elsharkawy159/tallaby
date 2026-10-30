import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { render } from "@react-email/render";
import { and, db, emailDeliveries, eq, gt, inArray, isNull, products, sql, stores, users } from "@workspace/db";
import { getEmailMessages, interpolate, resolveEmailLocale, StoreCampaignEmail, emailPathPrefix, type EmailLocale } from "@workspace/emails";
import { pickProductTitle } from "@workspace/lib/orders";
import {
  CAMPAIGN_PRODUCTS_MAX,
  campaignSendError,
  emailUnsubscribeUrl,
  isUuid,
  parseCampaignInput,
  parseWinbackSettings,
} from "@workspace/lib/email-campaigns";
import { isStoreEmailUnsubscribed } from "@workspace/lib/email-campaigns/server";
import { ORDERS_FROM_ADDRESS } from "../resend";
import { EMAIL_TYPES } from "../email-delivery";
import { joinUrl, resolveImageUrl } from "./format";
import { sendOnce, type SendOnceResult } from "./send-once";
import { loadStoreEmailContext, type StoreEmailContext } from "./store-brand";

/**
 * Store email campaigns (F-16a) and win-back emails (F-16e), 0129. The
 * ecommerce cron claims one recipient / win-back row and calls these once
 * per id; the email_deliveries claim (type + row id) makes a repeat a no-op.
 * Everything is re-checked right before sending: the campaign still sending,
 * the store live and the seller's, the address not unsubscribed. The seller's
 * text is rendered as React text (StoreCampaignEmail), never as HTML.
 * Never logs an email address.
 */

const skipped = (reason: string): SendOnceResult => ({ status: "skipped", reason });

/** Test sends per store per rolling 24 hours (campaign and win-back together). */
const TEST_SENDS_PER_STORE_PER_DAY = 10;

type Product = { name: string; imageUrl: string | null; url: string };

async function loadCampaignProducts(sellerId: string, ids: readonly string[], store: StoreEmailContext, locale: EmailLocale): Promise<Product[]> {
  const wanted = ids.filter(isUuid).slice(0, CAMPAIGN_PRODUCTS_MAX);
  if (!wanted.length) return [];
  const rows = await db.query.products.findMany({
    where: and(
      inArray(products.id, wanted),
      eq(products.sellerId, sellerId),
      eq(products.status, "active"),
      isNull(products.deletedAt),
    ),
    columns: { id: true, sku: true, images: true },
    with: { productTranslations: { columns: { locale: true, title: true, slug: true } } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: Product[] = [];
  for (const id of wanted) {
    const p = byId.get(id);
    if (!p) continue;
    const translations = p.productTranslations ?? [];
    const name = pickProductTitle(
      translations.map((t) => ({ locale: t.locale, title: t.title ?? "" })).filter((t) => t.title),
      locale,
      p.sku,
      p.id,
    );
    const slug = translations.find((t) => t.locale === locale && t.slug)?.slug ?? translations.find((t) => t.slug)?.slug ?? null;
    out.push({
      name,
      imageUrl: resolveImageUrl(p.images),
      url: joinUrl(store.url, `${emailPathPrefix(locale)}${slug ? `/products/${encodeURIComponent(slug)}` : "/products"}`),
    });
  }
  return out;
}

async function storeIsLive(storeId: string, sellerId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(
      and(
        eq(stores.id, storeId),
        eq(stores.sellerId, sellerId),
        isNull(stores.deletedAt),
        eq(stores.status, "active"),
        eq(stores.siteStatus, "published"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

function buildEmail(params: {
  store: StoreEmailContext;
  locale: EmailLocale;
  kind: "campaign" | "winback";
  subject: string;
  body: string;
  ctaLabel: string | null;
  products: Product[];
  unsubscribeUrl: string;
  test?: boolean;
}) {
  return createElement(StoreCampaignEmail, {
    locale: params.locale,
    brand: params.store.brand,
    storeName: params.store.name,
    kind: params.kind,
    subject: params.subject,
    body: params.body,
    ctaLabel: params.ctaLabel,
    products: params.products,
    links: { shop: joinUrl(params.store.url, emailPathPrefix(params.locale) || "/"), unsubscribe: params.unsubscribeUrl },
    test: params.test ?? false,
  });
}

/** Win-back subject/body: the seller's text, or the default copy in the store's language. */
function winbackCopy(locale: EmailLocale, storeName: string, subject: string, body: string) {
  const copy = getEmailMessages(locale).winback;
  return {
    subject: subject.trim() || interpolate(copy.subject, { store: storeName }),
    body: body.trim() || interpolate(copy.body, { store: storeName }),
  };
}

/** One campaign recipient (store_email_campaign_recipients.id). */
export async function sendStoreCampaign(recipientId: string): Promise<SendOnceResult> {
  const recipient = await db.query.storeEmailCampaignRecipients.findFirst({
    where: (r, { eq: equals }) => equals(r.id, recipientId),
    with: { campaign: true },
  });
  if (!recipient || !recipient.campaign) return skipped("not_found");
  const campaign = recipient.campaign;
  if (campaign.status !== "sending") return skipped("not_sending");
  if (recipient.storeId !== campaign.storeId) return skipped("not_found");
  if (campaignSendError(campaign)) return skipped("invalid_content");
  if (!(await storeIsLive(campaign.storeId, campaign.sellerId))) return skipped("store_offline");
  if (await isStoreEmailUnsubscribed(campaign.storeId, recipient.email)) return skipped("unsubscribed");

  const locale = resolveEmailLocale(campaign.locale);
  const store = await loadStoreEmailContext(campaign.storeId, locale);
  if (!store || store.sellerId !== campaign.sellerId) return skipped("no_store");

  return sendOnce({
    emailType: EMAIL_TYPES.storeCampaign,
    referenceId: recipient.id,
    recipient: recipient.email,
    subject: campaign.subject,
    content: buildEmail({
      store,
      locale,
      kind: "campaign",
      subject: campaign.subject,
      body: campaign.body,
      ctaLabel: campaign.ctaLabel,
      products: await loadCampaignProducts(campaign.sellerId, campaign.productIds ?? [], store, locale),
      unsubscribeUrl: emailUnsubscribeUrl(store.url, recipient.unsubscribeToken),
    }),
    from: ORDERS_FROM_ADDRESS,
    fromName: store.name,
    metadata: { storeId: campaign.storeId, campaignId: campaign.id },
  });
}

/** One planned win-back email (store_winback_sends.id). */
export async function sendStoreWinback(sendId: string): Promise<SendOnceResult> {
  const row = await db.query.storeWinbackSends.findFirst({ where: (w, { eq: equals }) => equals(w.id, sendId) });
  if (!row) return skipped("not_found");
  const [storeRow] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.id, row.storeId), eq(stores.sellerId, row.sellerId)))
    .limit(1);
  if (!storeRow) return skipped("no_store");
  const settings = parseWinbackSettings(storeRow.settings);
  if (!settings.enabled) return skipped("disabled");
  if (!(await storeIsLive(row.storeId, row.sellerId))) return skipped("store_offline");
  if (await isStoreEmailUnsubscribed(row.storeId, row.email)) return skipped("unsubscribed");

  const locale = resolveEmailLocale(row.locale);
  const store = await loadStoreEmailContext(row.storeId, locale);
  if (!store || store.sellerId !== row.sellerId) return skipped("no_store");
  const copy = winbackCopy(locale, store.name, settings.subject, settings.body);

  return sendOnce({
    emailType: EMAIL_TYPES.storeWinback,
    referenceId: row.id,
    recipient: row.email,
    subject: copy.subject,
    content: buildEmail({
      store,
      locale,
      kind: "winback",
      subject: copy.subject,
      body: copy.body,
      ctaLabel: null,
      products: [],
      unsubscribeUrl: emailUnsubscribeUrl(store.url, row.unsubscribeToken),
    }),
    from: ORDERS_FROM_ADDRESS,
    fromName: store.name,
    metadata: { storeId: row.storeId, kind: "winback" },
  });
}

export type CampaignDraftInput = {
  sellerId: string;
  storeId: string;
  kind: "campaign" | "winback";
  draft: { subject: string; body: string; ctaLabel: string | null; productIds: string[]; locale: "ar" | "en" };
};

type Prepared =
  | { ok: true; store: StoreEmailContext; locale: EmailLocale; subject: string; body: string; ctaLabel: string | null; products: Product[] }
  | { ok: false; error: string };

/** The dashboard's draft, re-cleaned (links refused) and scoped to the seller's own store and products. */
async function prepareDraft(input: CampaignDraftInput): Promise<Prepared> {
  const parsed = parseCampaignInput(input.draft);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const locale = resolveEmailLocale(input.draft.locale);
  const store = await loadStoreEmailContext(input.storeId, locale);
  if (!store || store.sellerId !== input.sellerId) return { ok: false, error: "not_found" };
  if (input.kind === "winback") {
    const copy = winbackCopy(locale, store.name, parsed.value.subject, parsed.value.body);
    return { ok: true, store, locale, subject: copy.subject, body: copy.body, ctaLabel: null, products: [] };
  }
  const contentError = campaignSendError(parsed.value);
  if (contentError) return { ok: false, error: contentError };
  return {
    ok: true,
    store,
    locale,
    subject: parsed.value.subject,
    body: parsed.value.body,
    ctaLabel: parsed.value.ctaLabel,
    products: await loadCampaignProducts(input.sellerId, parsed.value.productIds, store, locale),
  };
}

/** The email as customers would see it (the unsubscribe link is a dummy). */
export async function renderStoreCampaignPreview(input: CampaignDraftInput): Promise<{ ok: true; subject: string; html: string } | { ok: false; error: string }> {
  const prepared = await prepareDraft(input);
  if (!prepared.ok) return prepared;
  const html = await render(
    buildEmail({ ...prepared, kind: input.kind, unsubscribeUrl: emailUnsubscribeUrl(prepared.store.url, "0".repeat(32)) }),
  );
  return { ok: true, subject: prepared.subject, html };
}

/**
 * A test send to the seller's own account email (looked up here; the browser
 * never picks it), at most TEST_SENDS_PER_STORE_PER_DAY per store. Logged in
 * email_deliveries (fresh reference id) so the daily count can be read back.
 */
export async function sendStoreCampaignTest(input: CampaignDraftInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const prepared = await prepareDraft(input);
  if (!prepared.ok) return prepared;
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, input.sellerId)).limit(1);
  const to = user?.email?.trim().toLowerCase();
  if (!to || to.endsWith("@temp.local")) return { ok: false, error: "no_email" };

  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(emailDeliveries)
    .where(
      and(
        eq(emailDeliveries.emailType, EMAIL_TYPES.storeCampaignTest),
        sql`${emailDeliveries.metadata} ->> 'storeId' = ${input.storeId}`,
        gt(emailDeliveries.createdAt, sql`now() - interval '24 hours'`),
      ),
    );
  if ((count?.n ?? 0) >= TEST_SENDS_PER_STORE_PER_DAY) return { ok: false, error: "test_limit" };

  const subject = interpolate(getEmailMessages(prepared.locale).storeCampaign.testSubject, { subject: prepared.subject });
  const content = buildEmail({
    ...prepared,
    kind: input.kind,
    test: true,
    unsubscribeUrl: emailUnsubscribeUrl(prepared.store.url, "0".repeat(32)),
  });
  const referenceId = randomUUID();
  const result = await sendOnce({
    emailType: EMAIL_TYPES.storeCampaignTest,
    referenceId,
    recipient: to,
    subject,
    content,
    from: ORDERS_FROM_ADDRESS,
    fromName: prepared.store.name,
    metadata: { storeId: input.storeId, kind: input.kind },
  });
  return result.status === "sent" ? { ok: true } : { ok: false, error: "send_failed" };
}
