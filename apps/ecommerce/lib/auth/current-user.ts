import { cache } from "react";
import { createClient } from "@/supabase/server";
import { db, eq, users } from "@workspace/db";
import type { User } from "@supabase/supabase-js";

/**
 * The raw Supabase auth check, deduplicated across a single render/request
 * via React's cache(). Previously Header, AuthLink (rendered a second time
 * inside BottomNavigation), and several page-level call sites each ran
 * their own independent supabase.auth.getUser() network round-trip — 6+
 * per page load on every route under (main). This collapses all of them
 * into one call per request.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
});

/**
 * Auth user enriched with avatar from the database when available.
 * Used by navbar/profile UI so uploaded avatars show even if auth
 * metadata is stale or missing.
 */
export const getAuthUserForDisplay = cache(async (): Promise<User | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { avatarUrl: true },
    });

    if (!dbUser?.avatarUrl) return user;

    return {
      ...user,
      avatarUrl: dbUser.avatarUrl,
      user_metadata: {
        ...user.user_metadata,
        avatar_url: dbUser.avatarUrl,
      },
    } as User;
  } catch {
    return user;
  }
});
