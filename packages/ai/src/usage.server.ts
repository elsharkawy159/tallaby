import { and, count, eq, gte } from "drizzle-orm"
import { aiUsageLogs, db } from "@workspace/db"
import { cairoDayStart } from "./day"

export type AiUsageStatus = "ok" | "error" | "blocked"

export type AiUsageRow = {
  sellerId: string
  feature: string
  model: string
  status: AiUsageStatus
  inputTokens?: number
  cachedInputTokens?: number
  outputTokens?: number
  costMicroUsd?: number
  latencyMs?: number
  errorCode?: string
}

/** Never throws: a failed log must not fail the seller's request. */
export async function logAiUsage(row: AiUsageRow): Promise<void> {
  try {
    await db.insert(aiUsageLogs).values({
      sellerId: row.sellerId,
      feature: row.feature,
      model: row.model,
      status: row.status,
      inputTokens: row.inputTokens ?? null,
      cachedInputTokens: row.cachedInputTokens ?? null,
      outputTokens: row.outputTokens ?? null,
      costMicroUsd: row.costMicroUsd ?? 0,
      latencyMs: row.latencyMs ?? null,
      errorCode: row.errorCode?.slice(0, 120) ?? null,
    })
  } catch (error) {
    console.error("[ai] usage log failed", error instanceof Error ? error.message : error)
  }
}

/** Successful calls of one feature by one seller since `since`. */
export async function countAiUsageSince(sellerId: string, feature: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageLogs)
    .where(
      and(
        eq(aiUsageLogs.sellerId, sellerId),
        eq(aiUsageLogs.feature, feature),
        eq(aiUsageLogs.status, "ok"),
        gte(aiUsageLogs.createdAt, since.toISOString()),
      ),
    )
  return row?.value ?? 0
}

export type DailyCap = { used: number; limit: number; remaining: number; allowed: boolean }

export async function checkDailyCap(sellerId: string, feature: string, limit: number, now = new Date()): Promise<DailyCap> {
  const used = await countAiUsageSince(sellerId, feature, cairoDayStart(now))
  const remaining = Math.max(0, limit - used)
  return { used, limit, remaining, allowed: remaining > 0 }
}
