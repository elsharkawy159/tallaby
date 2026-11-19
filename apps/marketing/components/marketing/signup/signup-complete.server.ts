import { cookies, headers } from "next/headers";
import { after } from "next/server";
import type { User } from "@supabase/supabase-js";
import { signupMethodOf, signupRequestContext, type SignupMethod } from "@workspace/lib/integrations";
import { sendSignupCapiEvent } from "@workspace/lib/integrations/server";
import { ensureSellerAccount, type EnsureSellerAccountResult } from "@workspace/lib/sellers/server";
import { sendStoreCreatedEmail } from "@workspace/lib/orders";
import { REFERRAL_COOKIE, normalizeReferralCode } from "@workspace/lib/referrals";
import { storeUrl } from "@workspace/lib/storefront";
import { isIntakeId, isIntakeToken } from "@workspace/lib/store-builds";
import { claimStoreBuildIntake } from "@workspace/lib/store-builds/server";
import { DASHBOARD_URL } from "@/lib/marketing/site.lib";
import { hasStoreTrackingConsent, STORE_TRACKING_CONSENT_COOKIE } from "@/lib/storefront-consent";
import { createClient } from "@/supabase/server";
import type { SignupIntent } from "./signup-intent.lib";
import { clearSignupIntentCookie } from "./signup-intent.server";

/**
 * Turns the signed-in user into a seller with a primary store, exactly like
 * apps/dashboard/app/signup/signup-complete.server.ts. NOT a server action:
 * called by the signup actions and the auth callback with the user from
 * `supabase.auth.getUser()`, never with client input.
 */
export async function completeSignup(
  user: Pick<User, "id" | "email" | "app_metadata" | "user_metadata">,
  intent: SignupIntent,
): Promise<EnsureSellerAccountResult & { storeUrl?: string; signup?: SignupMethod; intakeId?: string }> {
  // Affiliate link (F-37): the tallaby_ref cookie, or the copy saved at email signup.
  const referralCode =
    normalizeReferralCode((await cookies()).get(REFERRAL_COOKIE)?.value) ??
    normalizeReferralCode((user.user_metadata as Record<string, unknown> | undefined)?.signup_ref);
  const result = await ensureSellerAccount({
    userId: user.id,
    email: user.email,
    subdomain: intent.subdomain,
    phone: intent.phone,
    referralCode,
  });
  if (!result.success) return result;

  await clearSignupIntentCookie();

  // The hero composer intake (F-82d), bound to the store made just now (an
  // older account gets none: the builder creates or picks one).
  const intakeId = await claimSignupIntake(result.data.sellerId, intent, result.data.created ? result.data.storeId : null);

  // Seller onboarding mail for the new primary store (best-effort, once per store).
  if (result.data.created && result.data.storeId) await sendStoreCreatedEmail(result.data.storeId);

  // Cache for the storefront proxy and the users.phone trigger; nothing authorizes on it.
  const supabase = await createClient();
  // The intake token is single-use: drop the copy kept for email confirmation.
  const { error } = await supabase.auth.updateUser({
    data: { is_seller: true, phone: intent.phone, ...(intent.intakeId ? { store_build_intake: null } : {}) },
  });
  if (error) console.error("[marketing signup] failed to update user metadata", error.message);

  const intakeResult = intakeId ? { intakeId } : {};
  if (!result.data.created) return { ...result, ...intakeResult, storeUrl: storeUrl(result.data.subdomain) };
  // Tallaby's Meta CompleteRegistration (CAPI), once per new account, after
  // the response so signup never waits on Meta. `signup` tells the page that
  // shows the result to fire the matching browser event. Only if the visitor
  // accepted on tallaby.com (F-70a).
  const method = signupMethodOf(user);
  after(async () => {
    const cookieStore = await cookies();
    if (!hasStoreTrackingConsent(cookieStore.get(STORE_TRACKING_CONSENT_COOKIE)?.value)) return;
    const context = signupRequestContext(await headers(), cookieStore);
    await sendSignupCapiEvent({ userId: user.id, email: user.email, phone: intent.phone, method, context });
  });
  return { ...result, ...intakeResult, storeUrl: storeUrl(result.data.subdomain), signup: method };
}

/**
 * Claims the intake the signup carried for `sellerId` (the session seller).
 * Returns its id when it is now the seller's, else null (expired, someone
 * else's, wrong token): signup itself never fails because of it.
 */
export async function claimSignupIntake(
  sellerId: string,
  intent: Pick<SignupIntent, "intakeId" | "intakeToken"> | null,
  storeId: string | null,
): Promise<string | null> {
  if (!intent?.intakeId || !intent.intakeToken) return null;
  try {
    const claim = await claimStoreBuildIntake({ intakeId: intent.intakeId, token: intent.intakeToken, sellerId, storeId });
    if (claim.success) return claim.intakeId;
    console.warn("[marketing signup] intake not claimed", claim.error);
  } catch (error) {
    console.error("[marketing signup] intake claim failed", error instanceof Error ? error.message : error);
  }
  return null;
}

/** The AI Store Builder with the claimed intake. */
export const builderUrlFor = (intakeId: string) => `${DASHBOARD_URL}ai-builder?intake=${intakeId}`;

/** Choices saved in user_metadata at email signup (confirmation may happen in another browser). */
export function signupIntentFromMetadata(user: Pick<User, "user_metadata">): SignupIntent | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const subdomain = meta.signup_subdomain;
  const phone = meta.phone;
  if (typeof subdomain !== "string" || typeof phone !== "string") return null;
  return { subdomain, phone, ...intakeFromMetadata(meta) };
}

/** `user_metadata.store_build_intake` ({ id, token }) written at email signup (F-82d). */
export function intakeFromMetadata(meta: Record<string, unknown> | undefined): Pick<SignupIntent, "intakeId" | "intakeToken"> {
  const raw = meta?.store_build_intake as { id?: unknown; token?: unknown } | null | undefined;
  return raw && isIntakeId(raw.id) && isIntakeToken(raw.token) ? { intakeId: raw.id, intakeToken: raw.token } : {};
}
