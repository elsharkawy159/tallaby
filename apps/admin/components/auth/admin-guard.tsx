"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import type { AdminPermissions } from "@/lib/auth/middleware-types";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: keyof AdminPermissions;
  requiredRole?: "admin" | "super_admin" | "moderator";
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const AdminGuard = ({
  children,
  requiredPermission,
  requiredRole,
  fallback,
  redirectTo = "/auth/unauthorized",
}: AdminGuardProps) => {
  const { user, isLoading, isAuthenticated, hasPermission } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    // Check role requirement
    if (requiredRole) {
      const roleHierarchy: Record<string, number> = {
        moderator: 1,
        admin: 2,
        super_admin: 3,
      };

      if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
        router.push(
          `${redirectTo}?reason=insufficient_permissions&title=Access Denied&message=You don't have the required role to access this page.&userRole=${user.role}`
        );
        return;
      }
    }

    // Check permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(
        `${redirectTo}?reason=insufficient_permissions&title=Access Denied&message=You don't have permission to access this page.&userRole=${user.role}`
      );
      return;
    }
  }, [
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    requiredPermission,
    requiredRole,
    redirectTo,
    router,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Redirecting to login...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we redirect you to the login page.
            </p>
          </div>
        </div>
      )
    );
  }

  // Check role requirement
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      moderator: 1,
      admin: 2,
      super_admin: 3,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have the required role to access this page.
              </p>
            </div>
          </div>
        )
      );
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

// Convenience components for common use cases
export const SuperAdminGuard = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <AdminGuard requiredRole="super_admin" fallback={fallback}>
    {children}
  </AdminGuard>
);

export const AdminOrHigherGuard = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <AdminGuard requiredRole="admin" fallback={fallback}>
    {children}
  </AdminGuard>
);

export const UserManagementGuard = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <AdminGuard requiredPermission="canManageUsers" fallback={fallback}>
    {children}
  </AdminGuard>
);

export const SettingsGuard = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <AdminGuard requiredPermission="canManageSettings" fallback={fallback}>
    {children}
  </AdminGuard>
);

export const AnalyticsGuard = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <AdminGuard requiredPermission="canViewAnalytics" fallback={fallback}>
    {children}
  </AdminGuard>
);
