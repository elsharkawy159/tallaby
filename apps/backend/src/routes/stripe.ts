import { Hono } from "hono";
import { db, sellers, sellerWallet, eq } from "@workspace/db";
import { stripe } from "@workspace/lib";

const app = new Hono();

app.get("/connect/onboard", async (c) => {
  try {
    const sellerId = c.req.query("sellerId");
    if (!sellerId) {
      return c.json({ error: "Missing sellerId" }, 400);
    }

    const DASHBOARD_URL = process.env.DASHBOARD_URL;

    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await db
      .update(sellers)
      .set({ stripeAccountId: account.id })
      .where(eq(sellers.id, sellerId));

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      return_url:
        DASHBOARD_URL +
        "/onboarding?step=4&stripe=success&seller=" +
        sellerId,
      refresh_url:
        DASHBOARD_URL +
        "/onboarding?step=3&stripe=retry&seller=" +
        sellerId,
      type: "account_onboarding",
    });

    return c.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error creating onboarding link:", error);
    return c.json({ error: "Failed to create onboarding link" }, 500);
  }
});

app.get("/connect/return", async (c) => {
  try {
    const sellerId = c.req.query("seller");
    if (!sellerId) {
      return c.json({ error: "Missing seller" }, 400);
    }

    const DASHBOARD_URL = process.env.DASHBOARD_URL;

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, sellerId),
    });

    if (!seller || !seller.stripeAccountId) {
      return c.json({ error: "Seller not found" }, 400);
    }

    if (seller.stripeOnboardingComplete) {
      return c.redirect(
        DASHBOARD_URL + "/onboarding?step=4&stripe=success"
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(sellers)
        .set({ stripeOnboardingComplete: true })
        .where(eq(sellers.id, sellerId));
      await tx.insert(sellerWallet).values({
        sellerId,
        balance: "0.00",
        currency: "usd",
      });
    });

    return c.redirect(DASHBOARD_URL + "/onboarding?step=4&stripe=success");
  } catch (error) {
    console.error("Error processing onboarding return:", error);
    return c.json({ error: "Failed to process onboarding return" }, 400);
  }
});

app.get("/connect/refresh", async (c) => {
  try {
    const sellerId = c.req.query("seller");
    if (!sellerId) {
      return c.json({ error: "Missing seller" }, 400);
    }

    const DASHBOARD_URL = process.env.DASHBOARD_URL;

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, sellerId),
    });

    if (!seller || !seller.stripeAccountId) {
      return c.json({ error: "Seller not found" }, 400);
    }

    const accountLink = await stripe.accountLinks.create({
      account: seller.stripeAccountId,
      return_url:
        DASHBOARD_URL +
        "/onboarding?step=4&stripe=success&seller=" +
        sellerId,
      refresh_url:
        DASHBOARD_URL +
        "/onboarding?step=3&stripe=retry&seller=" +
        sellerId,
      type: "account_onboarding",
    });

    return c.redirect(accountLink.url);
  } catch (error) {
    console.error("Error refreshing onboarding link:", error);
    return c.json({ error: "Failed to refresh onboarding link" }, 500);
  }
});

export default app;
