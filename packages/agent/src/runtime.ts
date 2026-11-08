import type { CacheInvalidation } from "@workspace/cache/invalidate";
import { requireOwnedStore } from "./guards.server";
import { ACTION_ID_RE, InMemoryPendingStore, newActionId, PENDING_TTL_MS, type PendingAction, type PendingStore } from "./pending";
import type { AgentRegistry } from "./registry";
import {
  aiCreditGateway,
  dbToolCallLogger,
  InMemoryReadCap,
  type CreditGateway,
  type ReadCap,
  type ToolCallLogger,
} from "./services.server";
import { AgentError, type AgentContext, type AnyAgentTool, type ConfirmCard } from "./types";

/**
 * Plan, then confirm (spec §14.2.5). A write is never run from model output:
 * `proposeAction` validates the input, checks the store, builds the confirm
 * card in code and keeps the action pending; only `confirmAction`, called when
 * the seller presses Confirm, runs it. Reads run directly (`runRead`), free
 * and capped per day. Credits (D11): 1 per confirmed write, claimed before the
 * run and refunded when it fails; reads and questions are free.
 */

/** Direct reads per seller per Cairo day (model calls have their own cap). */
export const AGENT_READS_PER_DAY = 300;

export type CreditPolicy = "charge" | "free";

export type AgentRuntimeOptions = {
  registry: AgentRegistry;
  pending?: PendingStore;
  credits?: CreditGateway;
  logger?: ToolCallLogger;
  readCap?: ReadCap;
  readsPerDay?: number;
  /** Applies a tool's cache invalidation (the app picks the mode: action, route or backend broadcast). */
  applyInvalidation?: (invalidation: CacheInvalidation) => Promise<void>;
  ttlMs?: number;
  now?: () => number;
};

export type ProposedAction = {
  actionId: string;
  tool: string;
  skill: string;
  card: ConfirmCard;
  credits: number;
  expiresAt: string;
};

export type ConfirmedAction = {
  actionId: string;
  tool: string;
  result: unknown;
  creditsCharged: number;
  /** True when this was a repeat of an action that already ran. */
  replayed: boolean;
};

export type AgentRuntime = {
  proposeAction(ctx: AgentContext, toolName: string, input: unknown): Promise<ProposedAction>;
  confirmAction(ctx: AgentContext, actionId: string, options?: { creditPolicy?: CreditPolicy }): Promise<ConfirmedAction>;
  cancelAction(ctx: AgentContext, actionId: string): Promise<void>;
  runRead(ctx: AgentContext, toolName: string, input: unknown): Promise<unknown>;
  readonly registry: AgentRegistry;
};

const errorCodeOf = (error: unknown) =>
  error instanceof AgentError ? error.code : ((error as { code?: unknown })?.code && typeof (error as { code: unknown }).code === "string" ? String((error as { code: string }).code) : "tool_failed");

