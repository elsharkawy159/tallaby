import { cache } from "react";
import { createClient } from "@/supabase/server";

export interface ShippingUser {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * The authenticated user's shipping profile, or null when signed out.
 *
 * Wrapped in React `cache()` so a request performs one Supabase auth
 * round-trip regardless of how many components or actions ask for it.
 */
export const getShippingUser = cache(async (): Promise<ShippingUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Aliased selectors: PostgREST queries literal snake_case column names.
  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, email, role, fullName:full_name, phone, isVerified:is_verified, isSuspended:is_suspended"
    )
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    role: profile.role,
    isVerified: profile.isVerified ?? false,
    isSuspended: profile.isSuspended ?? false,
  };
});

/**
 * Guard for every admin-side page and server action. The proxy already
 * redirects, but authorization is enforced here — the proxy can be bypassed by
 * a direct server-action POST, and Drizzle connects as the database owner so
 * RLS is not a boundary either.
 */
export async function requireShippingAdmin(): Promise<ShippingUser> {
  const user = await getShippingUser();

  if (!user) throw new UnauthorizedError("Not authenticated");
  if (user.isSuspended) throw new UnauthorizedError("Account suspended");
  if (user.role !== "admin") throw new UnauthorizedError("Insufficient permissions");
  if (!user.isVerified) throw new UnauthorizedError("Account not verified");

  return user;
}

/**
 * Guard for the rider surface. Callers must additionally scope every query and
 * mutation by the returned `id` — a rider id is never accepted from the client.
 */
export async function requireRider(): Promise<ShippingUser> {
  const user = await getShippingUser();

  if (!user) throw new UnauthorizedError("Not authenticated");
  if (user.isSuspended) throw new UnauthorizedError("Account suspended");
  if (user.role !== "driver") throw new UnauthorizedError("Not a rider account");

  return user;
}
