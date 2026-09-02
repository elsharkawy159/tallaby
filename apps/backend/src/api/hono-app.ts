import { Hono } from "hono";
import { cors } from "hono/cors";
import emails from "../routes/emails";
import paymobRoutes from "../routes/paymob";
import webhookRoutes from "../routes/webhooks";
import { internalApiAuth } from "../lib/middleware";

export const app = new Hono().basePath("/api");
app.use("/*", cors());

// Homepage (works on Vercel)
app.get("/", (c) => {
  return c.json({
    message: "Welcome to the Multi-Vendor E-commerce API Backend!",
  });
});

/**
 * Provider webhooks authenticate with their own signatures (Paymob HMAC,
 * Resend/Svix), so they must bypass the shared-secret middleware. `c.req.path`
 * includes the `/api` base path, hence matching on the full route.
 */
const PUBLIC_PATHS = ["/api", "/api/"];
const PUBLIC_PATH_PREFIXES = ["/api/paymob/webhook", "/api/webhooks/"];

// Apply internal API auth middleware to all routes except the homepage and
// signature-verified provider webhooks.
app.use("*", async (c, next) => {
  const path = c.req.path;
  if (
    PUBLIC_PATHS.includes(path) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  ) {
    return next();
  }
  return internalApiAuth()(c, next);
});

// Routes

app.route("/emails", emails);
app.route("/paymob", paymobRoutes);
app.route("/webhooks", webhookRoutes);
