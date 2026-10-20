"use server";

import { headers } from "next/headers";
import { checkStoreSubdomain } from "@workspace/lib/stores/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { SubdomainAvailability } from "./subdomain.dto";

// Per instance, like the dashboard signup check (no shared Redis yet, PLAN.md A4).
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

// No account exists yet on the marketing site; nothing is "owned" by this id.
const NO_SELLER = "00000000-0000-0000-0000-000000000000";

/**
 * Live "is this store link free?" check for the claim forms. Read-only: the
 * store is created later by the dashboard signup, which checks again.
 */
export async function checkSubdomainAvailability(input: string): Promise<SubdomainAvailability> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const value = String(input ?? "").slice(0, 64);
  if (!limiter.check(ip)) return { status: "rateLimited", subdomain: value, suggestions: [] };

  try {
    return await checkStoreSubdomain(NO_SELLER, value);
  } catch (error) {
    console.error("[marketing] subdomain check failed", error);
    return { status: "unknown", subdomain: value, suggestions: [] };
  }
}
