import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import emails from "../src/routes/emails";
import { internalApiAuth } from "../src/lib/middleware";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api");
app.use("/*", cors());

// Homepage (works on Vercel)
app.get("/", (c) => {
  return c.json({
    message: "Welcome to the Multi-Vendor E-commerce API Backend!",
  });
});

// Apply internal API auth middleware to all routes except homepage
app.use("*", async (c, next) => {
  if (c.req.path === "/") {
    return next();
  }
  return internalApiAuth()(c, next);
});

// Routes
app.route("/emails", emails);

// 🚨 THIS IS THE MOST IMPORTANT LINE
export default handle(app);
