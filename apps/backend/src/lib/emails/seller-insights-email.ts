import { createElement } from "react";
import { db } from "@workspace/db";
import { readFeeOnDeliverySwitch } from "@workspace/db/wallet";
import {
  SellerStoreOfflineEmail,
  SellerWeeklyInsightsEmail,
  sellerStoreOfflineSubject,
  sellerWeeklyInsightsSubject,
  type WeeklyInsightsStore,
} from "@workspace/emails";
import { isStoreViewsConfigured, runGa4Report } from "@workspace/lib/analytics/ga4";
import { STORE_ID_DIMENSION } from "@workspace/lib/analytics/store-views";
import { FREE_ORDER_FEE_USD_CENTS, TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { readOrderLockStrict } from "@workspace/lib/billing/order-lock";
import {
  STORE_OFFLINE_DAILY_CAP,
  STORE_OFFLINE_RUN_CAP,
  WEEKLY_INSIGHTS_DAILY_CAP,
  WEEKLY_INSIGHTS_RUN_CAP,
  addCalendarDays,
  isStoreOfflineEmailDue,
  latestFinishedWeek,
  parseStoreSessionsReport,
  sendBudget,
  signSellerEmailOptOutToken,
  weeklyInsightsReferenceId,
  type InsightsWeek,
  type StoreSessions,
} from "@workspace/lib/emails/seller-insights";
import {
  emailsSentToday,
  isSellerEmailOptOutsReady,
  loadInsightsStores,
  loadStoreOfflineCandidates,
  loadWeeklyInsightsCandidates,
  loadWeeklyStoreStats,
  sellerEmailOptOutKey,
  type InsightsStore,
} from "@workspace/lib/emails/seller-insights/server";
import { EMAIL_TYPES } from "../email-delivery";
import { DASHBOARD_URL, joinUrl } from "./format";
import { sendOnce, type SendOnceResult } from "./send-once";

/**
 * The F-113 seller emails (owner, 2026-11-26), one bounded batch per hourly
 * cron run: first the store-offline email, then the weekly insights. Arabic
 * only. Each delivery is claimed once in `email_deliveries` (sendOnce). Logs and
 * the returned summary carry counts only, never emails or names.
 */

/** Where Publish sends a seller whose stores are offline for billing (TOP_UP_TO_GO_ONLINE_HREF). */
const WALLET_PATH = "/wallet?topup=1&notice=store-offline";

const usd = (cents: number) => `$${Number.isInteger(cents / 100) ? cents / 100 : (cents / 100).toFixed(2)}`;

type Counts = { sent: number; failed: number; skipped: number };

function tally(results: PromiseSettledResult<SendOnceResult | "skipped">[]): Counts {
  const sent = results.filter((r) => r.status === "fulfilled" && r.value !== "skipped" && r.value.status === "sent").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed, skipped: results.length - sent - failed };
}

async function sendStoreOfflineEmails(): Promise<Counts> {
  const emailType = EMAIL_TYPES.sellerStoreOffline;
  const budget = sendBudget(STORE_OFFLINE_DAILY_CAP, STORE_OFFLINE_RUN_CAP, await emailsSentToday(emailType));
  const candidates = await loadStoreOfflineCandidates(budget);
  if (candidates.length === 0) return { sent: 0, failed: 0, skipped: 0 };
  const feeOnDelivery = (await readFeeOnDeliverySwitch(db)).on;

  const results = await Promise.allSettled(
    candidates.map(async (candidate): Promise<SendOnceResult | "skipped"> => {
      // Strict: a failed read rejects (skipped this run), it never reads as "online".
      const lock = await readOrderLockStrict(candidate.sellerId);
      if (!isStoreOfflineEmailDue(lock)) return "skipped";
      return sendOnce({
        emailType,
        referenceId: candidate.sellerId,
        recipient: candidate.email,
        subject: sellerStoreOfflineSubject("ar"),
        content: createElement(SellerStoreOfflineEmail, {
          locale: "ar",
          storeName: candidate.storeName,
          storeCount: candidate.storeCount,
          walletUrl: joinUrl(DASHBOARD_URL, WALLET_PATH),
          orderFee: usd(FREE_ORDER_FEE_USD_CENTS),
          minTopUp: usd(TOP_UP_MIN_USD_CENTS),
          feeOnDelivery,
        }),
        metadata: { offlineAt: lock.grace?.offlineAt ?? null },
      });
    }),
  );
  return tally(results);
}

