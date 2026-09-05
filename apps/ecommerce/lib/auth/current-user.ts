import { cache } from "react";
import { createClient } from "@/supabase/server";
import { db, eq, users, sellers } from "@workspace/db";
import { pickAvatarSource } from "@/lib/auth/avatar";
import type { AuthenticatedUserDisplay } from "@/lib/auth/auth-user.types";

/**
 * The raw Supabase auth check, deduplicated across a single render/request
 * via React's cache(). Previously Header, AuthLink (rendered a second time
 * inside BottomNavigation), and several page-level call sites each ran
 * their own independent supabase.auth.getUser() network round-trip — 6+
 * per page load on every route under (main). This collapses all of them
 * into one call per request.
 *
 * getUser() (not getSession()) is deliberate: it revalidates the token with
 * the Auth server, so the identity it returns is safe to authorize against.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
});

/**
 * The canonical authenticated-user projection for UI.
 *
 * Joins the two records that describe a signed-in person — the Supabase Auth
 * user and the application's `users` profile row — into one flat, explicitly
 * typed display model. This replaces the previous helper, which spread custom
 * `avatarUrl`/metadata properties onto a Supabase `User` and cast the result
 * with `as User`; that lied to the type system and produced an object that was
 * neither a real auth user nor a real profile.
 *
 * cache()d alongside getAuthUser(), so a request that renders several
 * auth-aware components pays for at most one auth call and one profile query.
 */
export const getAuthUserDisplay =
  cache(async (): Promise<AuthenticatedUserDisplay | null> => {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const metadata = authUser.user_metadata ?? {};
    const metadataAvatar =
      typeof metadata.avatar_url === "string"
        ? metadata.avatar_url
        : typeof metadata.picture === "string"
          ? metadata.picture
          : null;

    // A claimed seller still has to have an approved seller row before the UI
    // offers dashboard links, matching checkIfSeller()'s rule.
    const claimsSeller = metadata.is_seller === true;

    try {
      const [profile, sellerRow] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, authUser.id),
          columns: { avatarUrl: true, fullName: true, email: true },
        }),
        claimsSeller
          ? db.query.sellers.findFirst({
              where: eq(sellers.id, authUser.id),
              columns: { status: true },
            })
          : Promise.resolve(undefined),
      ]);

      return {
        id: authUser.id,
        email: profile?.email ?? authUser.email ?? null,
        name: resolveDisplayName(profile?.fullName, metadata),
        avatarUrl: pickAvatarSource(profile?.avatarUrl, metadataAvatar),
        isSeller: sellerRow?.status === "approved",
      };
    } catch {
      // The profile lookup is an enrichment, not an authorization step. If the
      // database is unreachable the viewer is still authenticated, so fall back
      // to auth metadata rather than rendering them as signed out.
      return {
        id: authUser.id,
        email: authUser.email ?? null,
        name: resolveDisplayName(null, metadata),
        avatarUrl: pickAvatarSource(null, metadataAvatar),
        isSeller: false,
      };
    }
  });

function resolveDisplayName(
  profileFullName: string | null | undefined,
  metadata: Record<string, unknown>
): string | null {
  const candidates = [
    profileFullName,
    metadata.fullName,
    metadata.full_name,
    metadata.name,
    joinNameParts(metadata.firstName, metadata.lastName),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function joinNameParts(first: unknown, last: unknown): string {
  const firstPart = typeof first === "string" ? first : "";
  const lastPart = typeof last === "string" ? last : "";
  return `${firstPart} ${lastPart}`.trim();
}
