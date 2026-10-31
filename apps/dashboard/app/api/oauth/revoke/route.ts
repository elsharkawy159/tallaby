import type { NextRequest } from "next/server";
import { revokePresentedToken } from "@workspace/lib/agents/server";
import { oauthErrorResponse, oauthPreflight, rateLimited, readOAuthBody } from "@/lib/oauth/oauth-http.server";

export const dynamic = "force-dynamic";

/** RFC 7009 token revocation for MCP assistants (ROADMAP.md F-29b). Always 200 for unknown tokens. */
export async function POST(request: NextRequest) {
  const limited = rateLimited("revoke", request);
  if (limited) return limited;
  try {
    const body = await readOAuthBody(request);
    if (body.token) await revokePresentedToken({ token: body.token, clientId: body.client_id ?? null });
    return new Response(null, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return oauthErrorResponse(error, "revoke");
  }
}

export function OPTIONS() {
  return oauthPreflight();
}
