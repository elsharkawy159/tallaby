/**
 * Tallaby's OAuth 2.1 authorization server for MCP assistants (ROADMAP.md
 * F-29b, design note §4): metadata, resource indicators, errors and request
 * parsing shared by the dashboard routes. Pure.
 */
import { AGENT_SCOPES } from "./scopes.lib";
import { isValidCodeChallenge } from "./tokens.lib";

export const DEFAULT_MCP_RESOURCE = "https://mcp.tallaby.com/mcp";

export type OAuthErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "unsupported_response_type"
  | "invalid_scope"
  | "invalid_target"
  | "access_denied"
  | "server_error"
  | "invalid_redirect_uri"
  | "invalid_client_metadata";

export class OAuthError extends Error {
  constructor(
    readonly error: OAuthErrorCode,
    readonly description: string,
    readonly status = 400,
  ) {
    super(description);
    this.name = "OAuthError";
  }

  toJSON() {
    return { error: this.error, error_description: this.description };
  }
}

/** The issuer is the dashboard origin, without a trailing slash. */
export function normalizeIssuer(siteUrl: string | undefined | null): string {
  const value = (siteUrl || "https://dashboard.tallaby.com").trim().replace(/\/+$/, "");
  return value;
}

/** RFC 8414 metadata, advertised at /.well-known/oauth-authorization-server. */
export function authorizationServerMetadata(issuer: string) {
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    revocation_endpoint: `${issuer}/api/oauth/revoke`,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [...AGENT_SCOPES],
    client_id_metadata_document_supported: true,
    service_documentation: "https://tallaby.com",
    ui_locales_supported: ["ar", "en"],
  };
}

function normalizeResource(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) return null;
    if (url.hash || url.username || url.password) return null;
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** `MCP_RESOURCE_URLS` (comma-separated) or the production MCP URL. */
export function parseResourceList(env: string | undefined | null): string[] {
  const values = (env || DEFAULT_MCP_RESOURCE).split(",").map((v) => normalizeResource(v)).filter((v): v is string => !!v);
  return values.length > 0 ? [...new Set(values)] : [DEFAULT_MCP_RESOURCE];
}

/**
 * RFC 8707: a requested `resource` must be one of Tallaby's MCP URLs. Returns
 * the normalized value, null when absent, or throws `invalid_target`.
 */
export function checkResource(resource: string | null | undefined, allowed: readonly string[]): string | null {
  if (resource === null || resource === undefined || resource === "") return null;
  const normalized = normalizeResource(resource);
  if (!normalized || !allowed.includes(normalized)) {
    throw new OAuthError("invalid_target", "Unknown resource.");
  }
  return normalized;
}

export type AuthorizeParams = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
  scope: string | null;
  resource: string | null;
};

type Params = { get(name: string): string | null };

/**
 * The client and redirect checks happen first and separately (an invalid
 * client or redirect must never be redirected to). This parses the rest; the
 * caller redirects its errors back to the client.
 */
export function readAuthorizeClient(params: Params): { clientId: string; redirectUri: string } | null {
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  if (!clientId || !redirectUri || clientId.length > 2000 || redirectUri.length > 2000) return null;
  return { clientId, redirectUri };
}

export function readAuthorizeParams(params: Params): AuthorizeParams {
  const client = readAuthorizeClient(params);
  if (!client) throw new OAuthError("invalid_request", "client_id and redirect_uri are required.");
  if (params.get("response_type") !== "code") {
    throw new OAuthError("unsupported_response_type", "Only response_type=code is supported.");
  }
  const method = params.get("code_challenge_method");
  if (method !== "S256") throw new OAuthError("invalid_request", "PKCE with code_challenge_method=S256 is required.");
  const codeChallenge = params.get("code_challenge");
  if (!isValidCodeChallenge(codeChallenge)) throw new OAuthError("invalid_request", "Invalid code_challenge.");
  const state = params.get("state");
  if (state !== null && state.length > 1000) throw new OAuthError("invalid_request", "state is too long.");
  const scope = params.get("scope");
  if (scope !== null && scope.length > 1000) throw new OAuthError("invalid_scope", "scope is too long.");
  const resource = params.get("resource");
  return { ...client, codeChallenge, state, scope, resource };
}

/** Token endpoint success body (RFC 6749 §5.1). */
export function tokenResponse(input: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: readonly string[];
}) {
  return {
    access_token: input.accessToken,
    token_type: "Bearer",
    expires_in: input.expiresIn,
    refresh_token: input.refreshToken,
    scope: input.scopes.join(" "),
  };
}
