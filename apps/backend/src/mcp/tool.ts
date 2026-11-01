import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import { broadcastInvalidation } from "@workspace/cache/broadcast";
import type { CacheInvalidation } from "@workspace/cache/invalidate";
import { logServerError } from "@workspace/db/log";
import { agentCanUseStore, agentHasScope, type AgentActor, type AgentScope } from "@workspace/lib/agents";
import { findIdempotentResult, hitAgentRateLimits, recordAgentToolCall } from "@workspace/lib/agents/server";
import { AgentProductError } from "@workspace/lib/products/agent/server";

/**
 * One MCP tool (ROADMAP.md F-29c, design note §7–§8). The wrapper does what
 * every tool needs, in this order: scope check, store-in-grant check, durable
 * rate limit, idempotent replay, the call itself, the activity log row, and
 * the cross-app cache broadcast. Tools never see a seller or store id that did
 * not come from the verified token.
 */
export type ToolOutcome = {
  data: Record<string, unknown>;
  storeId?: string | null;
  /** Small, secret-free record of what changed (activity log; replayed for idempotent retries). */
  resultRef?: Record<string, unknown>;
  invalidation?: CacheInvalidation;
};

export type ToolSpec<S extends z.ZodObject> = {
  name: string;
  title: string;
  description: string;
  input: S;
  scope: AgentScope;
  write: boolean;
  annotations: ToolAnnotations;
  run: (args: z.infer<S>, actor: AgentActor) => Promise<ToolOutcome>;
};

class ToolDenied extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function result(data: Record<string, unknown>, isError = false): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    structuredContent: data,
    ...(isError ? { isError: true } : {}),
  };
}

function errorResult(code: string, message: string, details?: Record<string, unknown>): CallToolResult {
  return result({ error: { code, message, ...(details ? { details } : {}) } }, true);
}

export function registerTool<S extends z.ZodObject>(server: McpServer, actor: AgentActor, spec: ToolSpec<S>): void {
  server.registerTool(
    spec.name,
    { title: spec.title, description: spec.description, inputSchema: spec.input, annotations: spec.annotations },
    (async (args: z.infer<S>) => {
      const started = Date.now();
      const raw = args as Record<string, unknown>;
      const storeId = typeof raw.storeId === "string" ? raw.storeId : null;
      const idempotencyKey = spec.write && typeof raw.idempotencyKey === "string" ? raw.idempotencyKey : null;
      const log = (status: "ok" | "error" | "denied" | "rate_limited", extra: { errorCode?: string; resultRef?: Record<string, unknown>; storeId?: string | null; key?: string | null } = {}) =>
        recordAgentToolCall({
          grantId: actor.grantId,
          sellerId: actor.sellerId,
          storeId: extra.storeId ?? (storeId && agentCanUseStore(actor, storeId) ? storeId : null),
          tool: spec.name,
          args: raw,
          status,
          errorCode: extra.errorCode ?? null,
          idempotencyKey: extra.key ?? null,
          resultRef: extra.resultRef ?? null,
          durationMs: Date.now() - started,
        });

      try {
        if (!agentHasScope(actor, spec.scope)) {
          throw new ToolDenied(
            "scope_missing",
            `This assistant was not allowed "${spec.scope}". Ask the seller to reconnect Tallaby and turn that permission on.`,
          );
        }
        if (storeId !== null && !agentCanUseStore(actor, storeId)) {
          throw new ToolDenied("store_not_allowed", "That store is not one this assistant can use. Call list_stores for the allowed stores.");
        }

        const rate = await hitAgentRateLimits(actor.grantId, spec.write ? ["minute", "day", "write_minute"] : ["minute", "day"]);
        if (!rate.ok) {
          await log("rate_limited", { errorCode: rate.bucket });
          return errorResult("rate_limited", `Too many requests. Try again in ${rate.retryAfter} seconds.`, { retryAfterSeconds: rate.retryAfter });
        }

        if (idempotencyKey) {
          const previous = await findIdempotentResult(actor.grantId, spec.name, idempotencyKey);
          if (previous) return result({ ...previous, replayed: true });
        }

        const outcome = await spec.run(args, actor);
        const fresh = await log("ok", { resultRef: outcome.resultRef, storeId: outcome.storeId, key: idempotencyKey });
        if (!fresh && idempotencyKey) {
          // Another call with the same key finished first: answer with its result.
          const previous = await findIdempotentResult(actor.grantId, spec.name, idempotencyKey);
          if (previous) return result({ ...previous, replayed: true });
        }
        if (outcome.invalidation) await broadcastInvalidation(outcome.invalidation, "backend");
        return result(outcome.data);
      } catch (error) {
        if (error instanceof ToolDenied) {
          await log("denied", { errorCode: error.code });
          return errorResult(error.code, error.message);
        }
        if (error instanceof AgentProductError) {
          await log("error", { errorCode: error.code });
          return errorResult(error.code, error.message, error.details);
        }
        logServerError("integration", "mcp tool failed", { tool: spec.name, grantId: actor.grantId }, error);
        await log("error", { errorCode: "internal_error" });
        return errorResult("internal_error", "Something went wrong on Tallaby's side. Try again in a moment.");
      }
    }) as never,
  );
}
