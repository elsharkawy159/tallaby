import { createBrowserClient } from "@supabase/ssr";
import { getAdminAuthCookieOptions } from "./auth-cookie-options";
import { createTimeoutFetch } from "./fetch-with-timeout";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getAdminAuthCookieOptions(),
      global: { fetch: createTimeoutFetch() },
    },
  );
