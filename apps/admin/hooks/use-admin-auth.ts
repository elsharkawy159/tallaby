"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import type { AdminUser, AdminPermissions } from "@/lib/auth/middleware-types";

interface UseAdminAuthReturn {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: AdminPermissions | null;
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  refreshUser: () => Promise<void>;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);

  const supabase = createClient();

  const getAdminPermissions = (role: string): AdminPermissions => {
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

    return (
      permissions[role as keyof typeof permissions] || permissions.moderator
    );
  };

  const fetchUserProfile = async (
    userId: string
  ): Promise<AdminUser | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, isVerified, fullName, createdAt, updatedAt")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      const adminRoles = ["admin", "super_admin", "moderator"];
      if (!adminRoles.includes(data.role)) {
        console.error("User does not have admin role");
        return null;
      }

      if (!data.isVerified) {
        console.error("User account is not verified");
        return null;
      }

      return data as AdminUser;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setPermissions(null);
        return;
      }

      const userProfile = await fetchUserProfile(authUser.id);

      if (userProfile) {
        setUser(userProfile);
        setPermissions(getAdminPermissions(userProfile.role));
      } else {
        setUser(null);
        setPermissions(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission];
  };

  useEffect(() => {
    refreshUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await refreshUser();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setPermissions(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    permissions,
    hasPermission,
    refreshUser,
  };
};
