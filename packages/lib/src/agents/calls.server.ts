/**
 * MCP tool call bookkeeping (ROADMAP.md F-29c, design note §8–§9; tables from
 * 0133): durable per-grant rate limits in agent_rate_windows, the activity log
 * in agent_tool_calls, and idempotent retries of create tools. Server only;
 * never cached (CLAUDE.md rule 8).
 */
import { agentRateWindows, agentToolCalls, and, db, eq, sql } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { AGENT_RATE_LIMITS, isIdempotencyKey, rateRetryAfter, rateWindowStart, summarizeArgs, type RateBucket } from "./calls.lib";

export type RateCheck = { ok: true } | { ok: false; bucket: RateBucket; retryAfter: number };

/**
 * Counts one call in each bucket and says whether any went over its limit.
 * One upsert per bucket (`count = count + 1 RETURNING count`), so concurrent
 * serverless instances share the same counters.
 */
export async function hitAgentRateLimits(grantId: string, buckets: readonly RateBucket[], now = new Date()): Promise<RateCheck> {
  for (const bucket of buckets) {
    const { windowSeconds, limit } = AGENT_RATE_LIMITS[bucket];
    const windowStart = rateWindowStart(now, windowSeconds).toISOString();
    const [row] = await db
      .insert(agentRateWindows)
      .values({ grantId, bucket, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [agentRateWindows.grantId, agentRateWindows.bucket, agentRateWindows.windowStart],
        set: { count: sql`${agentRateWindows.count} + 1` },
      })
      .returning({ count: agentRateWindows.count });
    if ((row?.count ?? 0) > limit) return { ok: false, bucket, retryAfter: rateRetryAfter(now, windowSeconds) };
  }
  return { ok: true };
}

export type ToolCallStatus = "ok" | "error" | "denied" | "rate_limited";

export type ToolCallRecord = {
  grantId: string;
  sellerId: string;
  storeId?: string | null;
  tool: string;
  args?: Record<string, unknown> | null;
  status: ToolCallStatus;
  errorCode?: string | null;
  idempotencyKey?: string | null;
  resultRef?: Record<string, unknown> | null;
  durationMs?: number | null;
};

/**
 * Writes one activity row. A failure here is logged and never fails the tool
 * call. With an idempotency key, returns false when the key was already used
 * (the caller then returns the stored result instead).
 */
export async function recordAgentToolCall(call: ToolCallRecord): Promise<boolean> {
  const key = isIdempotencyKey(call.idempotencyKey) ? call.idempotencyKey : null;
  try {
    const rows = await db
      .insert(agentToolCalls)
      .values({
        grantId: call.grantId,
        sellerId: call.sellerId,
        storeId: call.storeId ?? null,
        tool: call.tool.slice(0, 100),
        argsSummary: summarizeArgs(call.args),
        status: call.status,
        errorCode: call.errorCode?.slice(0, 100) ?? null,
        idempotencyKey: key,
        resultRef: call.resultRef ?? null,
        durationMs: call.durationMs == null ? null : Math.max(0, Math.round(call.durationMs)),
      })
      .onConflictDoNothing()
      .returning({ id: agentToolCalls.id });
    return rows.length > 0;
  } catch (error) {
    logServerError("integration", "mcp tool call log failed", { tool: call.tool, grantId: call.grantId }, error);
    return true;
  }
}

/**
 * The stored result of an earlier successful call with this idempotency key
 * (24 h), or null. Only successful calls keep a key, so a failed create can
 * be retried with the same key.
 */
export async function findIdempotentResult(
  grantId: string,
  tool: string,
  idempotencyKey: unknown,
  now = new Date(),
): Promise<Record<string, unknown> | null> {
  if (!isIdempotencyKey(idempotencyKey)) return null;
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const [row] = await db
    .select({ resultRef: agentToolCalls.resultRef })
    .from(agentToolCalls)
    .where(
      and(
        eq(agentToolCalls.grantId, grantId),
        eq(agentToolCalls.idempotencyKey, idempotencyKey),
        eq(agentToolCalls.tool, tool),
        eq(agentToolCalls.status, "ok"),
        sql`${agentToolCalls.createdAt} > ${since}::timestamptz`,
      ),
    )
    .limit(1);
  return row?.resultRef ?? null;
}

/** Housekeeping (design note §8, owner: 90 days): old activity rows and spent rate windows. */
export async function purgeOldAgentActivity(now = new Date()): Promise<{ calls: number; windows: number }> {
  const callCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const windowCutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const calls = await db
    .delete(agentToolCalls)
    .where(sql`${agentToolCalls.createdAt} < ${callCutoff}::timestamptz`)
    .returning({ id: agentToolCalls.id });
  const windows = await db
    .delete(agentRateWindows)
    .where(sql`${agentRateWindows.windowStart} < ${windowCutoff}::timestamptz`)
    .returning({ grantId: agentRateWindows.grantId });
  return { calls: calls.length, windows: windows.length };
}
