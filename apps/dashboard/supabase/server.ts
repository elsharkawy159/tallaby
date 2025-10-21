"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  const hostname = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const isDevelopment = process.env.NODE_ENV === "development";

  const cookieDomain = isDevelopment ? "localhost" : `.${hostname}`;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                domain: cookieDomain,
                sameSite: isDevelopment ? "strict" : "lax",
                secure: !isDevelopment,
                httpOnly: !isDevelopment,
              });
            });
          } catch (error) {
            console.error(error);

            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
