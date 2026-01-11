import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import emails from "./routes/emails.js";
import { internalApiAuth } from "./lib/middleware.js";

const app = new Hono();

// Apply internal API auth middleware to all routes
app.use("*", internalApiAuth());

app.route("/emails", emails);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
