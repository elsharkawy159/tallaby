import { cache } from "react";
import { createClient } from "@/supabase/server";

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
