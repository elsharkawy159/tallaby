import { createHash } from "node:crypto";
import { checkDailyCap, logAiUsage, modelIdForTier } from "@workspace/ai";
import { aiUsageLogs, and, count, db, desc, eq, gte, inArray, ne, sql, storeBuildClaims, storeBuildItems, storeBuilds } from "@workspace/db";
import { claimAiCredit, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { BUILDER_DAILY_CAPS, BUILDER_LIMITS, parseBuilderState, type BuilderErrorCode, type BuilderFeature, type BuilderState, type BuilderStatus } from "./builder.dto";
import { canSpend, platformBudgetMicroUsd, type BuildItem } from "./builder.lib";

/**
 * The AI Store Builder's saved state and its limits (ROADMAP.md F-54). Server
 * only. Every function takes the session's seller and filters by it: a build id
 * from the client finds nothing unless it is this seller's.
 */

export type BuildRow = {
  id: string;
  sellerId: string;
  storeId: string | null;
  status: BuilderStatus;
  free: boolean;
  state: BuilderState;
  chatTurns: number;
  siteCopyRuns: number;
  stopReason: string | null;
  createdAt: string;
};

const toRow = (row: typeof storeBuilds.$inferSelect): BuildRow => ({
  id: row.id,
  sellerId: row.sellerId,
  storeId: row.storeId,
  status: row.status as BuilderStatus,
  free: row.free,
  state: parseBuilderState(row.state),
  chatTurns: row.chatTurns,
  siteCopyRuns: row.siteCopyRuns,
  stopReason: row.stopReason,
  createdAt: row.createdAt,
});

const OPEN = ["collecting", "building"];

/** The conversation or build the seller left open. */
export async function loadOpenBuild(sellerId: string): Promise<BuildRow | null> {
  const [row] = await db
    .select()
    .from(storeBuilds)
    .where(and(eq(storeBuilds.sellerId, sellerId), inArray(storeBuilds.status, OPEN)))
    .limit(1);
  return row ? toRow(row) : null;
}

/** The seller's latest build that isn't abandoned, for the page: open, or finished and in review. */
export async function loadLatestBuild(sellerId: string): Promise<BuildRow | null> {
  const [row] = await db
    .select()
    .from(storeBuilds)
    .where(and(eq(storeBuilds.sellerId, sellerId), ne(storeBuilds.status, "abandoned")))
    .orderBy(desc(storeBuilds.createdAt))
    .limit(1);
  return row ? toRow(row) : null;
}

export async function loadBuild(sellerId: string, buildId: string): Promise<BuildRow | null> {
  const [row] = await db
    .select()
    .from(storeBuilds)
    .where(and(eq(storeBuilds.id, buildId), eq(storeBuilds.sellerId, sellerId)))
    .limit(1);
  return row ? toRow(row) : null;
}

export async function hasFreeClaim(sellerId: string): Promise<boolean> {
  const [row] = await db.select({ id: storeBuildClaims.sellerId }).from(storeBuildClaims).where(eq(storeBuildClaims.sellerId, sellerId)).limit(1);
  return Boolean(row);
}

/** True when the account's claim sits on an abandoned conversation: restart refuses a build that began, so it made nothing. */
async function restartedClaim(sellerId: string): Promise<boolean> {
  const [row] = await db
    .select({ status: storeBuilds.status })
    .from(storeBuildClaims)
    .innerJoin(storeBuilds, eq(storeBuilds.id, storeBuildClaims.buildId))
    .where(eq(storeBuildClaims.sellerId, sellerId))
    .limit(1);
  return row?.status === "abandoned";
}

export type StartBuild = { ok: true; build: BuildRow } | { ok: false; error: BuilderErrorCode };

/**
 * Opens a conversation, or returns the one already open. A seller who has used
 * the free build runs on credits, so it can't start until credits are on.
 */
export async function startBuild(sellerId: string, initial: (state: BuilderState) => BuilderState): Promise<StartBuild> {
  const open = await loadOpenBuild(sellerId);
  if (open) return { ok: true, build: open };

  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const [today] = await db
    .select({ value: count() })
    .from(storeBuilds)
    .where(and(eq(storeBuilds.sellerId, sellerId), gte(storeBuilds.createdAt, since)));
  if ((today?.value ?? 0) >= BUILDER_LIMITS.buildsPerDay) return { ok: false, error: "tooManyBuilds" };

  // A free build the seller restarted before it began stays theirs: it moves to the new conversation.
  const carried = await restartedClaim(sellerId);
  const paid = !carried && (await hasFreeClaim(sellerId));
  if (paid) {
    const billing = await getBillingState().catch(() => null);
    if (!billing?.usdLive) return { ok: false, error: "creditsNotLive" };
  }

  const state = initial(parseBuilderState({ paid }));
  const [created] = await db.insert(storeBuilds).values({ sellerId, state, free: carried }).onConflictDoNothing().returning();
  if (created) {
    if (carried) await db.update(storeBuildClaims).set({ buildId: created.id }).where(eq(storeBuildClaims.sellerId, sellerId));
    return { ok: true, build: toRow(created) };
  }
  // A second tab opened it at the same moment.
  const raced = await loadOpenBuild(sellerId);
  return raced ? { ok: true, build: raced } : { ok: false, error: "failed" };
}

export async function saveBuild(
  sellerId: string,
  buildId: string,
  patch: Partial<Pick<BuildRow, "state" | "status" | "chatTurns" | "siteCopyRuns" | "stopReason" | "storeId" | "free">>,
): Promise<void> {
  await db
    .update(storeBuilds)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(and(eq(storeBuilds.id, buildId), eq(storeBuilds.sellerId, sellerId)));
}

/** Leaves the conversation. A claim taken already stays taken, so this can't win a second free build. */
export async function abandonBuild(sellerId: string, buildId: string): Promise<void> {
  await db
    .update(storeBuilds)
    .set({ status: "abandoned", updatedAt: sql`now()` })
    .where(and(eq(storeBuilds.id, buildId), eq(storeBuilds.sellerId, sellerId), inArray(storeBuilds.status, OPEN)));
}

// ── Lease ───────────────────────────────────────────────────────────────────

const LEASE_MS = 90_000;

/** One build step at a time per build, whatever the number of tabs. */
export async function acquireLease(sellerId: string, buildId: string): Promise<boolean> {
  const taken = await db
    .update(storeBuilds)
    .set({ lockUntil: new Date(Date.now() + LEASE_MS).toISOString() })
    .where(sql`${storeBuilds.id} = ${buildId} AND ${storeBuilds.sellerId} = ${sellerId} AND (${storeBuilds.lockUntil} IS NULL OR ${storeBuilds.lockUntil} < now())`)
    .returning({ id: storeBuilds.id });
  return taken.length > 0;
}

export async function releaseLease(sellerId: string, buildId: string): Promise<void> {
  await db
    .update(storeBuilds)
    .set({ lockUntil: null })
    .where(and(eq(storeBuilds.id, buildId), eq(storeBuilds.sellerId, sellerId)));
}

// ── Items ───────────────────────────────────────────────────────────────────

export async function loadItems(buildId: string): Promise<Map<string, BuildItem>> {
  const rows = await db.select().from(storeBuildItems).where(eq(storeBuildItems.buildId, buildId));
  return new Map(
    rows.map((row) => [
      row.key,
      {
        key: row.key,
        status: row.status as BuildItem["status"],
        attempts: row.attempts,
        data: (row.data ?? {}) as Record<string, unknown>,
        productId: row.productId,
      },
    ]),
  );
}

export async function saveItem(buildId: string, item: BuildItem): Promise<void> {
  const values = { status: item.status, attempts: item.attempts, data: item.data, productId: item.productId };
  await db
    .insert(storeBuildItems)
    .values({ buildId, key: item.key, ...values })
    .onConflictDoUpdate({ target: [storeBuildItems.buildId, storeBuildItems.key], set: { ...values, updatedAt: sql`now()` } });
}

// ── Spend ───────────────────────────────────────────────────────────────────

// Written out, so the planner can use the partial index from 0141.
const BUILDER_ROWS = sql`${aiUsageLogs.feature} LIKE 'store_builder_%'`;

/** Spent on this build: one open build per seller makes "since it started" exact. */
export async function buildSpendMicroUsd(sellerId: string, since: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<string>`coalesce(sum(${aiUsageLogs.costMicroUsd}), 0)` })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.sellerId, sellerId), BUILDER_ROWS, gte(aiUsageLogs.createdAt, since)));
  return Number(row?.value ?? 0);
}

