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
 * Turns the signed-in user into a seller with a primary store (P2-03). NOT a
 * server action: it is called by the signup actions and the auth callback,
 * always with the user from `supabase.auth.getUser()`, never from the client.
 */
export async function completeSignup(
  user: Pick<User, "id" | "email" | "app_metadata" | "user_metadata">,
  intent: SignupIntent,
): Promise<EnsureSellerAccountResult & { storeUrl?: string; signup?: SignupMethod }> {
  // Affiliate link (F-37): the tallaby_ref cookie, or the copy saved at email
  // signup when the link is confirmed in another browser.
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

  // user_metadata is a cache for the storefront proxy (is_seller) and the
  // source the handle_user_update trigger copies users.phone from. Nothing
  // authorizes on it, so a failure is logged, not surfaced.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { is_seller: true, phone: intent.phone } });
  if (error) console.error("[signup] failed to update user metadata", error.message);

  if (!result.data.created) return { ...result, storeUrl: storeUrl(result.data.subdomain) };
  // Tallaby's Meta CompleteRegistration (CAPI), once per new account, after
  // the response so signup never waits on Meta. `signup` tells the welcome
  // page to fire the matching browser event.
  const method = signupMethodOf(user);
  after(async () => {
    const context = signupRequestContext(await headers(), await cookies());
    await sendSignupCapiEvent({ userId: user.id, email: user.email, phone: intent.phone, method, context });
  });
  return { ...result, storeUrl: storeUrl(result.data.subdomain), signup: method };
}

/** Signup choices saved in user_metadata at email signup (survives a different-browser confirmation). */
export function signupIntentFromMetadata(user: Pick<User, "user_metadata">): SignupIntent | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const subdomain = meta.signup_subdomain;
  const phone = meta.phone;
  return typeof subdomain === "string" && typeof phone === "string" ? { subdomain, phone } : null;
}
