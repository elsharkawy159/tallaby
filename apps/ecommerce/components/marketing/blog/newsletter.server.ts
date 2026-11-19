"use server";

import { headers } from "next/headers";
import { db, newsletterSubscribers, sql } from "@workspace/db";
import { createRateLimiter } from "@workspace/lib/http/rate-limit";
import { newsletterSchema, type NewsletterInput, type NewsletterResult } from "./newsletter.dto";
import { getClientIp } from "@workspace/lib/http/client-ip";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

/**
 * Adds an address to `newsletter_subscribers` (0072). Signing up again
 * re-subscribes it. The answer is the same whether or not the address was
 * already on the list, so the form cannot be used to test addresses.
 */
export async function subscribeToNewsletter(input: NewsletterInput): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  // Bots that fill the hidden field get a success without a row.
  if (parsed.data.website) return { ok: true };

  const h = await headers();
  const ip = getClientIp(h) ?? "unknown";
  if (!limiter.check(ip)) return { ok: false, error: "rateLimited" };

  const email = parsed.data.email.trim().toLowerCase();
  try {
    await db
      .insert(newsletterSubscribers)
      .values({ email, locale: parsed.data.locale, source: "blog" })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { status: "subscribed", unsubscribedAt: null, updatedAt: sql`now()` },
      });
    return { ok: true };
  } catch (error) {
    console.error("[marketing] newsletter insert failed", error);
    return { ok: false, error: "generic" };
  }
}
