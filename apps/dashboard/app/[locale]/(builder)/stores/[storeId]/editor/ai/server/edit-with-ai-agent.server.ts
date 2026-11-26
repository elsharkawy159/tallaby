import { applyInvalidation } from "@workspace/cache";
import {
  AgentError,
  createAgentRegistry,
  createAgentRuntime,
  dbPendingStore,
  runAgentTurn,
  type AgentContext,
  type AgentRuntime,
  type ProposedAction,
  type SkillId,
} from "@workspace/agent";
import type { EditWithAiError, EditWithAiProposal } from "./edit-with-ai.dto";
import { mediaProductImageUploader } from "./edit-with-ai-files.server";

/**
 * "Edit with AI" on the store agent core (ROADMAP F-83a): products, settings,
 * shipping and the theme go through the core's skills and tools only. A
 * write is never run from model output: the turn returns confirm cards
 * (pending actions in `agent_pending_actions`, 0158), and only
 * `confirmEditWithAi` runs one, charging the core's 1 credit per confirmed
 * write (claimed before the run, refunded when it fails). Server only.
 */

/** The card line the products skill writes when the product goes live (`skills/products.ts`). */
const GOES_LIVE_LINE = "agent.card.products.goesLive";

export function editWithAiRuntime(sellerId: string, storeId: string): AgentRuntime {
  return createAgentRuntime({
    // Photos for products come only from this store's media library (copied, never fetched from the web).
    registry: createAgentRegistry({ uploadProductImage: mediaProductImageUploader(sellerId, storeId) }),
    applyInvalidation: (invalidation) => applyInvalidation(invalidation, { from: "dashboard", mode: "action" }),
  });
}

export function editWithAiContext(input: { sellerId: string; storeId: string; userId: string; locale: "ar" | "en"; publishProducts: boolean }): AgentContext {
  return {
    sellerId: input.sellerId,
    storeId: input.storeId,
    userId: input.userId,
    locale: input.locale,
    source: "in_app",
    refId: input.storeId,
    publishProducts: input.publishProducts,
  };
}

/** The state the store agent reads instead of a chat history: photos to use, the currency, and the last turns. */
export function storeTurnSummary(input: {
  images: readonly { src: string }[];
  currency: string;
  publishProducts: boolean;
  history: readonly { role: "user" | "assistant"; text: string }[];
}): string {
  const lines = [
    `Prices are in the store's currency, ${input.currency}.`,
    input.publishProducts ? "The seller asked for new products to go live." : "New products stay drafts (the seller didn't ask to publish).",
  ];
  if (input.images.length) lines.push(`Photos the seller attached (use these exact links in "images"): ${input.images.map((i) => i.src).join(" ")}`);
  const recent = input.history.slice(-4).map((turn) => `${turn.role === "user" ? "Seller" : "You"}: ${turn.text.replace(/\s+/g, " ").slice(0, 200)}`);
  if (recent.length) lines.push(`Recent chat:\n${recent.join("\n")}`);
  return lines.join("\n");
}

export const toProposalView = (p: ProposedAction): EditWithAiProposal => ({
  actionId: p.actionId,
  tool: p.tool,
  skill: p.skill,
  card: p.card,
  credits: p.credits,
  expiresAt: p.expiresAt,
});

export async function runStoreAgentTurn(runtime: AgentRuntime, ctx: AgentContext, input: { skillId: SkillId; message: string; stateSummary: string }) {
  return runAgentTurn(runtime, ctx, input);
}

/**
 * Whether a pending action of THIS seller and store, made by this chat,
 * would publish: read from the stored card the code built at proposal time
 * (never from the client), so Confirm does what the card said.
 */
export async function pendingPublishes(ctx: Pick<AgentContext, "sellerId" | "storeId">, actionId: string): Promise<boolean | null> {
  const action = await dbPendingStore.get(actionId);
  if (!action || action.sellerId !== ctx.sellerId || action.storeId !== ctx.storeId || action.source !== "in_app") return null;
  return action.card.lines.some((line) => line.key === GOES_LIVE_LINE);
}

export function agentErrorKey(error: unknown): EditWithAiError {
  if (!(error instanceof AgentError)) return "generic";
  switch (error.code) {
    case "not_found":
      return "notFound";
    case "store_read_only":
      return "readOnly";
    case "expired":
      return "actionExpired";
    case "already_running":
      return "actionRunning";
    case "no_credits":
      return "aiNoCredits";
    case "turn_cap":
    case "read_cap":
    case "spend_cap":
      return "aiDailyLimit";
    case "ai_unavailable":
      return "aiFailed";
    default:
      return "actionFailed";
  }
}
