import { authorizationServerMetadata } from "@workspace/lib/agents";
import { connection } from "next/server";
import { oauthIssuer, oauthJson, oauthPreflight } from "@/lib/oauth/oauth-http.server";

/** RFC 8414 metadata for the MCP OAuth server (ROADMAP.md F-29b). */
export async function GET() {
  // Reads no request data, so without this Cache Components would prerender
  // it at build and freeze the issuer of that build's environment.
  await connection();
  return oauthJson(authorizationServerMetadata(oauthIssuer()));
}

export function OPTIONS() {
  return oauthPreflight();
}
