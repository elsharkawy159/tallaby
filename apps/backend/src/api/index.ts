import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import emails from "../routes/emails";
import stripeRoutes from "../routes/stripe";
import { internalApiAuth } from "../lib/middleware";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api");
app.use("/*", cors());

// Homepage (works on Vercel)
app.get("/", (c) => {
  return c.json({
    message: "Welcome to the Multi-Vendor E-commerce API Backend!",
  });
});

// Apply internal API auth middleware to all routes except homepage and stripe connect
app.use("*", async (c, next) => {
  const path = c.req.path;
  if (path === "/" || path.startsWith("/stripe/connect/")) {
    return next();
  }
  return internalApiAuth()(c, next);
});

// Routes

app.route("/emails", emails);
app.route("/stripe", stripeRoutes);

// 🚨 THIS IS THE MOST IMPORTANT LINE
export default handle(app);
