import { db, eq, sellers } from "@workspace/db";
import { parseSignupMethod, signupEventId } from "@workspace/lib/integrations";
import { createClient } from "@/supabase/server";
import { SignupPixel } from "./signup-pixel.client";

// A hand-typed `?signup=` on an old account must not count as a signup.
const NEW_ACCOUNT_MS = 60 * 60_000;

/**
 * Tallaby's Meta CompleteRegistration on the first dashboard visit after
 * signup (`/?welcome=1&signup=email|google`, set by the server only when the
 * account was just created). Renders nothing otherwise.
 */
export async function SignupPixelData({ signup }: { signup: unknown }) {
  const method = parseSignupMethod(signup);
  if (!method || !process.env.NEXT_PUBLIC_META_PIXEL_ID) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const [seller] = await db
    .select({ createdAt: sellers.createdAt })
    .from(sellers)
    .where(eq(sellers.id, user.id))
    .limit(1);
  if (!seller?.createdAt || Date.now() - new Date(seller.createdAt).getTime() > NEW_ACCOUNT_MS) return null;

  const phone = (user.user_metadata as Record<string, unknown> | undefined)?.phone;
  return (
    <SignupPixel
      eventId={signupEventId(user.id)}
      method={method}
      email={user.email ?? null}
      phone={typeof phone === "string" ? phone : null}
    />
  );
}
