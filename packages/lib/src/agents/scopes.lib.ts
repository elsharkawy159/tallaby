/**
 * MCP agent scopes (ROADMAP.md F-29, design note §5). Coarse, readable on the
 * consent screen; the DB CHECK on agent_grants.scopes (0133) holds the same
 * list. Pure; no I/O.
 */

export const AGENT_SCOPES = [
  "store.read",
  "customers.read",
  "products.write",
  "orders.write",
  "orders.refund",
  "website.write",
  "website.publish",
  "settings.write",
  "products.purge",
  "stores.create",
] as const;

export type AgentScope = (typeof AGENT_SCOPES)[number];

/** Always granted: an assistant that cannot read the store is useless. */
export const REQUIRED_SCOPE: AgentScope = "store.read";

/** On by default on the consent page (owner approved, 2026-10-30). The rest start off. */
export const DEFAULT_SCOPES: readonly AgentScope[] = ["store.read", "products.write", "orders.write", "website.write"];

const KNOWN = new Set<string>(AGENT_SCOPES);

export function isAgentScope(value: string): value is AgentScope {
  return KNOWN.has(value);
}

/** Known scopes only, `store.read` always included, de-duplicated, in catalogue order. */
export function normalizeScopes(values: readonly string[]): AgentScope[] {
  const picked = new Set<string>(values.filter(isAgentScope));
  picked.add(REQUIRED_SCOPE);
  return AGENT_SCOPES.filter((scope) => picked.has(scope));
}

/** Space-separated OAuth `scope` parameter → the known scopes the client asked for (unknown ones are ignored). */
export function parseScopeParam(param: string | null | undefined): AgentScope[] {
  if (!param) return [];
  const values = param.split(/\s+/).filter(Boolean).slice(0, 50);
  return AGENT_SCOPES.filter((scope) => values.includes(scope));
}

/**
 * Switches that start on for the consent page. A client that asks for nothing
 * gets the defaults; a client that asks for specific scopes gets those that are
 * also on by default. Sensitive scopes (customer data, refunds, publish,
 * settings, purge, store creation) always start off, even when requested; the
 * seller turns them on by hand.
 */
export function initialConsentScopes(requested: readonly AgentScope[]): AgentScope[] {
  if (requested.length === 0) return [...DEFAULT_SCOPES];
  return normalizeScopes(requested.filter((scope) => DEFAULT_SCOPES.includes(scope)));
}

export function hasScope(granted: readonly string[], needed: AgentScope): boolean {
  return granted.includes(needed);
}

export function formatScopes(scopes: readonly string[]): string {
  return scopes.join(" ");
}
