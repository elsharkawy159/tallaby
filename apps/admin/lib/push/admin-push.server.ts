import {
  adminNotifications,
  adminPushSubscriptions,
  and,
  asc,
  db,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  sql,
  users,
} from "@workspace/db";
import { adminNotificationHref, type NotificationItem } from "@workspace/lib/notifications";
import {
  clipPushText,
  parseVapidConfig,
  safePushPath,
  type PushPayload,
  type PushSubscriptionInput,
  type VapidConfig,
} from "@workspace/lib/push";
import { sendWebPushes, type WebPushJob } from "@workspace/lib/push/server";
import { describeAdminNotification } from "@/app/(dashboard)/_components/layout/notification-bell.lib";

/**
 * Admin push alerts (ROADMAP.md F-06e, 0131): every admin bell row is pushed
 * to every browser/device an admin turned alerts on for. The table is
 * server-only; callers pass the user id from the admin session, never from the
 * client. Sending re-checks in the database that each device's owner is still
 * a verified, unsuspended admin.
 */

/** Same roles as the admin session guard (getCurrentAdminUser). */
const ADMIN_ROLES = ["admin", "super_admin", "moderator"] as const;

/** Only rows this recent are pushed; older ones are marked handled and dropped. */
const PUSH_WINDOW_MINUTES = 60;
/** The most rows one dispatcher run claims. */
const PUSH_CLAIM_LIMIT = 200;
/** One run sends at most this many notifications per device; the rest are summed up in one alert. */
const PER_DEVICE_MAX = 5;

export function getVapidConfig(): VapidConfig | null {
  return parseVapidConfig(process.env);
}

/** The public key only (safe for the browser), or null when push is off. */
export function getVapidPublicKey(): string | null {
  return getVapidConfig()?.publicKey ?? null;
}

/** Saves this device for the admin; an endpoint saved for another admin moves to this one. */
export async function saveAdminPushSubscription(
  userId: string,
  input: PushSubscriptionInput,
  userAgent: string | null,
): Promise<void> {
  const values = {
    userId,
    endpoint: input.endpoint,
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    userAgent: userAgent ? userAgent.slice(0, 300) : null,
  };
  await db
    .insert(adminPushSubscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: adminPushSubscriptions.endpoint,
      set: {
        userId: values.userId,
        p256dh: values.p256dh,
        auth: values.auth,
        userAgent: values.userAgent,
        updatedAt: sql`now()`,
      },
    });
}

/** Removes the admin's own device; another admin's endpoint matches nothing. */
export async function deleteAdminPushSubscription(userId: string, endpoint: string): Promise<void> {
  await db
    .delete(adminPushSubscriptions)
    .where(and(eq(adminPushSubscriptions.userId, userId), eq(adminPushSubscriptions.endpoint, endpoint)));
}

type AdminDevice = { id: string; endpoint: string; p256dh: string; auth: string };

/** Devices of users who are still verified, unsuspended admins (optionally one user). */
async function loadAdminDevices(userId?: string): Promise<AdminDevice[]> {
  return db
    .select({
      id: adminPushSubscriptions.id,
      endpoint: adminPushSubscriptions.endpoint,
      p256dh: adminPushSubscriptions.p256dh,
      auth: adminPushSubscriptions.auth,
    })
    .from(adminPushSubscriptions)
    .innerJoin(users, eq(users.id, adminPushSubscriptions.userId))
    .where(
      and(
        // The Drizzle enum predates super_admin/moderator; compare as text.
        inArray(sql`${users.role}::text`, [...ADMIN_ROLES]),
        eq(users.isVerified, true),
        sql`coalesce(${users.isSuspended}, false) = false`,
        userId ? eq(adminPushSubscriptions.userId, userId) : undefined,
      ),
    );
}

async function sendAll(config: VapidConfig, jobs: WebPushJob[]): Promise<{ sent: number; failed: number; removed: number }> {
  const { sent, failed, okIds, goneIds } = await sendWebPushes(config, jobs, "admin");
  if (goneIds.length > 0) {
    await db.delete(adminPushSubscriptions).where(inArray(adminPushSubscriptions.id, goneIds));
  }
  if (okIds.length > 0) {
    await db
      .update(adminPushSubscriptions)
      .set({ lastSuccessAt: sql`now()` })
      .where(inArray(adminPushSubscriptions.id, okIds));
  }
  return { sent, failed, removed: goneIds.length };
}

type ClaimedRow = Pick<NotificationItem, "id" | "type" | "data" | "sellerId" | "storeId" | "createdAt">;

