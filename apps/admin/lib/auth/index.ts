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

// Constants
export {
  ADMIN_ROLES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
} from "./middleware-types";
