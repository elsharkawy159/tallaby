import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import emails from "./routes/emails.js";
import { internalApiAuth } from "./lib/middleware.js";

const app = new Hono();

// Add a homepage route with a welcome message
app.get("/", (c) => {
  return c.json({ message: "Welcome to the Multi-Vendor E-commerce API Backend!" });
});

// Apply internal API auth middleware to all routes except homepage
app.use("*", (c, next) => {
  if (c.req.path === "/") {
    return next();
  }
  return internalApiAuth()(c, next);
});

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
