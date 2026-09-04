"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const hostname = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const isDevelopment = process.env.NODE_ENV === "development";
  const cookieDomain = isDevelopment ? null : `.${hostname}`;

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
              // Omit `domain` in development — an empty string is invalid and
              // can cause the browser to drop the session cookie entirely.
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
                // Must survive a cross-site navigation (OAuth return). `strict`
                // withheld cookies on the return leg and left the UI signed-out.
                sameSite: "lax",
                secure: !isDevelopment,
              });
            });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if we have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
