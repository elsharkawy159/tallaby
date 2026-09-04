"use client";

import { useAuthUserContext } from "@/providers/auth-provider";

/**
 * The current viewer for client components.
 *
 * Backed by <AuthProvider>, so every consumer shares one server lookup and they
 * all re-render together when the viewer changes. The previous implementation
 * created its own browser Supabase client per mount, called `auth.getUser()`
 * once and never re-checked — so five components each paid for their own
 * round-trip, and a sign-in performed by a server action left the navbar stuck
 * on its signed-out state until a hard reload.
 */
export function useAuthUser() {
  const { user, isLoading, applyUser, refresh } = useAuthUserContext();
  return { user, isLoading, applyUser, refresh };
}

export { notifyAuthChanged } from "@/providers/auth-provider";
export type { AuthenticatedUserDisplay } from "@/lib/auth/auth-user.types";
