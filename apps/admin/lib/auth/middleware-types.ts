export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  isVerified: boolean;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "admin" | "super_admin" | "moderator";

export interface AdminAuthContext {
  user: AdminUser;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

export interface MiddlewareAuthResult {
  isAuthenticated: boolean;
  user?: AdminUser;
  error?: {
    type:
      | "unauthorized"
      | "insufficient_permissions"
      | "unverified"
      | "no_profile"
      | "middleware_error";
    message: string;
    title: string;
    userRole?: string;
  };
}

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canManageRoles: boolean;
}

export const ADMIN_ROLES: Record<AdminRole, AdminPermissions> = {
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

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/users",
  "/products",
  "/orders",
  "/analytics",
  "/settings",
] as const;

export const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/callback",
  "/auth/unauthorized",
  "/auth/reset-password",
] as const;
