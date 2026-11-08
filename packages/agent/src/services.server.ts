import { cairoDayStart } from "@workspace/ai";
import { agentReadCounts, db, sql } from "@workspace/db";
import { recordAgentToolCall } from "@workspace/lib/agents/server";
import { claimAiCredit, refundAiCredit } from "@workspace/lib/billing/credits";
import type { AgentContext } from "./types";

/**
 * The runtime's side effects behind small interfaces, so tests swap them: AI
 * credits (F-57), the tool-call log and the daily read cap. The defaults are
 * DB-backed (0158), so they hold across serverless instances.
 */

// ── Credits ──────────────────────────────────────────────────────────────────

export type CreditClaim = { ok: true; reference: string } | { ok: false; error: "no_credits" };

export interface CreditGateway {
  claim(sellerId: string, feature: string): Promise<CreditClaim>;
  refund(sellerId: string, reference: string): Promise<void>;
}

/** The seller account's AI credits (`claimAiCredit`: 1 credit per claim, refund once per claim). */
export const aiCreditGateway: CreditGateway = {
  claim: (sellerId, feature) => claimAiCredit(sellerId, feature),
  refund: (sellerId, reference) => refundAiCredit(sellerId, reference),
};

// ── Tool-call log ────────────────────────────────────────────────────────────

export type ToolCallEntry = {
  tool: string;
  skill: string;
  kind: "read" | "write";
  status: "ok" | "error" | "denied";
  errorCode?: string | null;
  args?: Record<string, unknown> | null;
  resultRef?: Record<string, unknown> | null;
  credits?: number;
  durationMs?: number;
};

export interface ToolCallLogger {
  record(ctx: AgentContext, entry: ToolCallEntry): Promise<void>;
}

/**
 * Every run lands in agent_tool_calls with its source (0158): MCP rows keep
 * their grant, in-app and builder rows have none. The writer summarises and
 * redacts args (no seller text, rule 10); a failed write is logged and never
 * fails the tool.
 */
export const dbToolCallLogger: ToolCallLogger = {
  async record(ctx, entry) {
    await recordAgentToolCall({
      grantId: ctx.grantId ?? null,
      source: ctx.source,
      sellerId: ctx.sellerId,
      storeId: ctx.storeId,
      tool: entry.tool,
      args: entry.args ?? null,
      status: entry.status,
      errorCode: entry.errorCode ?? null,
      resultRef: {
        skill: entry.skill,
        kind: entry.kind,
        credits: entry.credits ?? 0,
        ...(ctx.refId ? { refId: ctx.refId } : {}),
        ...(entry.resultRef ?? {}),
      },
      durationMs: entry.durationMs ?? null,
    });
  },
};

// ── Daily read cap ───────────────────────────────────────────────────────────

export interface ReadCap {
  /** Counts one read; false when the seller is over `limit` today (Cairo day). */
  hit(sellerId: string, limit: number, now?: Date): Promise<boolean>;
}

/** The Cairo calendar day as YYYY-MM-DD (agent_read_counts.day). */
export function cairoDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Per process (tests). Model calls are capped in the DB (ai_usage_logs); this only caps direct reads. */
export class InMemoryReadCap implements ReadCap {
  private readonly counts = new Map<string, number>();

  async hit(sellerId: string, limit: number, now = new Date()) {
    const key = `${sellerId}:${cairoDayStart(now).toISOString()}`;
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next <= limit;
  }
}

/** One atomic upsert (`count = count + 1 RETURNING count`): the count including this read. */
export async function incrementAgentReadCount(sellerId: string, day: string): Promise<number> {
  const [row] = await db
    .insert(agentReadCounts)
    .values({ sellerId, day, count: 1 })
    .onConflictDoUpdate({
      target: [agentReadCounts.sellerId, agentReadCounts.day],
      set: { count: sql`${agentReadCounts.count} + 1` },
    })
    .returning({ count: agentReadCounts.count });
  return row?.count ?? 1;
}

/** The daily read cap in agent_read_counts (0158), shared by every instance. */
export class DbReadCap implements ReadCap {
  constructor(private readonly increment: (sellerId: string, day: string) => Promise<number> = incrementAgentReadCount) {}

  async hit(sellerId: string, limit: number, now = new Date()) {
    return (await this.increment(sellerId, cairoDay(now))) <= limit;
  }
}

export const dbReadCap: ReadCap = new DbReadCap();
