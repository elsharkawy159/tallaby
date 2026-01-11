import { Hono } from "hono";
import { sendEmail } from "../lib/sender.js";
import { WelcomeEmail } from "@workspace/emails";

const app = new Hono();

app.post("/welcome", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return c.json({ error: "Invalid email address" }, 400);
    }

    if (!name || typeof name !== "string") {
      return c.json({ error: "Invalid name" }, 400);
    }

    await sendEmail({
      to: email,
      subject: "Welcome to our Marketplace 🎉",
      content: WelcomeEmail({
        customerName: name,
        discountCode: "WELCOME10",
        discountPercent: 10,
      }),
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return c.json({ error: "Failed to send welcome email" }, 500);
  }
});

export default app;
