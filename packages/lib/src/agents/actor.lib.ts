/**
 * The identity behind an MCP call (ROADMAP.md F-29, design note §4.4): the
 * seller account that approved the grant, narrowed to its stores and scopes.
 * Pure helpers; `resolveAgentActor` in oauth.server.ts builds it.
 */
import type { AgentScope } from "./scopes.lib";

export type AgentActor = {
  kind: "agent";
  grantId: string;
  tokenId: string;
  tokenKind: "access" | "pat";
  sellerId: string;
  /** Who approved the grant (the owner until F-09 staff ships). */
  userId: string;
  sellerStatus: string;
  clientLabel: string;
  scopes: AgentScope[];
  allStores: boolean;
  /** Live, owned, not-deleted stores the grant covers right now. */
  storeIds: string[];
};

/** Seller statuses that keep dashboard access (same rule as the dashboard's checkSellerAccess). */
export const AGENT_ALLOWED_SELLER_STATUSES: ReadonlySet<string> = new Set(["approved", "restricted"]);

export function agentCanUseStore(actor: Pick<AgentActor, "storeIds">, storeId: string): boolean {
  return actor.storeIds.includes(storeId);
}

export function agentHasScope(actor: Pick<AgentActor, "scopes">, scope: AgentScope): boolean {
  return actor.scopes.includes(scope);
}

/** `Authorization: Bearer <token>` → the token, or null. */
export function bearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+([A-Za-z0-9\-._~+/]+=*)\s*$/i.exec(header);
  return match ? match[1]! : null;
}
