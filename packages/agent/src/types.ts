/**
 * The skill contract of the Tallaby agent (ROADMAP.md F-83a, spec
 * docs/superpowers/specs/2026-11-08-ai-store-builder-v2-design.md §14).
 *
 * A tool is a small typed wrapper over existing packages/lib server code. Its
 * input schema never carries a seller or store id: those come from the
 * `AgentContext`, which is ALWAYS built on the server from the session
 * (CLAUDE.md rule 5). Server-only.
 */
import type { CacheInvalidation } from "@workspace/cache/invalidate";
import type { z } from "zod";

export type AgentSource = "in_app" | "builder" | "mcp";

export type AgentContext = {
  /** sellers.id of the session's account. Never from the client or the model. */
  sellerId: string;
  /** The explicit target store, already checked against the session by the caller. */
  storeId: string;
  /** The user acting (stock history, audit rows). Defaults to sellerId (the owner). */
  userId?: string;
  locale: "ar" | "en";
  source: AgentSource;
  /** Written to ai_usage_logs.ref_id, e.g. a store build id. */
  refId?: string | null;
  /** MCP only: the OAuth grant, so tool runs land in agent_tool_calls. */
  grantId?: string | null;
  /** Products the agent creates go live (true) or stay drafts (false, default). Set by the caller, never the model. */
  publishProducts?: boolean;
};

/**
 * - read: no change; runs directly, 0 credits, capped per day.
 * - write: changes store data; only after the seller confirms a card.
 * - money: wallet, top-ups, payouts, paid installs. Never registered for the agent.
 */
export type ToolKind = "read" | "write" | "money";

export type ConfirmLine = {
  /** i18n key under `agent.card.*` in the dashboard messages. */
  key: string;
  params?: Record<string, string | number | undefined>;
};

export type ConfirmCard = {
  /** i18n key, e.g. "agent.card.shipping.saveZone.title". */
  title: string;
  params?: Record<string, string | number | undefined>;
  lines: ConfirmLine[];
  /** high: replaces or removes something, or is account-wide. */
  risk: "low" | "high";
};

export type ToolRunResult<O> = {
  data: O;
  /** Applied by the caller (the app decides the cache mode). */
  invalidation?: CacheInvalidation;
  /** Small, secret-free record of what changed, for the log. */
  resultRef?: Record<string, unknown>;
};

export type AgentTool<I = unknown, O = unknown> = {
  /** snake_case, unique across skills. */
  name: string;
  skill: SkillId;
  /** Short: it is billed on every model call that offers the tool. */
  description: string;
  input: z.ZodType<I>;
  kind: ToolKind;
  /** Credits on a confirmed, successful run. Reads are 0. */
  credits: number;
  run: (ctx: AgentContext, input: I) => Promise<ToolRunResult<O>>;
  /** Builds the confirm card. Required for writes. May read the store (code, not the model). */
  preview?: (ctx: AgentContext, input: I) => Promise<ConfirmCard>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAgentTool = AgentTool<any, any>;

export type SkillId = "products" | "shipping" | "design" | "settings";

export type Skill = {
  id: SkillId;
  /** Dashboard paths where this skill is the page agent, e.g. "/stores/[storeId]/shipping". */
  pages: string[];
  /** Short system rules (≤ 40 lines), a constant string so the provider cache can reuse it. */
  rules: string;
  tools: AnyAgentTool[];
  /** Guided flows (fixed steps + question cards) come later (F-83b). */
  flows?: string[];
};

export class AgentError extends Error {
  constructor(
    readonly code: AgentErrorCode,
    message?: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = "AgentError";
  }
}

export type AgentErrorCode =
  | "unknown_tool"
  | "forbidden_tool"
  | "invalid_input"
  | "not_found"
  | "store_read_only"
  | "expired"
  | "already_running"
  | "no_credits"
  | "read_cap"
  | "turn_cap"
  | "spend_cap"
  | "ai_unavailable"
  | "tool_failed";
