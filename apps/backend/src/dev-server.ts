import { serve } from "@hono/node-server";
import { app } from "./api/hono-app";

const port = Number(process.env.PORT) || 4000;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Backend listening on http://localhost:${info.port}`);
  }
);
