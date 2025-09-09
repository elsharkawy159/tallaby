# Admin Authentication System

This directory contains a comprehensive authentication system for the admin dashboard, providing both server-side and client-side utilities for managing admin access, permissions, and role-based authorization.

## Architecture Overview

The admin authentication system consists of several layers:

1. **Middleware** - Handles route protection and initial authentication checks
2. **Server Actions** - Provides server-side authentication utilities
3. **Client Hooks** - Manages client-side authentication state
4. **Context Provider** - Provides global admin state management
5. **Guard Components** - Protects specific routes and components

## File Structure

```
lib/auth/
├── middleware-types.ts      # TypeScript interfaces and types
├── middleware-utils.ts     # Middleware utility functions
├── admin-auth.ts          # Server-side authentication utilities
└── index.ts              # Main exports

hooks/
└── use-admin-auth.ts     # Client-side authentication hook

contexts/
└── admin-context.tsx     # React context for admin state

components/auth/
└── admin-guard.tsx       # Route and component protection
```

## Usage Examples

### Server-Side Authentication

```typescript
// In Server Components or Server Actions
import { getCurrentAdminUser, canManageUsers } from '@/lib/auth'

export default async function AdminPage() {
  // Get current admin user
  const user = await getCurrentAdminUser()

  // Check specific permission
  const canManage = await canManageUsers()

  return (
    <div>
      <h1>Welcome, {user.fullName}</h1>
      {canManage && <UserManagementPanel />}
    </div>
  )
}
```

### Client-Side Authentication

```typescript
// In Client Components
import { useAdmin, AdminGuard } from '@/lib/auth'

export function AdminDashboard() {
  const { user, isLoading, hasPermission } = useAdmin()

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <h1>Dashboard</h1>
      {hasPermission('canManageUsers') && <UserManagement />}
    </div>
  )
}

// Protect entire components
export function SettingsPage() {
  return (
    <AdminGuard requiredPermission="canManageSettings">
      <SettingsForm />
    </AdminGuard>
  )
}
```

### Route Protection

```typescript
// Protect routes with specific requirements
export function SuperAdminPage() {
  return (
    <SuperAdminGuard>
      <SuperAdminContent />
    </SuperAdminGuard>
  )
}

export function UserManagementPage() {
  return (
    <UserManagementGuard>
      <UserManagementContent />
    </UserManagementGuard>
  )
}
```

## Admin Roles and Permissions

### Roles

- **moderator** - Basic admin access, can manage products and orders
- **admin** - Full admin access, can manage users, products, orders, and view analytics
- **super_admin** - Complete access including settings and role management

### Permissions

| Permission          | Moderator | Admin | Super Admin |
| ------------------- | --------- | ----- | ----------- |
| `canManageUsers`    | ❌        | ✅    | ✅          |
| `canManageProducts` | ✅        | ✅    | ✅          |
| `canManageOrders`   | ✅        | ✅    | ✅          |
| `canManageSettings` | ❌        | ❌    | ✅          |
| `canViewAnalytics`  | ✅        | ✅    | ✅          |
| `canManageRoles`    | ❌        | ❌    | ✅          |

## Middleware Configuration

The middleware automatically:

1. **Skips** static files, API routes, and Next.js internals
2. **Allows** public auth routes without authentication
3. **Protects** all other routes requiring admin authentication
4. **Validates** user roles and verification status
5. **Redirects** unauthorized users to appropriate pages
6. **Sets** admin headers for downstream use

### Protected Routes

- `/dashboard` - Main admin dashboard
- `/users` - User management
- `/products` - Product management
- `/orders` - Order management
- `/analytics` - Analytics and reports
- `/settings` - System settings

### Public Routes

- `/auth/login` - Admin login page
- `/auth/register` - Admin registration
- `/auth/callback` - OAuth callback
- `/auth/unauthorized` - Access denied page
- `/auth/reset-password` - Password reset

## Error Handling

The system provides comprehensive error handling with specific error types:

- `unauthorized` - User not authenticated
- `insufficient_permissions` - User lacks required role/permission
- `unverified` - User account not verified
- `no_profile` - User profile not found
- `middleware_error` - System error during authentication

## Security Features

1. **Server-side validation** - All authentication checks happen server-side
2. **Role-based access control** - Granular permissions based on admin roles
3. **Session management** - Automatic session refresh and cookie handling
4. **Route protection** - Middleware-level protection for all admin routes
5. **Error boundaries** - Graceful handling of authentication failures
6. **Type safety** - Full TypeScript support with strict typing

## Best Practices

1. **Always use server-side checks** for sensitive operations
2. **Use guard components** for UI-level protection
3. **Check permissions** before rendering sensitive content
4. **Handle loading states** appropriately
5. **Provide clear error messages** for unauthorized access
6. **Use the context provider** for global admin state management

## Integration with Existing Auth

This system integrates seamlessly with the existing Supabase authentication:

- Uses the same user database table
- Leverages existing auth actions
- Maintains session consistency
- Provides additional admin-specific functionality

## Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_site_url
```
