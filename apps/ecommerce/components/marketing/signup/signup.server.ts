"use server";

import { cookies, headers } from "next/headers";
import { signupEventId } from "@workspace/lib/integrations";
import { REFERRAL_COOKIE, normalizeReferralCode } from "@workspace/lib/referrals";
import { signupInputSchema } from "@workspace/lib/sellers";
import { checkStoreSubdomain } from "@workspace/lib/stores/server";
import { isStoreBuildIntakeOpen } from "@workspace/lib/store-builds/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { SITE_URL } from "@/lib/marketing/site.lib";
import { createClient } from "@/supabase/server";
import { builderUrlFor, completeSignup } from "./signup-complete.server";
import { clearSignupIntentCookie, setSignupHintCookie, setSignupIntentCookie } from "./signup-intent.server";
import { cleanPlanHint } from "./signup-hint.lib";
import type { SignupIntent } from "./signup-intent.lib";
import {
  emailSignupSchema,
  type EmailSignupInput,
  type SignupErrorKey,
  type SignupIntakeRef,
  type SignupResult,
  type StoreChoiceInput,
} from "./signup.dto";

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

/**
 * The hero composer intake (F-82d) joins the signup only when its token opens
 * an unclaimed, unexpired intake; a bad one is dropped, never an error.
 */
async function withIntake(intent: StoreChoiceInput, intake: SignupIntakeRef | null | undefined): Promise<SignupIntent> {
  if (!intake) return intent;
  const open = await isStoreBuildIntakeOpen(intake).catch(() => false);
  return open ? { ...intent, intakeId: intake.intakeId, intakeToken: intake.token } : intent;
}

/**
 * Email + password. Creates the store now if Supabase returns a session, else after confirmation.
 * `plan`: the Pro button's hint, only where the seller lands afterwards (the Plans page).
 */
export async function signUpWithEmail(
  input: EmailSignupInput,
  intake?: SignupIntakeRef | null,
  plan?: unknown,
): Promise<SignupResult> {
  if (!signupLimiter.check(await clientKey())) return fail("rateLimited");
  const parsed = emailSignupSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");

  const choice = await checkChoice(parsed.data);
  if (!choice.ok) return fail(choice.error);
  const intent = await withIntake(choice.intent, intake);
  const planHint = cleanPlanHint(plan);

  const supabase = await createClient();
  // Keeps the affiliate link (F-37) when the email is confirmed in another browser.
  const ref = normalizeReferralCode((await cookies()).get(REFERRAL_COOKIE)?.value);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // This site handles the confirmation link (it holds the intent cookie).
      emailRedirectTo: `${(await headers()).get("origin") ?? SITE_URL}/api/auth/signup-callback`,
      data: {
        signup_subdomain: intent.subdomain,
        phone: intent.phone,
        ...(ref ? { signup_ref: ref } : {}),
        // Only a landing hint for the confirmation callback (another browser has no cookie).
        ...(planHint ? { signup_plan: planHint } : {}),
        // Confirmation may happen in another browser, without the cookie.
        ...(intent.intakeId ? { store_build_intake: { id: intent.intakeId, token: intent.intakeToken } } : {}),
      },
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
    await setSignupIntentCookie(intent);
  } catch (e) {
    console.error("[marketing signup] cannot sign intent cookie (SIGNUP_INTENT_SECRET?)", e);
  }
  await setSignupHintCookie(planHint ? { plan: planHint } : null);

  if (!data.session || !data.user) return { status: "confirm_email" };
  const done = await completeSignup(data.user, intent);
  if (!done.success) return fail(done.error === "taken" ? "subdomainTaken" : "generic");
  return {
    status: "done",
    storeUrl: done.storeUrl!,
    subdomain: done.data.subdomain,
    signupEvent: done.signup ? { id: signupEventId(data.user.id), method: done.signup } : undefined,
    builderUrl: done.intakeId ? builderUrlFor(done.intakeId) : undefined,
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
 * Before the Google redirect. When the dialog already holds a valid store
 * address and phone, they (and the hero intake, F-82d) go into the signed
 * intent cookie, so the callback creates the store and claims the intake.
 * Before F-82d this always cleared the cookie and lost both. With nothing
 * typed, any older intent is cleared and the dashboard signup asks for the
 * store, as before. A hero intake needs the address and phone first, so it
 * can't be lost on the way. An address typed without a valid phone is kept
 * in the hint cookie and pre-filled on the dashboard's store step (checked
 * there again like a typed one), and `plan: "pro"` sends the new seller to
 * the Plans page.
 */
export async function startGoogleSignup(
  choice?: Partial<StoreChoiceInput> | null,
  intake?: SignupIntakeRef | null,
  plan?: unknown,
): Promise<SignupResult> {
  if (!signupLimiter.check(await clientKey())) return fail("rateLimited");
  const planHint = cleanPlanHint(plan);
  const typed = Boolean(choice?.subdomain || choice?.phone || intake);
  const checked = typed
    ? await checkChoice({ subdomain: String(choice?.subdomain ?? ""), phone: String(choice?.phone ?? "") })
    : null;
  if (!checked?.ok) {
    if (intake && checked) return fail(checked.error);
    await clearSignupIntentCookie();
    await setSignupHintCookie({ subdomain: choice?.subdomain, plan: planHint });
    return { status: "ok" };
  }
  try {
    await setSignupIntentCookie(await withIntake(checked.intent, intake));
  } catch (e) {
    console.error("[marketing signup] cannot sign intent cookie (SIGNUP_INTENT_SECRET?)", e);
  }
  await setSignupHintCookie(planHint ? { plan: planHint } : null);
  return { status: "ok" };
}
