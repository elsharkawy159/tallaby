import type { CookieOptions } from "@supabase/ssr";

const getSupabaseProjectRef = (): string => {
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  if (projectId) {
    return projectId;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PROJECT_ID is required for admin auth cookies",
    );
  }

  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!match?.[1]) {
    throw new Error("Could not derive Supabase project ref from NEXT_PUBLIC_SUPABASE_URL");
  }

  return match[1];
};

export const getAdminAuthCookieName = (): string =>
  process.env.NEXT_PUBLIC_SUPABASE_ADMIN_AUTH_COOKIE_NAME ??
  `sb-${getSupabaseProjectRef()}-admin-auth-token`;

export const getAdminAuthCookieOptions = (): CookieOptions & { name: string } => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    name: getAdminAuthCookieName(),
    path: "/",
    sameSite: "lax",
    secure: isProduction,
    httpOnly: isProduction,
  };
};

export const mergeAdminAuthCookieOptions = (
  options?: CookieOptions,
): CookieOptions => {
  const adminOptions = getAdminAuthCookieOptions();

  return {
    ...options,
    path: adminOptions.path,
    sameSite: adminOptions.sameSite,
    secure: adminOptions.secure,
    httpOnly: adminOptions.httpOnly,
  };
};