async function platformSpendTodayMicroUsd(now = new Date()): Promise<number> {
  const since = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
  const [row] = await db
    .select({ value: sql<string>`coalesce(sum(${aiUsageLogs.costMicroUsd}), 0)` })
    .from(aiUsageLogs)
    .where(and(BUILDER_ROWS, gte(aiUsageLogs.createdAt, since)));
  return Number(row?.value ?? 0);
}

export type ModelGate = { ok: true; creditReference: string | null } | { ok: false; reason: "budget" | "dailyLimit" | "noCredits" | "failed" };

/**
 * May this build make one more model call? Hard stop first, then the daily
 * cap, then a credit on a paid build (chat turns are free, capped). Fails closed:
 * if a check can't run, the call doesn't either.
 */
export async function checkModelCall(build: Pick<BuildRow, "sellerId" | "createdAt" | "state">, feature: BuilderFeature): Promise<ModelGate> {
  const { sellerId } = build;
  const blocked = (reason: "budget" | "dailyLimit" | "noCredits") =>
    logAiUsage({ sellerId, feature, model: modelIdForTier("fast"), status: "blocked", errorCode: reason }).then(() => ({ ok: false, reason }) as const);
  try {
    if (!canSpend(await buildSpendMicroUsd(sellerId, build.createdAt))) return blocked("budget");
    const cap = await checkDailyCap(sellerId, feature, BUILDER_DAILY_CAPS[feature]);
    if (!cap.allowed) return blocked("dailyLimit");
    if (!build.state.paid || feature === "store_builder_chat") return { ok: true, creditReference: null };
    const billing = await getBillingState();
    if (!billing.usdLive) return blocked("noCredits");
    const claim = await claimAiCredit(sellerId, feature);
    return claim.ok ? { ok: true, creditReference: claim.reference } : blocked("noCredits");
  } catch (error) {
    console.error("[ai-builder] limit check failed", error instanceof Error ? error.message : error);
    return { ok: false, reason: "failed" };
  }
}