/** Expires (marks handled) unpushed rows older than the window, then claims the recent ones. */
async function claimPendingRows(limit: number): Promise<{ expired: number; rows: ClaimedRow[] }> {
  const windowStart = sql`now() - make_interval(mins => ${PUSH_WINDOW_MINUTES})`;
  const expired = await db
    .update(adminNotifications)
    .set({ pushedAt: sql`now()` })
    .where(and(isNull(adminNotifications.pushedAt), lt(adminNotifications.createdAt, windowStart)))
    .returning({ id: adminNotifications.id });

  // FOR UPDATE SKIP LOCKED + the outer `pushed_at IS NULL` re-check: two runs
  // at once (cron + webhook) split the rows, never both send one.
  const pending = db
    .select({ id: adminNotifications.id })
    .from(adminNotifications)
    .where(and(isNull(adminNotifications.pushedAt), gte(adminNotifications.createdAt, windowStart)))
    .orderBy(asc(adminNotifications.createdAt))
    .limit(limit)
    .for("update", { skipLocked: true });

  const claimed = await db
    .update(adminNotifications)
    .set({ pushedAt: sql`now()` })
    .where(and(isNull(adminNotifications.pushedAt), inArray(adminNotifications.id, pending)))
    .returning({
      id: adminNotifications.id,
      type: adminNotifications.type,
      data: adminNotifications.data,
      sellerId: adminNotifications.sellerId,
      storeId: adminNotifications.storeId,
      createdAt: adminNotifications.createdAt,
    });

  return {
    expired: expired.length,
    rows: claimed
      .map((row) => ({ ...row, data: row.data ?? {} }))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
  };
}

/** One admin bell row → push text (the bell's own English copy and link). */
export function adminPushPayload(row: Pick<ClaimedRow, "id" | "type" | "data" | "sellerId" | "storeId">): PushPayload {
  const { title, body } = describeAdminNotification(row);
  return {
    title: clipPushText(title, 80),
    body: clipPushText(body, 180),
    url: safePushPath(adminNotificationHref(row)),
    tag: `tallaby-admin-${row.id}`,
    lang: "en",
    dir: "ltr",
  };
}

export type AdminPushDispatchResult = {
  enabled: boolean;
  expired: number;
  claimed: number;
  deliveries: number;
  sent: number;
  failed: number;
  removed: number;
};

/**
 * One dispatcher run (Supabase webhook on admin_notifications INSERT, or the
 * cron): claims the recent unpushed rows and sends them to every admin
 * device. A burst (e.g. a bulk import) sends the newest few and one summary
 * alert, never dozens. At most once per row; a no-op without VAPID keys.
 */
export async function dispatchAdminPushes(limit: number = PUSH_CLAIM_LIMIT): Promise<AdminPushDispatchResult> {
  const config = getVapidConfig();
  const empty = { expired: 0, claimed: 0, deliveries: 0, sent: 0, failed: 0, removed: 0 };
  if (!config) return { enabled: false, ...empty };

  const { expired, rows } = await claimPendingRows(limit);
  if (rows.length === 0) return { enabled: true, ...empty, expired };

  const devices = await loadAdminDevices();
  if (devices.length === 0) return { enabled: true, ...empty, expired, claimed: rows.length };

  const shown = rows.slice(-PER_DEVICE_MAX);
  const payloads: PushPayload[] = shown.map(adminPushPayload);
  const skipped = rows.length - shown.length;
  if (skipped > 0) {
    payloads.unshift({
      title: `${skipped} more notification${skipped === 1 ? "" : "s"}`,
      body: "Open the admin bell to see everything that happened.",
      url: "/",
      tag: "tallaby-admin-summary",
      lang: "en",
      dir: "ltr",
    });
  }

  const jobs: WebPushJob[] = devices.flatMap((device) =>
    payloads.map((payload) => ({ ...device, payload, urgent: payload.tag !== "tallaby-admin-summary" })),
  );
  const result = await sendAll(config, jobs);
  return { enabled: true, expired, claimed: rows.length, deliveries: jobs.length, ...result };
}

/** A test alert to the admin's own devices. */
export async function sendAdminTestPush(userId: string): Promise<{ sent: number; devices: number }> {
  const config = getVapidConfig();
  if (!config) return { sent: 0, devices: 0 };
  const devices = await loadAdminDevices(userId);
  const payload: PushPayload = {
    title: "Tallaby Admin alerts are on",
    body: "You'll get an alert like this for every new admin notification.",
    url: "/",
    tag: "tallaby-admin-test",
    lang: "en",
    dir: "ltr",
  };
  const result = devices.length
    ? await sendAll(config, devices.map((device) => ({ ...device, payload, urgent: false })))
    : { sent: 0 };
  return { sent: result.sent, devices: devices.length };
}
