import { createClient } from "@/supabase/server";
import type {
  AdminUser,
  AdminRole,
  AdminPermissions,
} from "./middleware-types";
import { getAdminPermissions, hasPermission } from "./middleware-utils";

/**
 * Server-side function to get the current admin user
 * This should be used in Server Components and Server Actions
 */
export const getCurrentAdminUser = async (): Promise<AdminUser> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("id, email, role, isVerified, fullName, createdAt, updatedAt")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile) {
    throw new Error("User profile not found");
  }

  const adminRoles: AdminRole[] = ["admin", "super_admin", "moderator"];
  if (!adminRoles.includes(userProfile.role as AdminRole)) {
    throw new Error("Insufficient permissions");
  }

  if (!userProfile.isVerified) {
    throw new Error("Account not verified");
  }

  return userProfile as AdminUser;
};

/**
 * Server-side function to check if user has specific permission
 */
export const checkAdminPermission = async (
  permission: keyof AdminPermissions
): Promise<boolean> => {
  try {
    const user = await getCurrentAdminUser();
    return hasPermission(user.role, permission);
  } catch {
    return false;
  }
};

/**
 * Server-side function to get admin permissions for current user
 */
export const getCurrentAdminPermissions =
  async (): Promise<AdminPermissions> => {
    const user = await getCurrentAdminUser();
    return getAdminPermissions(user.role);
  };

/**
 * Server-side function to check if user is super admin
 */
export const isSuperAdmin = async (): Promise<boolean> => {
  try {
    const user = await getCurrentAdminUser();
    return user.role === "super_admin";
  } catch {
    return false;
  }
};

/**
 * Server-side function to check if user is admin or higher
 */
export const isAdminOrHigher = async (): Promise<boolean> => {
  try {
    const user = await getCurrentAdminUser();
    return ["admin", "super_admin"].includes(user.role);
  } catch {
    return false;
  }
};

/**
 * Server-side function to validate admin access for specific operations
 */
export const validateAdminAccess = async (
  requiredPermission?: keyof AdminPermissions,
  requiredRole?: AdminRole
): Promise<AdminUser> => {
  const user = await getCurrentAdminUser();

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    throw new Error(`Insufficient permissions: ${requiredPermission} required`);
  }

  if (requiredRole) {
    const roleHierarchy: Record<AdminRole, number> = {
      moderator: 1,
      admin: 2,
      super_admin: 3,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      throw new Error(`Insufficient role: ${requiredRole} required`);
    }
  }

  return user;
};

/**
 * Server-side function to get admin user with optional permission check
 */
export const getAdminUserWithPermission = async (
  permission?: keyof AdminPermissions
): Promise<AdminUser> => {
  return validateAdminAccess(permission);
};

/**
 * Server-side function to check if user can manage other users
 */
export const canManageUsers = async (): Promise<boolean> => {
  return checkAdminPermission("canManageUsers");
};

/**
 * Server-side function to check if user can manage products
 */
export const canManageProducts = async (): Promise<boolean> => {
  return checkAdminPermission("canManageProducts");
};

/**
 * Server-side function to check if user can manage orders
 */
export const canManageOrders = async (): Promise<boolean> => {
  return checkAdminPermission("canManageOrders");
};

/**
 * Server-side function to check if user can manage settings
 */
export const canManageSettings = async (): Promise<boolean> => {
  return checkAdminPermission("canManageSettings");
};

/**
 * Server-side function to check if user can view analytics
 */
export const canViewAnalytics = async (): Promise<boolean> => {
  return checkAdminPermission("canViewAnalytics");
};

/**
 * Server-side function to check if user can manage roles
 */
export const canManageRoles = async (): Promise<boolean> => {
  return checkAdminPermission("canManageRoles");
};
