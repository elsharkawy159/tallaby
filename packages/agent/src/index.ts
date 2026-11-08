/**
 * @workspace/agent: the Tallaby agent core (ROADMAP.md F-83a). Server-only.
 * Skills (products, shipping, design, settings) with typed tools over
 * packages/lib, plan-then-confirm runtime, tool loop and code router.
 */
export * from "./types";
export { FORBIDDEN_TOOL_PATTERNS, forbiddenReason } from "./forbidden";
export { createAgentRegistry, createRegistry, validateTool, MAX_RULE_LINES, MAX_TOOLS_PER_SKILL, type AgentRegistry, type AgentRegistryDeps } from "./registry";
export {
  createAgentRuntime,
  parseToolInput,
  AGENT_READS_PER_DAY,
  type AgentRuntime,
  type AgentRuntimeOptions,
  type ConfirmedAction,
  type CreditPolicy,
  type ProposedAction,
} from "./runtime";
export { InMemoryPendingStore, PENDING_TTL_MS, type PendingAction, type PendingOutcome, type PendingStatus, type PendingStore } from "./pending";
export { dbPendingStore } from "./pending.server";
export {
  aiCreditGateway,
  cairoDay,
  DbReadCap,
  dbReadCap,
  dbToolCallLogger,
  incrementAgentReadCount,
  InMemoryReadCap,
  type CreditClaim,
  type CreditGateway,
  type ReadCap,
  type ToolCallEntry,
  type ToolCallLogger,
} from "./services.server";
export { runAgentTurn, agentFeature, LOOP_DEFAULTS, type AgentTurnInput, type AgentTurnOptions, type AgentTurnResult } from "./loop";
export { pickSkill, skillForMessage, skillForPage } from "./router";
export { AGENT_LIMITS, CORE_RULES, sanitizeSellerText } from "./prompt.lib";
export { matchPlaceNames, type PlaceMatch } from "./places.lib";
export { requireOwnedStore } from "./guards.server";
