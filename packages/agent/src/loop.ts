import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, stepCountIs, tool, type LanguageModel, type StepResult, type Tool, type ToolSet } from "ai";
import { aiConfigured, checkDailyCap, costMicroUsd, logAiUsage, modelChainForTier } from "@workspace/ai";
import { AGENT_LIMITS, agentSystemPrompt, agentUserText } from "./prompt.lib";
import type { AgentRuntime, ProposedAction } from "./runtime";
import { AgentError, type AgentContext, type AnyAgentTool, type SkillId } from "./types";

/**
 * One free-text turn (spec §14.2.3): the active skill's tools only, the
 * `fast` tier with thinking "minimal", at most 6 steps, a per-request dollar
 * stop, and an ai_usage_logs row per model call (feature `agent_<skill>`).
 * Read tools run inside the loop (through the runtime: free, capped, logged).
 * Write tools have no `execute`: a call ends the loop and becomes a pending
 * action with a confirm card. Nothing is written until the seller confirms.
 */

export const LOOP_DEFAULTS = {
  maxSteps: 6,
  /** $0.02 per turn: about 10× a typical turn on gemini-3.1-flash-lite. */
  stopMicroUsd: 20_000,
  /** Model calls per seller per skill per Cairo day. */
  dailyCalls: 150,
  maxOutputTokens: 1200,
  budgetMs: 45_000,
} as const;

export type AgentTurnInput = {
  skillId: SkillId;
  message: string;
  /** A short summary of the conversation and store state, instead of the full history. */
  stateSummary?: string | null;
};

export type AgentTurnOptions = {
  /** Test seam: replaces the Gemini model. */
  model?: (modelId: string) => LanguageModel;
  maxSteps?: number;
  stopMicroUsd?: number;
  dailyCalls?: number;
  /** Skips the daily cap check (tests). */
  skipDailyCap?: boolean;
};

export type AgentTurnResult = {
  text: string;
  proposals: ProposedAction[];
  /** Write calls the runtime refused (bad input, unknown place, foreign id...). */
  rejected: Array<{ tool: string; code: string }>;
  reads: string[];
  steps: number;
  costMicroUsd: number;
  modelId: string;
  stoppedBy: "done" | "write_proposed" | "max_steps" | "spend_cap";
};

let provider: ReturnType<typeof createGoogleGenerativeAI> | null = null;
/** Same key and kill switch as packages/ai (its provider is not exported); server-only, rule 10. */
const gemini = (modelId: string): LanguageModel => {
  provider ??= createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "" });
  return provider(modelId);
};

export const agentFeature = (skillId: SkillId) => `agent_${skillId}`;

type Usage = { inputTokens?: number; cachedInputTokens?: number; outputTokens?: number };

function readUsage(usage: unknown): Usage {
  const u = (usage ?? {}) as Record<string, unknown>;
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
  const details = (u.inputTokenDetails ?? {}) as Record<string, unknown>;
  return { inputTokens: num(u.inputTokens), cachedInputTokens: num(details.cacheReadTokens) ?? num(u.cachedInputTokens), outputTokens: num(u.outputTokens) };
}

const thinkingConfig = (modelId: string) => (/^gemini-2\./.test(modelId) ? { thinkingBudget: 0 } : { thinkingLevel: "minimal" });

function sdkTools(runtime: AgentRuntime, ctx: AgentContext, tools: AnyAgentTool[], reads: string[]): ToolSet {
  const set: Record<string, Tool> = {};
  for (const t of tools) {
    if (t.kind === "read") {
      set[t.name] = tool({
        description: t.description,
        inputSchema: t.input,
        execute: async (input: unknown) => {
          reads.push(t.name);
          try {
            return await runtime.runRead(ctx, t.name, input);
          } catch (error) {
            return { error: error instanceof AgentError ? error.code : "failed" };
          }
        },
      }) as Tool;
    } else if (t.kind === "write") {
      // No execute: the call stops the loop and is returned for a confirm card.
      set[t.name] = tool({ description: t.description, inputSchema: t.input }) as Tool;
    }
  }
  return set;
}

