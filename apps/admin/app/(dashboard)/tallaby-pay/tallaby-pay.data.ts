// Read-only, for the Server Component pages; deliberately not "use server".
import { logServerError } from "@workspace/db/log";
import {
  getTallabyPayAdminOverview,
  getTallabyPayQueueCounts,
  getTallabyPayRefundQueue,
  getTallabyPaySettings,
  listTallabyPayAdminSales,
  listTallabyPayAdminWallets,
  listTallabyPayKyc,
  listTallabyPayPayoutHistory,
  listTallabyPayPayoutQueue,
} from "@workspace/lib/tallaby-pay/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

/**
 * Admin › Tallaby Pay reads (ROADMAP.md F-100g). Money data: never cached
 * (rule 8). Each loader checks the admin's permission first and returns
 * `{ error }` instead of throwing, so a page can say what went wrong (most
 * often: 0175 is not applied on this database yet).
 */

type Loaded<T> = { data: T; error: null } | { data: null; error: "forbidden" | "failed" };

type Permission = Parameters<typeof validateAdminAccess>[0];

async function load<T>(label: string, read: () => Promise<T>, permission: Permission = "canManageUsers"): Promise<Loaded<T>> {
  try {
    await validateAdminAccess(permission);
  } catch {
    return { data: null, error: "forbidden" };
  }
  try {
    return { data: await read(), error: null };
  } catch (error) {
    logServerError("admin", `tallaby pay ${label} load failed`, {}, error);
    return { data: null, error: "failed" };
  }
}

export const loadTallabyPayOverview = (range: Parameters<typeof getTallabyPayAdminOverview>[0]) =>
  load("overview", () => getTallabyPayAdminOverview(range));

export const loadTallabyPaySales = (args: Parameters<typeof listTallabyPayAdminSales>[0]) =>
  load("sales", () => listTallabyPayAdminSales(args));

export const loadTallabyPayPayouts = (historyPage: number) =>
  load("payouts", async () => {
    // One after another: the serverless DB pool is small.
    const queue = await listTallabyPayPayoutQueue();
    const history = await listTallabyPayPayoutHistory(historyPage);
    return { queue, history };
  });

export const loadTallabyPayRefunds = () => load("refunds", () => getTallabyPayRefundQueue());

export const loadTallabyPayKyc = (view: "submitted" | "reviewed") => load("kyc", () => listTallabyPayKyc(view));

export const loadTallabyPayWallets = (args: Parameters<typeof listTallabyPayAdminWallets>[0]) =>
  load("wallets", () => listTallabyPayAdminWallets(args));

export const loadTallabyPaySettings = () => load("settings", () => getTallabyPaySettings(), "canManageSettings");

export const loadTallabyPayQueueCounts = () => load("queue counts", () => getTallabyPayQueueCounts());
