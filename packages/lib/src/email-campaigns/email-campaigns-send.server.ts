/**
 * Email campaigns + win-back sending (ROADMAP.md F-16a, F-16e; 0129).
 * Server-only. The cron route (apps/ecommerce/app/api/cron/email-campaigns)
 * calls `runEmailCampaignCron`; the dashboard calls the preview and test
 * helpers. The backend (apps/backend/src/routes/emails.ts) renders and sends
 * each email; its email_deliveries claim (type + recipient/send id) makes a
 * repeated call a no-op. Logs counts only, never an email address.
 */
import {
  claimCampaignRecipients,
  claimWinbackSends,
  finalizeCampaigns,
  markCampaignRecipient,
  markWinbackSend,
  planWinbackSends,
  releaseCampaignRecipient,
  releaseWinbackSend,
  startDueCampaigns,
} from "./email-campaigns.server";
import { EMAIL_CRON_BATCH, EMAIL_CRON_CONCURRENCY, EMAIL_CRON_MAX_PER_RUN } from "./email-campaigns.lib";

export type BackendSendStatus = "sent" | "duplicate" | "skipped";
type BackendResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** POST to the backend's internal email API (BACKEND_API_URL + INTERNAL_API_SECRET). */
export async function callEmailBackend<T>(path: string, body: Record<string, unknown>, timeoutMs = 30_000): Promise<BackendResult<T>> {
  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (!backendUrl || !apiSecret) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/emails/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiSecret}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `backend_${res.status}` };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "unreachable" };
  }
}

type SendResponse = { success?: boolean; result?: { status?: string } };

/** One send through the backend: its status, or null when it failed (the claim is then released). */
async function sendOne(path: string, body: Record<string, unknown>): Promise<BackendSendStatus | null> {
  const res = await callEmailBackend<SendResponse>(path, body);
  if (!res.ok) return null;
  const status = res.data.result?.status;
  return status === "sent" || status === "duplicate" || status === "skipped" ? status : null;
}

async function inParallel<T>(items: readonly T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export type EmailCronSummary = {
  campaignsStarted: number;
  winbackStores: number;
  winbackPlanned: number;
  sent: number;
  skipped: number;
  released: number;
};

/**
 * One cron run: plans today's win-back emails (when `winback`), starts due
 * campaigns, then claims and sends campaign recipients and win-back emails
 * in small batches until nothing is left, EMAIL_CRON_MAX_PER_RUN is reached
 * or `deadlineMs` passes. Finally updates campaign counts and closes the
 * finished ones. `campaignId` limits the campaign part to one campaign (the
 * dashboard's "send now" kick); win-back is then skipped.
 */
export async function runEmailCampaignCron(
  options: { deadlineMs: number; winback?: boolean; campaignId?: string | null } = { deadlineMs: 240_000 },
): Promise<EmailCronSummary> {
  const started = Date.now();
  const timeLeft = () => Date.now() - started < options.deadlineMs;
  const summary: EmailCronSummary = { campaignsStarted: 0, winbackStores: 0, winbackPlanned: 0, sent: 0, skipped: 0, released: 0 };
  const total = () => summary.sent + summary.skipped + summary.released;

  if (options.winback && !options.campaignId) {
    const plan = await planWinbackSends();
    summary.winbackStores = plan.stores;
    summary.winbackPlanned = plan.planned;
  }
  summary.campaignsStarted = await startDueCampaigns();

  const count = (status: BackendSendStatus | null) => {
    if (status === "sent" || status === "duplicate") summary.sent++;
    else if (status === "skipped") summary.skipped++;
    else summary.released++;
  };

  // Campaign recipients.
  while (timeLeft() && total() < EMAIL_CRON_MAX_PER_RUN) {
    const ids = await claimCampaignRecipients({
      limit: Math.min(EMAIL_CRON_BATCH, EMAIL_CRON_MAX_PER_RUN - total()),
      campaignId: options.campaignId,
    });
    if (!ids.length) break;
    const releasedBefore = summary.released;
    await inParallel(ids, EMAIL_CRON_CONCURRENCY, async (id) => {
      const status = await sendOne("store-campaign", { recipientId: id });
      if (status) await markCampaignRecipient(id, status === "skipped" ? "skipped" : "sent");
      else await releaseCampaignRecipient(id);
      count(status);
    });
    // A batch that failed entirely (backend down): stop and let the next run retry.
    if (summary.released - releasedBefore >= ids.length) break;
  }

  // Win-back emails.
  if (!options.campaignId) {
    while (timeLeft() && total() < EMAIL_CRON_MAX_PER_RUN) {
      const ids = await claimWinbackSends({ limit: Math.min(EMAIL_CRON_BATCH, EMAIL_CRON_MAX_PER_RUN - total()) });
      if (!ids.length) break;
      const releasedBefore = summary.released;
      await inParallel(ids, EMAIL_CRON_CONCURRENCY, async (id) => {
        const status = await sendOne("store-winback", { sendId: id });
        if (status) await markWinbackSend(id, status === "skipped" ? "skipped" : "sent");
        else await releaseWinbackSend(id);
        count(status);
      });
      if (summary.released - releasedBefore >= ids.length) break;
    }
  }

  await finalizeCampaigns();
  return summary;
}

// ---------------------------------------------------------------------------
// Dashboard helpers (the caller has already checked the store is the seller's)

export type CampaignEmailDraft = {
  subject: string;
  body: string;
  ctaLabel: string | null;
  productIds: string[];
  locale: "ar" | "en";
};

/** The email as the store's customers would see it: { subject, html }. */
export async function renderCampaignPreview(input: {
  sellerId: string;
  storeId: string;
  kind: "campaign" | "winback";
  draft: CampaignEmailDraft;
}): Promise<{ ok: true; subject: string; html: string } | { ok: false; error: string }> {
  const res = await callEmailBackend<{ subject?: string; html?: string }>("store-campaign-preview", input, 20_000);
  if (!res.ok) return res;
  if (typeof res.data.html !== "string") return { ok: false, error: "bad_response" };
  return { ok: true, subject: String(res.data.subject ?? ""), html: res.data.html };
}

/** Sends the draft to the seller's own account email (the backend looks it up; the browser never picks it). */
export async function sendCampaignTestEmail(input: {
  sellerId: string;
  storeId: string;
  kind: "campaign" | "winback";
  draft: CampaignEmailDraft;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await callEmailBackend<{ success?: boolean; error?: string }>("store-campaign-test", input);
  if (!res.ok) return res;
  if (res.data.success) return { ok: true };
  return { ok: false, error: typeof res.data.error === "string" ? res.data.error : "send_failed" };
}