export async function runAgentTurn(
  runtime: AgentRuntime,
  ctx: AgentContext,
  input: AgentTurnInput,
  options: AgentTurnOptions = {},
): Promise<AgentTurnResult> {
  const skill = runtime.registry.skill(input.skillId);
  const feature = agentFeature(skill.id);
  if (!options.model && !aiConfigured()) throw new AgentError("ai_unavailable", "AI is off.");
  if (!options.skipDailyCap) {
    const cap = await checkDailyCap(ctx.sellerId, feature, options.dailyCalls ?? LOOP_DEFAULTS.dailyCalls);
    if (!cap.allowed) throw new AgentError("turn_cap", "Daily assistant limit reached.");
  }

  const maxSteps = Math.min(options.maxSteps ?? LOOP_DEFAULTS.maxSteps, LOOP_DEFAULTS.maxSteps);
  const stopMicroUsd = options.stopMicroUsd ?? LOOP_DEFAULTS.stopMicroUsd;
  const writeNames = new Set(skill.tools.filter((t) => t.kind === "write").map((t) => t.name));
  const instructions = agentSystemPrompt(skill.rules);
  const userText = agentUserText({ message: input.message, stateSummary: input.stateSummary, locale: ctx.locale });

  const deadline = Date.now() + LOOP_DEFAULTS.budgetMs;
  let spent = 0;
  let lastError: unknown;

  for (const modelId of modelChainForTier("fast")) {
    if (spent >= stopMicroUsd || Date.now() > deadline - 8_000) break;
    const reads: string[] = [];
    const model = options.model ? options.model(modelId) : gemini(modelId);
    const started = Date.now();
    let stepStarted = started;
    let spentHere = 0;
    const logStep = async (step: StepResult<ToolSet>) => {
      const usage = readUsage(step.usage);
      const cost = costMicroUsd(modelId, usage);
      spentHere += cost;
      await logAiUsage({
        sellerId: ctx.sellerId,
        feature,
        refId: ctx.refId ?? null,
        model: modelId,
        status: "ok",
        ...usage,
        costMicroUsd: cost,
        latencyMs: Date.now() - stepStarted,
      });
      stepStarted = Date.now();
    };
    try {
      const result = await generateText({
        model,
        instructions,
        messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
        tools: sdkTools(runtime, ctx, skill.tools, reads),
        stopWhen: [stepCountIs(maxSteps), () => spent + spentHere >= stopMicroUsd],
        onStepFinish: logStep,
        maxOutputTokens: LOOP_DEFAULTS.maxOutputTokens,
        temperature: 0.2,
        maxRetries: 0,
        timeout: Math.max(5_000, deadline - Date.now()),
        providerOptions: { google: { thinkingConfig: thinkingConfig(modelId) } },
      });
      spent += spentHere;

      const proposals: ProposedAction[] = [];
      const rejected: AgentTurnResult["rejected"] = [];
      const calls = result.steps.flatMap((step) => step.toolCalls).filter((call) => writeNames.has(call.toolName));
      for (const call of calls) {
        if (proposals.length + rejected.length >= AGENT_LIMITS.proposalsPerTurn) break;
        if ((call as { invalid?: boolean }).invalid) {
          rejected.push({ tool: call.toolName, code: "invalid_input" });
          continue;
        }
        try {
          proposals.push(await runtime.proposeAction(ctx, call.toolName, call.input));
        } catch (error) {
          rejected.push({ tool: call.toolName, code: error instanceof AgentError ? error.code : "failed" });
        }
      }

      const steps = result.steps.length;
      const stoppedBy: AgentTurnResult["stoppedBy"] =
        calls.length > 0 ? "write_proposed" : spent >= stopMicroUsd ? "spend_cap" : steps >= maxSteps && result.finishReason === "tool-calls" ? "max_steps" : "done";
      return { text: result.text.trim().slice(0, 2000), proposals, rejected, reads, steps, costMicroUsd: spent, modelId, stoppedBy };
    } catch (error) {
      spent += spentHere;
      lastError = error;
      await logAiUsage({
        sellerId: ctx.sellerId,
        feature,
        refId: ctx.refId ?? null,
        model: modelId,
        status: "error",
        latencyMs: Date.now() - started,
        errorCode: (error instanceof Error ? error.name : "unknown").replace(/^AI_/, "").slice(0, 60),
      });
      // A read already ran on a failed model: retrying on the next one is still safe (reads change nothing).
      console.warn(`[agent] ${feature} on ${modelId} failed`);
    }
  }
  if (spent >= stopMicroUsd) throw new AgentError("spend_cap", "This request hit its cost limit.");
  throw lastError instanceof Error ? lastError : new AgentError("ai_unavailable", "The assistant is busy; try again.");
}
