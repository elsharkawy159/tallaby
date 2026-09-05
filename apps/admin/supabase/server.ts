import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getAdminAuthCookieOptions,
  mergeAdminAuthCookieOptions,
} from "./auth-cookie-options";
import { createTimeoutFetch } from "./fetch-with-timeout";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getAdminAuthCookieOptions(),
      global: { fetch: createTimeoutFetch() },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, mergeAdminAuthCookieOptions(options));
            });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
