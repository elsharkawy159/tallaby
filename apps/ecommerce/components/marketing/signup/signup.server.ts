"use server";

import { cookies, headers } from "next/headers";
import { signupEventId } from "@workspace/lib/integrations";
import { REFERRAL_COOKIE, normalizeReferralCode } from "@workspace/lib/referrals";
import { signupInputSchema } from "@workspace/lib/sellers";
import { checkStoreSubdomain } from "@workspace/lib/stores/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { SITE_URL } from "@/lib/marketing/site.lib";
import { createClient } from "@/supabase/server";
import { completeSignup } from "./signup-complete.server";
import { clearSignupIntentCookie, setSignupIntentCookie } from "./signup-intent.server";
import { emailSignupSchema, type EmailSignupInput, type SignupErrorKey, type SignupResult, type StoreChoiceInput } from "./signup.dto";

/**
 * Seller signup from the marketing site (PLAN.md §6). Same flow and checks as
 * apps/dashboard/app/signup/signup.server.ts: the user id always comes from
 * the Supabase session, the client only sends its choices.
 */

// Per instance (no shared Redis yet, PLAN.md A4).
const signupLimiter = createRateLimiter({ limit: 8, windowMs: 10 * 60_000 });

const NO_SELLER = "00000000-0000-0000-0000-000000000000";
const fail = (error: SignupErrorKey): SignupResult => ({ status: "error", error });

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

async function checkChoice(input: StoreChoiceInput) {
  const parsed = signupInputSchema.safeParse(input);
  if (!parsed.success) {
    const phoneBad = parsed.error.issues.some((i) => i.path[0] === "phone");
    return { ok: false as const, error: (phoneBad ? "phoneInvalid" : "invalidSubdomain") as SignupErrorKey };
  }
  const check = await checkStoreSubdomain(NO_SELLER, parsed.data.subdomain);
  if (check.status !== "available") {
    return { ok: false as const, error: (check.status === "taken" ? "subdomainTaken" : "invalidSubdomain") as SignupErrorKey };
  }
  return { ok: true as const, intent: parsed.data };
}

/** Email + password. Creates the store now if Supabase returns a session, else after confirmation. */
export async function signUpWithEmail(input: EmailSignupInput): Promise<SignupResult> {
  if (!signupLimiter.check(await clientKey())) return fail("rateLimited");
  const parsed = emailSignupSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");

  const choice = await checkChoice(parsed.data);
  if (!choice.ok) return fail(choice.error);

  const supabase = await createClient();
  // Keeps the affiliate link (F-37) when the email is confirmed in another browser.
  const ref = normalizeReferralCode((await cookies()).get(REFERRAL_COOKIE)?.value);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // This site handles the confirmation link (it holds the intent cookie).
      emailRedirectTo: `${(await headers()).get("origin") ?? SITE_URL}/api/auth/signup-callback`,
      data: { signup_subdomain: choice.intent.subdomain, phone: choice.intent.phone, ...(ref ? { signup_ref: ref } : {}) },
    },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) return fail("emailTaken");
    if (/rate limit/i.test(error.message)) return fail("rateLimited");
    console.error("[marketing signup] signUp failed", error.message);
    return fail("generic");
  }
  // Supabase hides existing emails behind an empty identities list.
  if (data.user && data.user.identities?.length === 0) return fail("emailTaken");

  try {
    await setSignupIntentCookie(choice.intent);
  } catch (e) {
    console.error("[marketing signup] cannot sign intent cookie (SIGNUP_INTENT_SECRET?)", e);
  }

  if (!data.session || !data.user) return { status: "confirm_email" };
  const done = await completeSignup(data.user, choice.intent);
  if (!done.success) return fail(done.error === "taken" ? "subdomainTaken" : "generic");
  return {
    status: "done",
    storeUrl: done.storeUrl!,
    subdomain: done.data.subdomain,
    signupEvent: done.signup ? { id: signupEventId(data.user.id), method: done.signup } : undefined,
  };
}

// Resends are cheap to abuse (each one is an email): 3 per 10 minutes per IP.
const resendLimiter = createRateLimiter({ limit: 3, windowMs: 10 * 60_000 });

/**
 * "Check your email" › Resend. Same redirect as `signUpWithEmail`, so the link
 * still lands on this site's callback, which holds the intent cookie.
 */
export async function resendSignupConfirmation(email: string): Promise<{ error: SignupErrorKey | null }> {
  if (!resendLimiter.check(await clientKey())) return { error: "rateLimited" };
  const parsed = emailSignupSchema.shape.email.safeParse(String(email ?? "").trim());
  if (!parsed.success) return { error: "invalidInput" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${(await headers()).get("origin") ?? SITE_URL}/api/auth/signup-callback` },
  });
  if (error) return { error: /rate limit/i.test(error.message) ? "rateLimited" : "generic" };
  return { error: null };
}

/**
 * Google only signs the user in; the store is chosen afterwards in the
 * dashboard signup (the callback finds no intent and sends the user there).
 * Clears any intent left by an earlier email attempt so it isn't reused.
 */
export async function startGoogleSignup(): Promise<SignupResult> {
  if (!signupLimiter.check(await clientKey())) return fail("rateLimited");
  await clearSignupIntentCookie();
  return { status: "ok" };
}
