import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import { sendEmail } from "../src/lib/sender"; // No .js extension!
import { WelcomeEmail } from "@workspace/emails";

const app = new Hono();

// Root
app.get("/", (c) => {
  return c.json({ message: "API Running" });
});

// Define route inline with /api prefix
app.post("/api/emails/welcome", async (c) => {
  // Your existing email logic here
  const { email, name } = await c.req.json();
  
  await sendEmail({
    to: email,
    subject: "Welcome!",
    content: WelcomeEmail({ customerName: name }),
  });
  
  return c.json({ success: true });
});

export default handle(app);