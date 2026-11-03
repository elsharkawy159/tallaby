import { cache } from "react";
import { createClient } from "@/supabase/server";

/**
 * The one Supabase Auth call of a render. `auth.getUser()` is a network round
 * trip to Supabase on every call, so layouts, sections and actions read it
 * through here and share it per request (React cache()). Identity only: who may
 * do what stays in require-seller.server.ts and seller-access.ts.
 */
export const getAuthResult = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});

/** The signed-in user, or null. Auth errors read as "not signed in". */
export async function getSessionUser() {
  const { data } = await getAuthResult();
  return data.user ?? null;
}
