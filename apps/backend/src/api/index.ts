import { handle } from "@hono/node-server/vercel";
import { app } from "./hono-app";

// 🚨 THIS IS THE MOST IMPORTANT LINE
export default handle(app);
