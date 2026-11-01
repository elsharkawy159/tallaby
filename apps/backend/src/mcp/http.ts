import { Hono } from "hono";
import { cors } from "hono/cors";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { AGENT_SCOPES, bearerToken, normalizeIssuer, parseResourceList } from "@workspace/lib/agents";
import { resolveAgentActor } from "@workspace/lib/agents/server";
import { logServerError } from "@workspace/db/log";
import { createTallabyMcpServer } from "./server";

/**
 * The MCP endpoint (ROADMAP.md F-29c, design note §4) on mcp.tallaby.com:
 * Streamable HTTP, stateless (a new server per request, JSON responses), and
 * OAuth-protected. Tokens come from the dashboard's authorization server
 * (F-29b) and are checked against the database on every request.
 */
export const mcpApp = new Hono();

mcpApp.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["authorization", "content-type", "mcp-protocol-version", "mcp-session-id", "last-event-id"],
    exposeHeaders: ["www-authenticate", "mcp-session-id"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  }),
);

/** This server's resource URL: the request's own /mcp when it is one of Tallaby's, else the first configured. */
function resourceFor(requestUrl: string): string {
  const allowed = parseResourceList(process.env.MCP_RESOURCE_URLS);
  const url = new URL(requestUrl);
  const own = `${url.origin.toLowerCase()}/mcp`;
  return allowed.includes(own) ? own : allowed[0]!;
}

function metadataUrl(resource: string): string {
  const url = new URL(resource);
  return `${url.origin}/.well-known/oauth-protected-resource${url.pathname === "/" ? "" : url.pathname}`;
}

/** RFC 9728 protected-resource metadata: where clients get a token. */
function protectedResource(requestUrl: string) {
  return {
    resource: resourceFor(requestUrl),
    authorization_servers: [normalizeIssuer(process.env.MCP_ISSUER_URL || process.env.DASHBOARD_URL)],
    scopes_supported: [...AGENT_SCOPES],
    bearer_methods_supported: ["header"],
    resource_name: "Tallaby",
    resource_documentation: "https://tallaby.com",
  };
}

mcpApp.get("/.well-known/oauth-protected-resource", (c) => c.json(protectedResource(c.req.url)));
mcpApp.get("/.well-known/oauth-protected-resource/mcp", (c) => c.json(protectedResource(c.req.url)));

function unauthorized(requestUrl: string, error?: "invalid_token") {
  const resource = resourceFor(requestUrl);
  const parts = [`resource_metadata="${metadataUrl(resource)}"`];
  if (error) parts.push(`error="${error}"`, `error_description="The access token is invalid, expired or revoked."`);
  return new Response(JSON.stringify({ error: error ?? "unauthorized", error_description: "Connect Tallaby to get an access token." }), {
    status: 401,
    headers: { "content-type": "application/json", "www-authenticate": `Bearer ${parts.join(", ")}` },
  });
}

mcpApp.all("/mcp", async (c) => {
  const token = bearerToken(c.req.header("authorization"));
  if (!token) return unauthorized(c.req.url);

  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || null;
  const actor = await resolveAgentActor(token, { ip: forwarded, userAgent: c.req.header("user-agent") ?? null });
  if (!actor) return unauthorized(c.req.url, "invalid_token");

  // Stateless: no sessions to resume or close, and no server-to-client stream.
  if (c.req.method !== "POST") {
    return c.json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }, 405, { allow: "POST" });
  }

  const server = createTallabyMcpServer(actor);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    return await transport.handleRequest(c.req.raw);
  } catch (error) {
    logServerError("integration", "mcp request failed", { grantId: actor.grantId }, error);
    return c.json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error." }, id: null }, 500);
  } finally {
    // JSON responses are complete once handleRequest returns.
    void server.close().catch(() => undefined);
  }
});
