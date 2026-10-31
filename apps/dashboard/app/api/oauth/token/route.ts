import type { NextRequest } from "next/server";
import { OAuthError, tokenResponse } from "@workspace/lib/agents";
import { exchangeAuthorizationCode, refreshAgentTokens } from "@workspace/lib/agents/server";
import { oauthErrorResponse, oauthJson, oauthPreflight, rateLimited, readOAuthBody } from "@/lib/oauth/oauth-http.server";

export const dynamic = "force-dynamic";

/**
 * Token endpoint for MCP assistants (ROADMAP.md F-29b): authorization_code
 * with PKCE, and refresh_token with rotation. Public clients only, so the
 * client is identified by `client_id` in the body (no secret).
 */
export async function POST(request: NextRequest) {
  const limited = rateLimited("token", request);
  if (limited) return limited;
  try {
    const body = await readOAuthBody(request);
    const clientId = body.client_id;
    if (!clientId) throw new OAuthError("invalid_client", "client_id is required.", 401);

    if (body.grant_type === "authorization_code") {
      if (!body.code || !body.redirect_uri || !body.code_verifier) {
        throw new OAuthError("invalid_request", "code, redirect_uri and code_verifier are required.");
      }
      const issued = await exchangeAuthorizationCode({
        code: body.code,
        clientId,
        redirectUri: body.redirect_uri,
        codeVerifier: body.code_verifier,
        resource: body.resource ?? null,
      });
      return oauthJson(tokenResponse(issued));
    }

    if (body.grant_type === "refresh_token") {
      if (!body.refresh_token) throw new OAuthError("invalid_request", "refresh_token is required.");
      const issued = await refreshAgentTokens({ refreshToken: body.refresh_token, clientId });
      return oauthJson(tokenResponse(issued));
    }

    throw new OAuthError("unsupported_grant_type", "Only authorization_code and refresh_token are supported.");
  } catch (error) {
    return oauthErrorResponse(error, "token");
  }
}

export function OPTIONS() {
  return oauthPreflight();
}
