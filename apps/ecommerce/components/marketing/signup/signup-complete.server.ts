import type { User } from "@supabase/supabase-js";
import { ensureSellerAccount, type EnsureSellerAccountResult } from "@workspace/lib/sellers/server";
import { sendStoreCreatedEmail } from "@workspace/lib/orders";
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

  // Seller onboarding mail for the new primary store (best-effort, once per store).
  if (result.data.created && result.data.storeId) await sendStoreCreatedEmail(result.data.storeId);

  // Cache for the storefront proxy and the users.phone trigger; nothing authorizes on it.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { is_seller: true, phone: intent.phone } });
  if (error) console.error("[marketing signup] failed to update user metadata", error.message);

  return { ...result, storeUrl: storeUrl(result.data.subdomain) };
}

/** Choices saved in user_metadata at email signup (confirmation may happen in another browser). */
export function signupIntentFromMetadata(user: Pick<User, "user_metadata">): SignupIntent | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const subdomain = meta.signup_subdomain;
  const phone = meta.phone;
  return typeof subdomain === "string" && typeof phone === "string" ? { subdomain, phone } : null;
}