/** Sessions per store for the week (and the week before) in one GA4 report; null when GA4 isn't set up or fails. */
async function loadSessions(stores: InsightsStore[], week: InsightsWeek): Promise<Map<string, StoreSessions> | null> {
  if (!isStoreViewsConfigured() || stores.length === 0) return null;
  const hasPrevious = week.previousStart !== null;
  try {
    const report = await runGa4Report(
      {
        dateRanges: [
          { startDate: week.start, endDate: week.lastDay, name: "current" },
          ...(week.previousStart ? [{ startDate: week.previousStart, endDate: addCalendarDays(week.start, -1), name: "previous" }] : []),
        ],
        dimensions: [{ name: STORE_ID_DIMENSION }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: STORE_ID_DIMENSION,
            inListFilter: { values: stores.map((store) => store.id), caseSensitive: true },
          },
        },
        limit: 100,
      },
      AbortSignal.timeout(12_000),
    );
    return parseStoreSessionsReport(report, { storeIds: stores.map((store) => store.id), storeDimension: STORE_ID_DIMENSION, hasPrevious });
  } catch {
    console.warn("[email] weekly insights visit data unavailable");
    return null;
  }
}

async function sendWeeklyInsightsEmails(): Promise<Counts | { status: "migration_missing" } | { status: "not_configured" }> {
  if (!(await isSellerEmailOptOutsReady())) return { status: "migration_missing" };
  const key = sellerEmailOptOutKey();
  if (!key) return { status: "not_configured" };

  const emailType = EMAIL_TYPES.sellerWeeklyInsights;
  const budget = sendBudget(WEEKLY_INSIGHTS_DAILY_CAP, WEEKLY_INSIGHTS_RUN_CAP, await emailsSentToday(emailType));
  const candidates = await loadWeeklyInsightsCandidates(budget);

  const results = await Promise.allSettled(
    candidates.map(async (candidate): Promise<SendOnceResult | "skipped"> => {
      const week = latestFinishedWeek(candidate.signedUpAt);
      // The SQL and the code must agree on the week (a run across Cairo midnight can disagree): skip, next run sends.
      if (!week || week.start !== candidate.weekStart) return "skipped";
      const stores = await loadInsightsStores(candidate.sellerId);
      if (stores.length === 0) return "skipped";
      const [stats, sessions] = await Promise.all([loadWeeklyStoreStats(candidate.sellerId, stores, week), loadSessions(stores, week)]);

      const storeRows: WeeklyInsightsStore[] = stores.map((store) => {
        const s = stats.get(store.id);
        return {
          name: store.name,
          analyticsUrl: joinUrl(DASHBOARD_URL, `/stores/${store.id}/analytics`),
          currency: store.currency,
          visits: sessions ? (sessions.get(store.id) ?? null) : null,
          orders: s?.orders ?? { current: 0, previous: week.previousStart ? 0 : null },
          sales: s?.sales ?? { current: 0, previous: week.previousStart ? 0 : null },
          topProducts: s?.topProducts ?? [],
        };
      });

      const token = signSellerEmailOptOutToken(candidate.sellerId, "weekly_insights", key);
      const optOutUrl = joinUrl(DASHBOARD_URL, `/api/email/weekly-insights/unsubscribe?token=${encodeURIComponent(token)}`);
      return sendOnce({
        emailType,
        referenceId: weeklyInsightsReferenceId(candidate.sellerId, week.start),
        recipient: candidate.email,
        subject: sellerWeeklyInsightsSubject("ar"),
        content: createElement(SellerWeeklyInsightsEmail, {
          locale: "ar",
          weekStart: week.start,
          weekLastDay: week.lastDay,
          firstWeek: week.previousStart === null,
          stores: storeRows,
          optOutUrl,
        }),
        headers: {
          "List-Unsubscribe": `<${optOutUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        metadata: { sellerId: candidate.sellerId, weekStart: week.start, week: week.index, stores: stores.length },
      });
    }),
  );
  return tally(results);
}

/**
 * One hourly run. The offline email goes first; a failure of one kind doesn't
 * stop the other. Returns counts per kind (or why the weekly kind didn't run).
 */
export async function sendSellerInsightsEmails() {
  let offline: Counts | { error: true };
  try {
    offline = await sendStoreOfflineEmails();
  } catch {
    console.error("[email] store-offline batch failed");
    offline = { error: true };
  }
  let weekly: Awaited<ReturnType<typeof sendWeeklyInsightsEmails>> | { error: true };
  try {
    weekly = await sendWeeklyInsightsEmails();
  } catch {
    console.error("[email] weekly insights batch failed");
    weekly = { error: true };
  }
  if ("error" in offline && "error" in weekly) throw new Error("seller insights batch failed");
  return { offline, weekly };
}
