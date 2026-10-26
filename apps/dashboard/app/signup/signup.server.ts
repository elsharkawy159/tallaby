"use server";

import { headers } from "next/headers";
import { and, db, eq, sellers, stores } from "@workspace/db";
import { checkStoreSubdomain } from "@workspace/lib/stores/server";
import { createClient } from "@/supabase/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { completeSignup } from "./signup-complete.server";
import { clearSignupIntentCookie, cleanSubdomainPrefill, setSignupPrefillCookie } from "./signup-intent.server";
import {
  emailSignupSchema,
  storeChoiceSchema,
  type SignupErrorKey,
  type SignupResult,
  type StoreChoiceInput,
  type StoreSetupInput,
  type EmailSignupInput,
  type SubdomainCheckResult,
} from "./signup.dto";

/**
 * Minimal seller signup (PLAN.md §6, P2-02 / P2-03). The user id always comes
 * from the Supabase session; the client only sends its choices.
 */

// Per instance (no shared Redis yet, PLAN.md A4).
const checkLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
const signupLimiter = createRateLimiter({ limit: 8, windowMs: 10 * 60_000 });

// Placeholder owner for availability checks before an account exists.
const NO_SELLER = "00000000-0000-0000-0000-000000000000";

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

async function sessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

async function isSeller(userId: string): Promise<boolean> {
  const [row] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, userId)).limit(1);
  return Boolean(row);
}

function siteUrl(origin: string | null): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || origin || "").replace(/\/$/, "");
}

const fail = (error: SignupErrorKey): SignupResult => ({ status: "error", error });

/** Validates the store choice and that the address is free. */
async function checkChoice(input: StoreChoiceInput, ownerId: string) {
  const parsed = storeChoiceSchema.safeParse(input);
  if (!parsed.success) {
    const phoneBad = parsed.error.issues.some((i) => i.path[0] === "phone");
    return { ok: false as const, error: (phoneBad ? "phoneInvalid" : "invalidSubdomain") as SignupErrorKey };
  }
  const check = await checkStoreSubdomain(ownerId, parsed.data.subdomain);
  if (check.status !== "available") {
    return { ok: false as const, error: (check.status === "taken" ? "subdomainTaken" : "invalidSubdomain") as SignupErrorKey };
  }
  return { ok: true as const, intent: parsed.data };
}

/** Live "is this address free?" check for the signup and create-store forms. */
export async function checkSignupSubdomain(input: string): Promise<SubdomainCheckResult> {
  if (!checkLimiter.check(await clientKey())) return { status: "rateLimited", subdomain: input, suggestions: [] };
  const { user } = await sessionUser();
  return checkStoreSubdomain(user?.id ?? NO_SELLER, String(input ?? "").slice(0, 64));
}

/**
 * Step 1, email: only the account (email + password). The store is set up in
 * step 2 on /signup once signed in: right away when Supabase returns a
 * session, else after the confirmation link (the callback finds no seller and
 * no intent and sends the user there).
 */
export async function signUpWithEmail(input: EmailSignupInput): Promise<SignupResult> {
  if (!signupLimiter.check(await clientKey())) return fail("rateLimited");
  const parsed = emailSignupSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const prefill = cleanSubdomainPrefill(parsed.data.subdomain);

  const { supabase } = await sessionUser();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl(origin)}/api/auth/callback?next=/`,
      // Pre-fills step 2 even when the email is confirmed in another browser.
      data: prefill ? { signup_subdomain: prefill } : undefined,
    },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) return fail("emailTaken");
    if (/rate limit/i.test(error.message)) return fail("rateLimited");
    console.error("[signup] signUp failed", error.message);
    return fail("generic");
  }
  // Supabase hides existing emails behind an empty identities list.
  if (data.user && data.user.identities?.length === 0) return fail("emailTaken");

  await startStoreStep(prefill);
  return data.session ? { status: "account_created" } : { status: "confirm_email" };
}

/** Step 1, Google: one click, no fields. The store is set up in step 2 after the callback. */
export async function startGoogleSignup(subdomain?: string): Promise<SignupResult> {
  if (!signupLimiter.check(await clientKey())) return fail("rateLimited");
  await startStoreStep(cleanSubdomainPrefill(subdomain));
  return { status: "ok" };
}

/**
 * A leftover intent cookie (older one-step signup) is cleared so the callback
 * cannot create a store from it; the marketing-site address, if any, is kept
 * to pre-fill step 2.
 */
async function startStoreStep(prefill: string | null) {
  await clearSignupIntentCookie();
  await setSignupPrefillCookie(prefill);
}

/**
 * Signed-in user without a seller row (after Google, or an existing customer):
 * only the store setup step (address, industry, phone).
 */
export async function createStoreForCurrentUser(input: StoreSetupInput): Promise<SignupResult> {
  if (!signupLimiter.check(await clientKey())) return fail("rateLimited");
  const { user } = await sessionUser();
  if (!user) return fail("notSignedIn");
  if (await isSeller(user.id)) return fail("alreadySeller");

  const industry = STORE_INDUSTRIES.find((i) => i.id === input.industry);
  if (!industry) return fail("industryRequired");
  const choice = await checkChoice(input, user.id);
  if (!choice.ok) return fail(choice.error);
  const done = await completeSignup(user, choice.intent);
  if (!done.success) return fail(done.error === "taken" ? "subdomainTaken" : "generic");
  await setSignupPrefillCookie(null);

  // The same columns Store settings › General fills when an industry is picked.
  if (done.data.created && done.data.storeId) {
    await db
      .update(stores)
      .set({ storeCategory: industry.en, storeCategoryAr: industry.ar })
      .where(and(eq(stores.id, done.data.storeId), eq(stores.sellerId, user.id)));
  }
  return { status: "done", storeUrl: done.storeUrl! };
}
