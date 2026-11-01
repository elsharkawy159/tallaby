import { serve } from "@hono/node-server";
import { app } from "./api/hono-app";
import { mcpApp } from "./mcp/http";
import { isMcpPath } from "./vercel-entry";

const port = Number(process.env.PORT) || 4000;

serve(
  {
    fetch: (request) => (isMcpPath(new URL(request.url).pathname) ? mcpApp.fetch(request) : app.fetch(request)),
    port,
  },
  (info) => {
    console.log(`Backend listening on http://localhost:${info.port} (MCP at /mcp)`);
  }
);
