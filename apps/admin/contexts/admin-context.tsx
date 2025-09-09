"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import type { AdminUser, AdminPermissions } from "@/lib/auth/middleware-types";

interface AdminContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: AdminPermissions | null;
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  refreshUser: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const adminAuth = useAdminAuth();

  return (
    <AdminContext.Provider value={adminAuth}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);

  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }

  return context;
};

// Convenience hooks for specific permissions
export const useAdminPermissions = () => {
  const { permissions, hasPermission } = useAdmin();
  return { permissions, hasPermission };
};

export const useAdminUser = () => {
  const { user, isLoading, isAuthenticated } = useAdmin();
  return { user, isLoading, isAuthenticated };
};

// Permission-specific hooks
export const useCanManageUsers = () => {
  const { hasPermission } = useAdmin();
  return hasPermission("canManageUsers");
};

export const useCanManageProducts = () => {
  const { hasPermission } = useAdmin();
  return hasPermission("canManageProducts");
};

export const useCanManageOrders = () => {
  const { hasPermission } = useAdmin();
  return hasPermission("canManageOrders");
};

export const useCanManageSettings = () => {
  const { hasPermission } = useAdmin();
  return hasPermission("canManageSettings");
};

export const useCanViewAnalytics = () => {
  const { hasPermission } = useAdmin();
  return hasPermission("canViewAnalytics");
};

export const useCanManageRoles = () => {
  const { hasPermission } = useAdmin();
  return hasPermission("canManageRoles");
};

// Role-specific hooks
export const useIsSuperAdmin = () => {
  const { user } = useAdmin();
  return user?.role === "super_admin";
};

export const useIsAdminOrHigher = () => {
  const { user } = useAdmin();
  return user?.role === "admin" || user?.role === "super_admin";
};

export const useIsModeratorOrHigher = () => {
  const { user } = useAdmin();
  return ["moderator", "admin", "super_admin"].includes(user?.role || "");
};