export const giveCreditBack = async (sellerId: string, reference: string | null) => {
  if (reference) await refundAiCredit(sellerId, reference).catch(() => {});
};

// ── The free build ──────────────────────────────────────────────────────────

export const hashIp = (ip: string) => createHash("sha256").update(`tallaby-store-builder:${ip}`).digest("hex").slice(0, 32);

export type FreeClaim = "claimed" | "already" | "phoneUsed" | "ipLimit" | "platformBusy";

/**
 * Takes the account's one free build. The unique claim row is the limit (rule
 * 7): two parallel confirmations can't both win. Above the platform's daily
 * budget new free builds wait, and if the budget can't be read they wait too.
 */
export async function claimFreeBuild(input: { sellerId: string; buildId: string; phone: string | null; ip: string | null }, now = new Date()): Promise<FreeClaim> {
  let budgetOk = false;
  try {
    budgetOk = (await platformSpendTodayMicroUsd(now)) < platformBudgetMicroUsd(process.env.AI_STORE_BUILDER_DAILY_BUDGET_USD);
  } catch (error) {
    console.error("[ai-builder] platform budget check failed", error instanceof Error ? error.message : error);
  }
  if (!budgetOk) return "platformBusy";

  const ipHash = input.ip ? hashIp(input.ip) : null;
  const since = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
  return db.transaction(async (tx) => {
    // Serializes claims from one address, so the count below can't be beaten by a burst.
    if (ipHash) {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${ipHash}))`);
      const [row] = await tx
        .select({ value: count() })
        .from(storeBuildClaims)
        .where(and(eq(storeBuildClaims.ipHash, ipHash), gte(storeBuildClaims.createdAt, since)));
      if ((row?.value ?? 0) >= BUILDER_LIMITS.freeBuildsPerIpPerDay) return "ipLimit" as const;
    }
    if (input.phone) {
      const [taken] = await tx.select({ id: storeBuildClaims.sellerId }).from(storeBuildClaims).where(eq(storeBuildClaims.phoneKey, input.phone)).limit(1);
      if (taken && taken.id !== input.sellerId) return "phoneUsed" as const;
    }
    const claimed = await tx
      .insert(storeBuildClaims)
      .values({ sellerId: input.sellerId, buildId: input.buildId, phoneKey: input.phone, ipHash })
      .onConflictDoNothing()
      .returning({ id: storeBuildClaims.sellerId });
    if (!claimed.length) return "already" as const;
    await tx.update(storeBuilds).set({ free: true }).where(and(eq(storeBuilds.id, input.buildId), eq(storeBuilds.sellerId, input.sellerId)));
    return "claimed" as const;
  });
}