export function parseToolInput(tool: AnyAgentTool, input: unknown): unknown {
  const parsed = tool.input.safeParse(input ?? {});
  if (!parsed.success) {
    throw new AgentError("invalid_input", `Input for ${tool.name} is not valid.`, {
      issues: parsed.error.issues.slice(0, 10).map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
  return parsed.data;
}

export function createAgentRuntime(options: AgentRuntimeOptions): AgentRuntime {
  const { registry } = options;
  const pending = options.pending ?? new InMemoryPendingStore();
  const credits = options.credits ?? aiCreditGateway;
  const logger = options.logger ?? dbToolCallLogger;
  const readCap = options.readCap ?? new InMemoryReadCap();
  const readsPerDay = options.readsPerDay ?? AGENT_READS_PER_DAY;
  const ttlMs = options.ttlMs ?? PENDING_TTL_MS;
  const now = options.now ?? Date.now;

  const log = (ctx: AgentContext, tool: AnyAgentTool, entry: Omit<Parameters<ToolCallLogger["record"]>[1], "tool" | "skill" | "kind">) =>
    logger.record(ctx, { tool: tool.name, skill: tool.skill, kind: tool.kind === "read" ? "read" : "write", ...entry }).catch(() => undefined);

  const invalidate = async (invalidation: CacheInvalidation | undefined) => {
    if (!invalidation || !options.applyInvalidation) return;
    try {
      await options.applyInvalidation(invalidation);
    } catch (error) {
      console.error("[agent] cache invalidation failed", error instanceof Error ? error.message : error);
    }
  };

  async function ownAction(ctx: AgentContext, actionId: string): Promise<PendingAction> {
    if (typeof actionId !== "string" || !ACTION_ID_RE.test(actionId)) throw new AgentError("not_found", "Action not found.");
    const action = await pending.get(actionId);
    // Another seller's or another store's action looks exactly like a missing one.
    if (!action || action.sellerId !== ctx.sellerId || action.storeId !== ctx.storeId) throw new AgentError("not_found", "Action not found.");
    return action;
  }

  const replay = (action: PendingAction): ConfirmedAction => ({
    actionId: action.id,
    tool: action.tool,
    result: action.result,
    creditsCharged: 0,
    replayed: true,
  });

  return {
    registry,

    async proposeAction(ctx, toolName, input) {
      const tool = registry.tool(toolName);
      if (tool.kind !== "write" || !tool.preview) throw new AgentError("invalid_input", `${toolName} is not a write tool.`);
      const parsed = parseToolInput(tool, input);
      await requireOwnedStore(ctx, { forWrite: true });
      const card = await tool.preview(ctx, parsed);
      const created = now();
      const action: PendingAction = {
        id: newActionId(),
        sellerId: ctx.sellerId,
        storeId: ctx.storeId,
        source: ctx.source,
        tool: tool.name,
        input: parsed,
        card,
        credits: tool.credits,
        createdAt: created,
        expiresAt: created + ttlMs,
        status: "pending",
      };
      await pending.put(action);
      return {
        actionId: action.id,
        tool: tool.name,
        skill: tool.skill,
        card,
        credits: tool.credits,
        expiresAt: new Date(action.expiresAt).toISOString(),
      };
    },

    async confirmAction(ctx, actionId, confirmOptions = {}) {
      const found = await ownAction(ctx, actionId);
      if (found.status === "done") return replay(found);
      if (found.status === "running") throw new AgentError("already_running", "This change is already running.");
      if (found.status === "failed") throw new AgentError("tool_failed", "This change failed; ask again.", { reason: found.errorCode });
      if (found.expiresAt <= now()) throw new AgentError("expired", "This proposal expired; ask again.");

      const action = await pending.claim(actionId);
      if (!action) {
        // Lost a race with a second click: answer like the winner did.
        const again = await ownAction(ctx, actionId);
        if (again.status === "done") return replay(again);
        throw new AgentError("already_running", "This change is already running.");
      }

      const tool = registry.tool(action.tool);
      const started = now();
      // Free only for the store builder's free build; everyone else pays per write.
      const charge = !(confirmOptions.creditPolicy === "free" && ctx.source === "builder") && action.credits > 0;
      const claimed: string[] = [];
      try {
        await requireOwnedStore(ctx, { forWrite: true });
        if (charge) {
          for (let i = 0; i < action.credits; i++) {
            const claim = await credits.claim(ctx.sellerId, `agent_${tool.name}`);
            if (!claim.ok) throw new AgentError("no_credits", "No AI credits left.");
            claimed.push(claim.reference);
          }
        }
      } catch (error) {
        await Promise.all(claimed.map((reference) => credits.refund(ctx.sellerId, reference).catch(() => undefined)));
        // Not run: keep it confirmable (e.g. after buying credits) unless the store is gone.
        if (error instanceof AgentError && error.code === "no_credits") await pending.release(actionId);
        else await pending.finish(actionId, { status: "failed", errorCode: errorCodeOf(error) });
        await log(ctx, tool, { status: "denied", errorCode: errorCodeOf(error), durationMs: now() - started });
        throw error;
      }

      try {
        const outcome = await tool.run(ctx, action.input);
        await pending.finish(actionId, { status: "done", result: outcome.data });
        await invalidate(outcome.invalidation);
        await log(ctx, tool, { status: "ok", resultRef: outcome.resultRef ?? null, credits: claimed.length, durationMs: now() - started });
        return { actionId, tool: tool.name, result: outcome.data, creditsCharged: claimed.length, replayed: false };
      } catch (error) {
        await Promise.all(claimed.map((reference) => credits.refund(ctx.sellerId, reference).catch(() => undefined)));
        await pending.finish(actionId, { status: "failed", errorCode: errorCodeOf(error) });
        await log(ctx, tool, { status: "error", errorCode: errorCodeOf(error), durationMs: now() - started });
        throw error instanceof AgentError ? error : new AgentError("tool_failed", "The change failed.", { reason: errorCodeOf(error) });
      }
    },

    async cancelAction(ctx, actionId) {
      const action = await ownAction(ctx, actionId);
      if (action.status === "pending") await pending.finish(actionId, { status: "failed", errorCode: "cancelled" });
    },

    async runRead(ctx, toolName, input) {
      const tool = registry.tool(toolName);
      if (tool.kind !== "read") throw new AgentError("invalid_input", `${toolName} changes data; propose it instead.`);
      const parsed = parseToolInput(tool, input);
      if (!(await readCap.hit(ctx.sellerId, readsPerDay))) throw new AgentError("read_cap", "Daily limit for assistant reads reached.");
      const started = now();
      try {
        const outcome = await tool.run(ctx, parsed);
        await log(ctx, tool, { status: "ok", durationMs: now() - started });
        return outcome.data;
      } catch (error) {
        await log(ctx, tool, { status: "error", errorCode: errorCodeOf(error), durationMs: now() - started });
        throw error;
      }
    },
  };
}
