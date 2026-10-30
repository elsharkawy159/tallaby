"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, db, eq, isNull, stores } from "@workspace/db";
import {
  campaignLocale,
  emailCampaignLimits,
  parseCampaignAudience,
  parseCampaignInput,
  parseScheduledAt,
  parseWinbackInput,
  clampInactiveDays,
  type CampaignContent,
} from "@workspace/lib/email-campaigns";
import {
  cancelCampaign,
  claimCampaignTestSend,
  createCampaignDraft,
  deleteCampaignDraft,
  getStoreCampaign,
  previewCampaignAudience,
  queueCampaign,
  releaseCampaignTestSend,
  saveCampaignDraft,
  saveStoreWinback,
  type AudiencePreview,
} from "@workspace/lib/email-campaigns/server";
import { renderCampaignPreview, runEmailCampaignCron, sendCampaignTestEmail } from "@workspace/lib/email-campaigns/send";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import type { CampaignActionError, CampaignActionResult } from "./email-campaigns.types";

/**
 * Marketing › Email campaigns actions (ROADMAP.md F-16a, F-16e; 0129). Every
 * action takes an explicit storeId, re-checked against the session's seller
 * (requireStore); the lib queries are scoped by that seller and store again,
 * so a campaign id from the browser only picks rows inside that store. Test
 * emails go to the seller's own account email (looked up by the backend).
 * Never cached; never logs an email address.
 */

const PATH = "/marketing/emails";

const fail = (error: CampaignActionError): { success: false; error: CampaignActionError } => ({ success: false, error });

const failure = (error: unknown, label: string): { success: false; error: CampaignActionError } => {
  if (isAccessError(error)) return fail(error.code === "store_read_only" ? "readOnly" : "notFound");
  console.error(`[email-campaigns] ${label} failed`);
  return fail("generic");
};

const backendError = (code: string): CampaignActionError => {
  if (code === "not_configured" || code === "unreachable") return "notConfigured";
  if (code === "test_limit") return "testLimit";
  if (code === "no_email") return "noEmail";
  if (["subjectLink", "bodyLink", "ctaLink", "subjectRequired", "bodyRequired"].includes(code)) return code as CampaignActionError;
  return "sendFailed";
};

async function storeLocale(sellerId: string, storeId: string): Promise<"ar" | "en"> {
  const [row] = await db
    .select({ defaultLocale: stores.defaultLocale })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  return campaignLocale(row?.defaultLocale);
}

function parseContent(input: unknown): { ok: true; value: CampaignContent } | { ok: false; error: CampaignActionError } {
  const parsed = parseCampaignInput(input);
  return parsed.ok ? parsed : { ok: false, error: parsed.error };
}

export async function createCampaign(input: { storeId: string }): Promise<CampaignActionResult<{ id: string }>> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const id = await createCampaignDraft(seller.sellerId, store.id, seller.userId);
    if (!id) return fail("notFound");
    revalidatePath(PATH);
    return { success: true, data: { id } };
  } catch (error) {
    return failure(error, "create");
  }
}

export async function saveCampaign(input: { storeId: string; campaignId: string; content: unknown }): Promise<CampaignActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const content = parseContent(input?.content);
    if (!content.ok) return fail(content.error);
    const saved = await saveCampaignDraft(seller.sellerId, store.id, String(input?.campaignId ?? ""), content.value);
    if (!saved) return fail("notDraft");
    revalidatePath(PATH);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "save");
  }
}

export async function deleteCampaign(input: { storeId: string; campaignId: string }): Promise<CampaignActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const ok = await deleteCampaignDraft(seller.sellerId, store.id, String(input?.campaignId ?? ""));
    if (!ok) return fail("notDraft");
    revalidatePath(PATH);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "delete");
  }
}

/** Recipient count for the composer's audience picker. */
export async function previewAudience(input: {
  storeId: string;
  audience: string;
  inactiveDays?: number | null;
}): Promise<CampaignActionResult<AudiencePreview>> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""));
    const audience = parseCampaignAudience(input?.audience);
    const preview = await previewCampaignAudience(seller.sellerId, store.id, audience, {
      inactiveDays: audience === "inactive" ? clampInactiveDays(input?.inactiveDays) : null,
      plan: seller.plan,
    });
    return { success: true, data: preview };
  } catch (error) {
    return failure(error, "audience");
  }
}

/**
 * Saves the draft, then queues it: now (and starts a send run for this
 * campaign right after the response) or at `scheduledAt` (the daily cron).
 */
