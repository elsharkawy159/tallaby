import type { NextRequest } from "next/server";
import { OAuthError, parseRegistrationRequest, registrationResponse } from "@workspace/lib/agents";
import { registerDcrClient } from "@workspace/lib/agents/server";
import { oauthErrorResponse, oauthJson, oauthPreflight, rateLimited } from "@/lib/oauth/oauth-http.server";

export const dynamic = "force-dynamic";

/**
 * Dynamic Client Registration (RFC 7591) for MCP assistants (ROADMAP.md
 * F-29b). Open by design (Claude and ChatGPT register themselves); a client
 * alone grants nothing until a seller approves it on the consent page.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimited("register", request);
  if (limited) return limited;
  try {
    const text = await request.text();
    if (text.length > 16_384) throw new OAuthError("invalid_client_metadata", "Request body is too large.");
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new OAuthError("invalid_client_metadata", "Body must be JSON.");
    }
    const parsed = parseRegistrationRequest(body);
    if (!parsed.ok) throw new OAuthError(parsed.error, parsed.description);
    const client = await registerDcrClient(parsed.metadata);
    return oauthJson(registrationResponse(client.clientId, parsed.metadata, new Date()), 201);
  } catch (error) {
    return oauthErrorResponse(error, "register");
  }
}

export function OPTIONS() {
  return oauthPreflight();
}
