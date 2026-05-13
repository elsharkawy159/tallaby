# Coding Conventions

**Analysis Date:** 2026-05-14

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` (e.g., `product-card-info.tsx`, `add-to-cart-button.tsx`)
- Server actions: `kebab-case.ts` under `actions/` (e.g., `cart.ts`, `checkout.ts`)
- Hooks: `use-kebab-case.ts` prefix (e.g., `use-wishlist.ts`, `use-debounce.ts`) — exception: `useScrollingNavbar.ts` uses camelCase (inconsistency)
- Type files: `kebab-case.types.ts` suffix (e.g., `product-card.types.ts`)
- Validation schemas: `kebab-case-schema.ts` or `kebab-case-schemas.ts` (e.g., `auth-schemas.ts`, `contact-schema.ts`)
- Barrel files: `index.ts` per component directory

**Functions:**
- Regular functions: `camelCase` (e.g., `getCart`, `ensureCart`, `resolvePrice`)
- React components: `PascalCase` named exports (e.g., `ProductCardInfo`, `AddToCartButton`)
- Providers: `PascalCase` with `Provider` suffix (e.g., `CartProvider`, `QueryProvider`)
- Hooks: `camelCase` with `use` prefix (e.g., `useWishlist`, `useCart`)
- Server action files export both named `async function` and `const` arrow functions — no strict rule

**Variables:**
- `camelCase` throughout (e.g., `cartItems`, `itemCount`, `defaultWishlist`)
- Boolean state flags: `isLoading`, `isAdding`, `isRemoving`, `isMoving` (`is` prefix)

**Types/Interfaces:**
- `PascalCase` (e.g., `CartItem`, `CartState`, `ProductCardProps`, `WishlistButtonProps`)
- Interfaces preferred over type aliases for object shapes
- Types exported from dedicated `.types.ts` files or inline with `export type`

**Zod Schemas:**
- `camelCase` with `Schema` suffix (e.g., `signInSchema`, `signUpSchema`)
- Inferred types exported alongside: `export type SignInFormData = z.infer<typeof signInSchema>`

## Code Style

**Formatting:**
- Prettier via root `package.json` script: `prettier --write "**/*.{ts,tsx,md}"`
- No `.prettierrc` found — using Prettier defaults with ESLint integration via `eslint-config-prettier`

**Linting:**
- ESLint v9 flat config via `@workspace/eslint-config`
- Three configs: `base.js` (TypeScript + Turbo), `next.js` (Next.js + React hooks), `react-internal.js`
- All violations are warnings only (`eslint-plugin-only-warn`)
- TypeScript strict mode enabled (`"strict": true` in `packages/typescript-config/base.json`)
- `noUncheckedIndexedAccess: true` — array index access returns `T | undefined`
- `react/react-in-jsx-scope` off (new JSX transform)
- `react/prop-types` off (TypeScript enforces types)

## Import Organization

**Order (observed pattern):**
1. External packages (React, Next.js, third-party)
2. Workspace packages (`@workspace/db`, `@workspace/lib`, `@workspace/ui`)
3. Internal absolute imports via `@/` alias
4. Relative imports (`./`, `../`)
5. Type-only imports (`import type { ... }`)

**Path Aliases:**
- `@/*` maps to the app root (e.g., `@/actions/cart`, `@/lib/utils`, `@/components/product`)
- `@workspace/ui/*` maps to `packages/ui/src/*`
- All workspaces accessible as `@workspace/<name>`

**Barrel Files:**
- Used consistently in component directories — `index.ts` re-exports all named exports and types
- Example: `apps/ecommerce/components/product/index.ts`

## Error Handling

**Server Actions pattern:**
- Return `{ success: boolean, data?: T, error?: string, message?: string }` shape consistently
- Wrap in `try/catch`; `catch` returns `{ success: false, error: "..." }`
- `console.error("context: message:", error)` for all caught errors
- Early return `{ success: false, error }` on validation failures before DB calls

**Client-side pattern:**
- Check `result.success` after calling server actions
- Use `toast.success(...)` / `toast.error(...)` via Sonner for user feedback
- Catch blocks call `toast.error(...)` and `console.error(...)`

**No centralized error handler** — each action/hook handles errors independently.

## Logging

**Framework:** `console.error` / `console.log` (no structured logging library)

**Patterns:**
- `console.error("functionName: context message:", error)` — function name prefix helps trace source
- `console.log("userId", userId)` for debug logging (some debug logs left in production code — see `actions/cart.ts` line 174)
- No log levels, no correlation IDs, no structured JSON logging

## Comments

**When to Comment:**
- JSDoc-style `/** ... */` blocks on exported utility functions (e.g., `getCart`, `ensureCart` in `actions/cart.ts`)
- Inline comments explain non-obvious logic, race conditions, and business rules
- `// Comment` above code blocks explaining intent (e.g., `// Fix prices for items that have incorrect prices (0.00)`)
- Commented-out code left in place (e.g., `// import CartSheet`, `{/* <CartSheet /> */}` in `app/(main)/layout.tsx`) — should be removed

## Function Design

**Size:** Functions tend to be medium-to-large; `addToCart` in `actions/cart.ts` is ~130 lines handling multiple call signatures, validation, stock checking, and DB operations.

**Parameters:**
- Overloaded signatures handled via union types (e.g., `addToCart(productIdOrData: string | {...})`)
- Optional params use `?` suffix and default values (e.g., `quantity = 1`, `variantId?: string`)
- Props interfaces defined separately in `.types.ts` files

**Return Values:**
- Server actions: consistent `{ success, data?, error?, message? }` response envelope
- Hooks: return named object with data, loading states, and action functions grouped by comment headers

## Component Design

**Pattern:** Named exports only (no default exports for components), except page/layout files which use `export default` (Next.js requirement).

**"use client" / "use server" directives:**
- `"use client"` at top of interactive components and hooks
- `"use server"` at top of server action files
- Server components are async functions without directives

**Props:**
- Interfaces defined in co-located `.types.ts` or inline in the same file
- `className?: string` passed through for style overrides
- Optional booleans default to `false` via destructuring defaults

**Styling:**
- Tailwind CSS utility classes used directly in JSX
- `cn()` utility (`clsx` + `tailwind-merge`) for conditional/merged classes
- CVA (`class-variance-authority`) for component variant systems — see `packages/ui/src/components/button.tsx`

## Module Design

**Exports:**
- Named exports everywhere except Next.js pages/layouts
- Barrel `index.ts` files aggregate exports from component directories
- Packages export from `src/index.ts` (re-exports sub-modules)

**Workspace Packages:**
- `@workspace/db` — Drizzle ORM client + schema + relations
- `@workspace/lib` — Shared utilities (e.g., `formatPrice`)
- `@workspace/ui` — Shared UI components (shadcn/ui pattern with CVA)
- `@workspace/emails` — React Email templates
- `@workspace/eslint-config` — Shared ESLint flat configs
- `@workspace/typescript-config` — Shared `tsconfig` base files

---

*Convention analysis: 2026-05-14*
