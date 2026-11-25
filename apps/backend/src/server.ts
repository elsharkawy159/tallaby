import { serve } from "@hono/node-server";
import { fetch as handle } from "./vercel-entry";
import { dispatchWhatsAppMessages, getWhatsAppConfig } from "@workspace/lib/whatsapp/server";

/**
 * Production Node entry for the self-hosted image (apps/backend/Dockerfile,
 * docs/plans/hetzner-migration.md §6 step 2.1). It serves the same `fetch` as
 * the Vercel function, so routing, the `/` → `/api` redirect and the MCP paths
 * are identical. Vercel keeps building `src/vercel-entry.ts` (scripts/build.mjs).
 */

const port = Number(process.env.PORT) || 3000;
const hostname = "0.0.0.0";

/**
 * Behind the TLS-terminating proxy (Traefik) the socket is plain HTTP, so the
 * request URL would start with `http://`. Vercel hands the app `https://`
 * URLs, and the MCP resource match and the `/` redirect use the URL's origin,
 * so honour the proxy's `X-Forwarded-Proto: https` the way Vercel would.
 */
function withForwardedProto(request: Request): Request {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (proto !== "https" || !request.url.startsWith("http://")) return request;
  return new Request(`https://${request.url.slice("http://".length)}`, request);
}

const server = serve({ fetch: (request) => handle(withForwardedProto(request)), port, hostname }, (info) => {
  console.log(`Backend listening on http://${hostname}:${info.port} (API at /api, MCP at /mcp)`);
});

/**
 * WhatsApp dispatch loop (ROADMAP.md F-109, docs/whatsapp.md §4): every 15 s
 * when WHATSAPP_WORKER=1 and the WhatsApp env is complete; otherwise it never
 * starts. One pass at a time; a pass with Admin's switch off reads one row
 * and sends nothing.
 */
const WHATSAPP_TICK_MS = 15_000;
let whatsAppTimer: NodeJS.Timeout | null = null;
if (process.env.WHATSAPP_WORKER === "1" && getWhatsAppConfig()) {
  let inFlight = false;
  whatsAppTimer = setInterval(() => {
    if (inFlight) return;
    inFlight = true;
    dispatchWhatsAppMessages()
      .catch(() => undefined)
      .finally(() => {
        inFlight = false;
      });
  }, WHATSAPP_TICK_MS);
  whatsAppTimer.unref();
  console.log("WhatsApp worker started");
}

function shutdown(signal: NodeJS.Signals): void {
  console.log(`Backend received ${signal}, closing`);
  if (whatsAppTimer) clearInterval(whatsAppTimer);
  server.close((error) => {
    if (error) {
      console.error("Backend close failed", error);
      process.exit(1);
    }
    process.exit(0);
  });
  // Do not hang on keep-alive sockets: Docker sends SIGKILL after its grace period anyway.
  setTimeout(() => process.exit(0), 10_000).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
