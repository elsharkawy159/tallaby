// Types
export type {
  AdminUser,
  AdminRole,
  AdminAuthContext,
  MiddlewareAuthResult,
  AdminPermissions,
} from "./middleware-types";

// Server-side utilities
export {
  getCurrentAdminUser,
  checkAdminPermission,
  getCurrentAdminPermissions,
  isSuperAdmin,
  isAdminOrHigher,
  validateAdminAccess,
  getAdminUserWithPermission,
  canManageUsers,
  canManageProducts,
  canManageOrders,
  canManageSettings,
  canViewAnalytics,
  canManageRoles,
} from "./admin-auth";

// Client-side utilities
export { useAdminAuth } from "@/hooks/use-admin-auth";

// Context
export {
  AdminProvider,
  useAdmin,
  useAdminPermissions,
  useAdminUser,
  useCanManageUsers,
  useCanManageProducts,
  useCanManageOrders,
  useCanManageSettings,
  useCanViewAnalytics,
  useCanManageRoles,
  useIsSuperAdmin,
  useIsAdminOrHigher,
  useIsModeratorOrHigher,
} from "@/contexts/admin-context";

// Guard components
export {
  AdminGuard,
  SuperAdminGuard,
  AdminOrHigherGuard,
  UserManagementGuard,
  SettingsGuard,
  AnalyticsGuard,
} from "@/components/auth/admin-guard";

// Constants
export {
  ADMIN_ROLES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
} from "./middleware-types";
