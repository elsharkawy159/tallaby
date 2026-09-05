# Admin Authentication System

Server-side only. There is no client-side auth context or guard component —
every admin page is already gated by `proxy.ts` before it renders, so
re-checking auth in a Client Component would just be a second, unbounded
network round trip for no security benefit.

## File Structure

```
lib/auth/
├── middleware-types.ts    # TypeScript interfaces and types
├── middleware-utils.ts    # Permission-table helpers
├── admin-auth.ts          # Server-side authentication utilities (React.cache-wrapped)
└── index.ts               # Main exports

supabase/
├── middleware.ts          # proxy.ts's updateSession() — the actual route guard
├── server.ts / client.ts  # Supabase client factories (bounded fetch, see fetch-with-timeout.ts)
```

## How a request is authorized

1. `apps/admin/proxy.ts` runs `updateSession()` on every non-public path:
   one `auth.getUser()` call, then (if a user exists) one PostgREST query
   for `role`/`is_verified`. Anything that isn't an authenticated,
   verified `admin`/`super_admin`/`moderator` is redirected to `/login`.
   Both calls are wrapped in try/catch — a Supabase failure (including a
   fetch timeout) is treated as "not authorized," never left to throw and
   crash the navigation.
2. Server Components and Server Actions call `getCurrentAdminUser()` (or
   the action-layer `getAdminUser()` wrapper in `actions/auth.ts`) to get
   the actual `AdminUser` row. Both `getAuthUser` and `getCurrentAdminUser`
   are wrapped in React's `cache()`, so no matter how many call sites a
   single request touches, it costs one `auth.getUser()` and one profile
   query total — not one pair per call site.
3. If a Client Component needs the user (e.g. `UserNav`'s avatar/name), it
   receives it as a prop from a Server Component parent that already
   called `getCurrentAdminUser()` — see `app/(dashboard)/layout.tsx`. It
   does **not** re-fetch it itself.

## Roles and permissions

| Permission          | Moderator | Admin | Super Admin |
| -------------------- | --------- | ----- | ----------- |
| `canManageUsers`    | ❌        | ✅    | ✅          |
| `canManageProducts` | ✅        | ✅    | ✅          |
| `canManageOrders`   | ✅        | ✅    | ✅          |
| `canManageSettings` | ❌        | ❌    | ✅          |
| `canViewAnalytics`  | ✅        | ✅    | ✅          |
| `canManageRoles`    | ❌        | ❌    | ✅          |

`checkAdminPermission()` / `canManageUsers()` / etc. in `admin-auth.ts` are
the server-side checks for these; call them from a Server Action before a
mutation, not from client state.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_site_url
```
