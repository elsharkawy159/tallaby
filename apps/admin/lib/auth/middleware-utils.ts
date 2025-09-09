import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type {
  AdminUser,
  AdminRole,
  MiddlewareAuthResult,
  AdminPermissions,
} from "./middleware-types";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "./middleware-types";

export const ADMIN_ROLES: AdminRole[] = ["admin", "super_admin", "moderator"];

/**
 * Creates a Supabase client for middleware
 */
export const createMiddlewareClient = (request: NextRequest) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // This will be handled by the response
        },
        remove(name: string, options: any) {
          // This will be handled by the response
        },
      },
    }
  );
};

/**
 * Checks if a route is protected
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
};

/**
 * Checks if a route is public (auth-related)
 */
export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
};

/**
 * Checks if a route should be excluded from middleware
 */
export const shouldSkipMiddleware = (pathname: string): boolean => {
  // Skip static files, API routes, and Next.js internals
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  );
};

/**
 * Validates admin role and permissions
 */
export const validateAdminAccess = async (
  supabase: ReturnType<typeof createMiddlewareClient>,
  userId: string
): Promise<MiddlewareAuthResult> => {
  try {
    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id, email, role, isVerified, fullName, createdAt, updatedAt")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      return {
        isAuthenticated: false,
        error: {
          type: "no_profile",
          title: "Profile Not Found",
          message:
            "Your user profile could not be found. Please contact support.",
        },
      };
    }

    // Check if user has admin role
    if (!ADMIN_ROLES.includes(userProfile.role as AdminRole)) {
      return {
        isAuthenticated: false,
        error: {
          type: "insufficient_permissions",
          title: "Access Denied",
          message:
            "You don't have permission to access the admin dashboard. Only administrators can access this area.",
          userRole: userProfile.role,
        },
      };
    }

    // Check if user is verified
    if (!userProfile.isVerified) {
      return {
        isAuthenticated: false,
        error: {
          type: "unverified",
          title: "Account Not Verified",
          message:
            "Your account needs to be verified before accessing the admin dashboard.",
        },
      };
    }

    // Return successful authentication
    return {
      isAuthenticated: true,
      user: userProfile as AdminUser,
    };
  } catch (error) {
    console.error("Admin validation error:", error);
    return {
      isAuthenticated: false,
      error: {
        type: "middleware_error",
        title: "Authentication Error",
        message:
          "An error occurred while verifying your access. Please try again or contact support.",
      },
    };
  }
};

/**
 * Gets admin permissions based on role
 */
export const getAdminPermissions = (role: AdminRole): AdminPermissions => {
  const permissions = {
    super_admin: {
      canManageUsers: true,
      canManageProducts: true,
      canManageOrders: true,
      canManageSettings: true,
      canViewAnalytics: true,
      canManageRoles: true,
    },
    admin: {
      canManageUsers: true,
      canManageProducts: true,
      canManageOrders: true,
      canManageSettings: false,
      canViewAnalytics: true,
      canManageRoles: false,
    },
    moderator: {
      canManageUsers: false,
      canManageProducts: true,
      canManageOrders: true,
      canManageSettings: false,
      canViewAnalytics: true,
      canManageRoles: false,
    },
  };

  return permissions[role];
};

/**
 * Checks if user has specific permission
 */
export const hasPermission = (
  role: AdminRole,
  permission: keyof AdminPermissions
): boolean => {
  const permissions = getAdminPermissions(role);
  return permissions[permission];
};

/**
 * Creates unauthorized redirect URL with error details
 */
export const createUnauthorizedUrl = (
  request: NextRequest,
  error: NonNullable<MiddlewareAuthResult["error"]>
): URL => {
  const url = new URL("/auth/unauthorized", request.url);

  url.searchParams.set("reason", error.type);
  url.searchParams.set("title", error.title);
  url.searchParams.set("message", error.message);

  if (error.userRole) {
    url.searchParams.set("userRole", error.userRole);
  }

  return url;
};

/**
 * Creates login redirect URL with return path
 */
export const createLoginUrl = (request: NextRequest): URL => {
  const url = new URL("/auth/login", request.url);
  url.searchParams.set("redirectTo", request.nextUrl.pathname);
  return url;
};

/**
 * Sets admin headers for downstream use
 */
export const setAdminHeaders = (response: Response, user: AdminUser): void => {
  response.headers.set("X-Admin-Role", user.role);
  response.headers.set("X-Admin-Id", user.id);
  response.headers.set("X-Admin-Verified", user.isVerified ? "true" : "false");
  response.headers.set("X-Admin-Email", user.email);
};
