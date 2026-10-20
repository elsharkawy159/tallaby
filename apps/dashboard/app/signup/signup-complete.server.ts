import type { User } from "@supabase/supabase-js";
import { ensureSellerAccount, type EnsureSellerAccountResult } from "@workspace/lib/sellers/server";
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
  user: Pick<User, "id" | "email">,
  intent: SignupIntent,
): Promise<EnsureSellerAccountResult & { storeUrl?: string }> {
  const result = await ensureSellerAccount({
    userId: user.id,
    email: user.email,
    subdomain: intent.subdomain,
    phone: intent.phone,
  });
  if (!result.success) return result;

  await clearSignupIntentCookie();

  // user_metadata is a cache for the storefront proxy (is_seller) and the
  // source the handle_user_update trigger copies users.phone from. Nothing
  // authorizes on it, so a failure is logged, not surfaced.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { is_seller: true, phone: intent.phone } });
  if (error) console.error("[signup] failed to update user metadata", error.message);

  return { ...result, storeUrl: storeUrl(result.data.subdomain) };
}

/** Signup choices saved in user_metadata at email signup (survives a different-browser confirmation). */
export function signupIntentFromMetadata(user: Pick<User, "user_metadata">): SignupIntent | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const subdomain = meta.signup_subdomain;
  const phone = meta.phone;
  return typeof subdomain === "string" && typeof phone === "string" ? { subdomain, phone } : null;
}
