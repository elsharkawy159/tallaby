import { cairoDayStart } from "@workspace/ai";
import { recordAgentToolCall } from "@workspace/lib/agents/server";
import { claimAiCredit, refundAiCredit } from "@workspace/lib/billing/credits";
import type { AgentContext } from "./types";

/**
 * The runtime's side effects behind small interfaces, so tests swap them and
 * the app can move them to the DB later: AI credits (F-57), the tool-call log
 * and the daily read cap.
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
 * agent_tool_calls (0133) needs a grant_id (NOT NULL, FK to agent_grants) and
 * has no `source` column, so only MCP runs fit it today; the source goes in
 * result_ref. In-app and builder runs are written to the server log until a
 * migration makes grant_id nullable and adds `source` (spec §14.2.7).
 */
export const dbToolCallLogger: ToolCallLogger = {
  async record(ctx, entry) {
    if (ctx.grantId) {
      await recordAgentToolCall({
        grantId: ctx.grantId,
        sellerId: ctx.sellerId,
        storeId: ctx.storeId,
        tool: entry.tool,
        args: entry.args ?? null,
        status: entry.status,
        errorCode: entry.errorCode ?? null,
        resultRef: { source: ctx.source, skill: entry.skill, credits: entry.credits ?? 0, ...(entry.resultRef ?? {}) },
        durationMs: entry.durationMs ?? null,
      });
      return;
    }
    // No args or text here: ids and codes only (rule 10, no seller text in logs).
    console.info(
      "[agent] tool",
      JSON.stringify({
        source: ctx.source,
        sellerId: ctx.sellerId,
        storeId: ctx.storeId,
        refId: ctx.refId ?? null,
        tool: entry.tool,
        status: entry.status,
        errorCode: entry.errorCode ?? null,
        credits: entry.credits ?? 0,
        durationMs: entry.durationMs ?? null,
      }),
    );
  },
};

// ── Daily read cap ───────────────────────────────────────────────────────────

export interface ReadCap {
  /** Counts one read; false when the seller is over `limit` today (Cairo day). */
  hit(sellerId: string, limit: number, now?: Date): Promise<boolean>;
}

/** Per process. Model calls are capped in the DB (ai_usage_logs); this only caps direct reads. */
export class InMemoryReadCap implements ReadCap {
  private readonly counts = new Map<string, number>();

  async hit(sellerId: string, limit: number, now = new Date()) {
    const key = `${sellerId}:${cairoDayStart(now).toISOString()}`;
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next <= limit;
  }
}