export async function sendCampaign(input: {
  storeId: string;
  campaignId: string;
  content: unknown;
  scheduledAt?: string | null;
}): Promise<CampaignActionResult<{ recipients: number; scheduled: boolean }>> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const campaignId = String(input?.campaignId ?? "");
    const content = parseContent(input?.content);
    if (!content.ok) return fail(content.error);
    const scheduledAt = parseScheduledAt(input?.scheduledAt ?? null, new Date());
    if (scheduledAt === "invalid") return fail("scheduleInvalid");

    if (!(await saveCampaignDraft(seller.sellerId, store.id, campaignId, content.value))) return fail("notDraft");
    const result = await queueCampaign(seller.sellerId, store.id, campaignId, { plan: seller.plan, scheduledAt });
    if (!result.ok) return fail(result.error);

    if (!scheduledAt) {
      // Send right away in the background; the daily cron picks up anything left.
      after(async () => {
        try {
          await runEmailCampaignCron({ deadlineMs: 240_000, campaignId });
        } catch {
          console.error("[email-campaigns] send-now run failed");
        }
      });
    }
    revalidatePath(PATH);
    return { success: true, data: { recipients: result.recipients, scheduled: Boolean(scheduledAt) } };
  } catch (error) {
    return failure(error, "send");
  }
}

export async function cancelCampaignAction(input: { storeId: string; campaignId: string }): Promise<CampaignActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const ok = await cancelCampaign(seller.sellerId, store.id, String(input?.campaignId ?? ""));
    if (!ok) return fail("notFound");
    revalidatePath(PATH);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "cancel");
  }
}

/** Sends the composer's current content to the seller's own email (per-campaign and per-store caps). */
export async function sendCampaignTest(input: { storeId: string; campaignId: string; content: unknown }): Promise<CampaignActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const campaignId = String(input?.campaignId ?? "");
    const content = parseContent(input?.content);
    if (!content.ok) return fail(content.error);
    const campaign = await getStoreCampaign(seller.sellerId, store.id, campaignId);
    if (!campaign) return fail("notFound");
    const limits = emailCampaignLimits(seller.plan);
    if (!(await claimCampaignTestSend(seller.sellerId, store.id, campaignId, limits.testSendsPerCampaign))) {
      return fail("testLimit");
    }
    const res = await sendCampaignTestEmail({
      sellerId: seller.sellerId,
      storeId: store.id,
      kind: "campaign",
      draft: { ...content.value, locale: campaign.locale },
    });
    if (!res.ok) {
      await releaseCampaignTestSend(seller.sellerId, campaignId);
      return fail(backendError(res.error));
    }
    revalidatePath(PATH);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "test");
  }
}

/** The email exactly as customers would get it (HTML from the backend, shown in a sandboxed frame). */
export async function previewCampaignEmail(input: {
  storeId: string;
  kind: "campaign" | "winback";
  content: unknown;
}): Promise<CampaignActionResult<{ subject: string; html: string }>> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""));
    const kind = input?.kind === "winback" ? "winback" : "campaign";
    const content = parseContent(input?.content);
    if (!content.ok) return fail(content.error);
    const res = await renderCampaignPreview({
      sellerId: seller.sellerId,
      storeId: store.id,
      kind,
      draft: { ...content.value, ctaLabel: kind === "winback" ? null : content.value.ctaLabel, locale: await storeLocale(seller.sellerId, store.id) },
    });
    if (!res.ok) return fail(backendError(res.error));
    return { success: true, data: { subject: res.subject, html: res.html } };
  } catch (error) {
    return failure(error, "preview");
  }
}

export async function saveWinback(input: { storeId: string; settings: unknown }): Promise<CampaignActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const parsed = parseWinbackInput(input?.settings);
    if (!parsed.ok) return fail(parsed.error);
    if (!(await saveStoreWinback(seller.sellerId, store.id, parsed.value))) return fail("notFound");
    revalidatePath(PATH);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "winback");
  }
}

export async function sendWinbackTest(input: { storeId: string; settings: unknown }): Promise<CampaignActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const parsed = parseWinbackInput(input?.settings);
    if (!parsed.ok) return fail(parsed.error);
    const res = await sendCampaignTestEmail({
      sellerId: seller.sellerId,
      storeId: store.id,
      kind: "winback",
      draft: {
        subject: parsed.value.subject,
        body: parsed.value.body,
        ctaLabel: null,
        productIds: [],
        locale: await storeLocale(seller.sellerId, store.id),
      },
    });
    if (!res.ok) return fail(backendError(res.error));
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "winback test");
  }
}
