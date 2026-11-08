import type { AnyAgentTool } from "./types";

/**
 * Actions the agent may never take (spec §14.2.5, owner D12): wallet,
 * top-ups, payouts, plan changes, deleting a store or the account, secrets.
 * Checked twice when a tool is registered: its kind, and its name against
 * this denylist, so a mislabelled tool is still refused. Money and these
 * actions stay in the dashboard's own forms.
 */
export const FORBIDDEN_TOOL_PATTERNS: readonly RegExp[] = [
  /wallet/,
  /top_?up/,
  /payout/,
  /withdraw/,
  /refund/,
  /credit_?pack|buy_?credits?/,
  /(^|_)plan(_|$)|subscription|upgrade|downgrade/,
  /(delete|remove|archive|purge)_(store|account|seller|user)/,
  /(store|account|seller|user)_(delete|remove|archive|purge)/,
  /secret|api_?key|password|token|credential|private_?key/,
  /payment_?(method|gateway|details)|bank|instapay/,
];

export function forbiddenReason(tool: Pick<AnyAgentTool, "name" | "kind">): string | null {
  if (tool.kind === "money") return `"${tool.name}" is a money action; the agent never runs those.`;
  const name = tool.name.toLowerCase();
  const hit = FORBIDDEN_TOOL_PATTERNS.find((pattern) => pattern.test(name));
  return hit ? `"${tool.name}" touches an action the agent may never take (${hit.source}).` : null;
}
