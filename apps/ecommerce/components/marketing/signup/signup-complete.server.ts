import { cookies, headers } from "next/headers";
import { after } from "next/server";
import type { User } from "@supabase/supabase-js";
import { signupMethodOf, signupRequestContext, type SignupMethod } from "@workspace/lib/integrations";
import { sendSignupCapiEvent } from "@workspace/lib/integrations/server";
import { ensureSellerAccount, type EnsureSellerAccountResult } from "@workspace/lib/sellers/server";
import { sendStoreCreatedEmail } from "@workspace/lib/orders";
import { REFERRAL_COOKIE, normalizeReferralCode } from "@workspace/lib/referrals";
import { storeUrl } from "@workspace/lib/storefront";
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
): Promise<EnsureSellerAccountResult & { storeUrl?: string; signup?: SignupMethod }> {
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

  // Seller onboarding mail for the new primary store (best-effort, once per store).
  if (result.data.created && result.data.storeId) await sendStoreCreatedEmail(result.data.storeId);

  // Cache for the storefront proxy and the users.phone trigger; nothing authorizes on it.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { is_seller: true, phone: intent.phone } });
  if (error) console.error("[marketing signup] failed to update user metadata", error.message);

  if (!result.data.created) return { ...result, storeUrl: storeUrl(result.data.subdomain) };
  // Tallaby's Meta CompleteRegistration (CAPI), once per new account, after
  // the response so signup never waits on Meta. `signup` tells the page that
  // shows the result to fire the matching browser event.
  const method = signupMethodOf(user);
  after(async () => {
    const context = signupRequestContext(await headers(), await cookies());
    await sendSignupCapiEvent({ userId: user.id, email: user.email, phone: intent.phone, method, context });
  });
  return { ...result, storeUrl: storeUrl(result.data.subdomain), signup: method };
}

/** Choices saved in user_metadata at email signup (confirmation may happen in another browser). */
export function signupIntentFromMetadata(user: Pick<User, "user_metadata">): SignupIntent | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const subdomain = meta.signup_subdomain;
  const phone = meta.phone;
  return typeof subdomain === "string" && typeof phone === "string" ? { subdomain, phone } : null;
}
