"use server";

import { headers } from "next/headers";
import { contacts, db } from "@workspace/db";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { contactSchema, type ContactInput, type ContactResult } from "./contact.dto";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

/**
 * Stores a contact-page message in `contacts`, the same table the
 * marketplace contact form and the admin inbox use.
 */
export async function submitContactMessage(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!limiter.check(ip)) return { ok: false, error: "rateLimited" };

  const { role, topic, fullName, email, storeLink, message } = parsed.data;
  const store = role === "seller" && storeLink ? `\n\nStore: ${storeLink}.tallaby.com` : "";

  try {
    await db.insert(contacts).values({
      fullName,
      email,
      subject: `[tallaby.com · ${role}] ${topic}`,
      message: `${message}${store}`,
    });
    return { ok: true };
  } catch (error) {
    console.error("[marketing] contact insert failed", error);
    return { ok: false, error: "generic" };
  }
}
