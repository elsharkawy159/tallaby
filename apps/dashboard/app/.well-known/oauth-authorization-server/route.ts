import { authorizationServerMetadata } from "@workspace/lib/agents";
import { oauthIssuer, oauthJson, oauthPreflight } from "@/lib/oauth/oauth-http.server";

export const dynamic = "force-dynamic";

/** RFC 8414 metadata for the MCP OAuth server (ROADMAP.md F-29b). */
export function GET() {
  return oauthJson(authorizationServerMetadata(oauthIssuer()));
}

export function OPTIONS() {
  return oauthPreflight();
}
