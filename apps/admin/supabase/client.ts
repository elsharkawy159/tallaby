import { createBrowserClient } from "@supabase/ssr";
import { getAdminAuthCookieOptions } from "./auth-cookie-options";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getAdminAuthCookieOptions(),
    },
  );
