# Guest Checkout Implementation

This document describes the complete guest checkout flow implementation without requiring login.

## Overview

Guests are represented as temporary users in the `users` table with `isGuest = true`. No guest-specific fields are added to `orders`, `carts`, or any other tables - everything uses the standard `userId` relationship.

## Architecture

### Core Components

1. **Guest User Management** (`lib/guest-user.ts`)
   - Cookie-based temporary UID generation
   - Automatic guest user creation in database
   - 30-day cookie expiration

2. **Current User ID Utility** (`lib/get-current-user-id.ts`)
   - Unified function to get authenticated or guest user ID
   - Used across all cart, checkout, and order actions

3. **Account Merge Logic** (`actions/merge-guest-account.ts`)
   - Merges guest cart items into authenticated user's cart
   - Reassigns orders and addresses to authenticated user
   - Deletes temporary guest user after merge

### Flow Diagram

```
First Visit
    ↓
Generate Guest UID (cookie)
    ↓
Create Guest User (if doesn't exist)
    ↓
Guest adds items to cart
    ↓
Guest proceeds to checkout
    ↓
Guest creates address
    ↓
Guest places order (uses userId from guest user)
    ↓
[Optional] Guest logs in
    ↓
Merge guest data → authenticated account
    ↓
Delete temporary guest user
```

## Database Changes

### Schema Update

Added `isGuest` field to `users` table:

```typescript
isGuest: boolean("is_guest").default(false),
```

### Migration Required

You need to run a database migration to add the `isGuest` column:

```bash
cd packages/db
pnpm db:generate
pnpm db:migrate
```

This will create a migration file that adds:
```sql
ALTER TABLE "users" ADD COLUMN "is_guest" boolean DEFAULT false;
```

## Key Implementation Details

### 1. Guest User Creation

- **Cookie Name**: `guest_uid`
- **Cookie Expiry**: 30 days
- **Email Format**: `guest_<uid>@temp.local`
- **User ID**: Proper UUID (not the cookie UID)

### 2. Cart Handling

- All carts reference `userId` (no guest-specific fields)
- `ensureCart()` automatically creates/uses guest user cart
- Single active cart per user (authenticated or guest)

### 3. Checkout Flow

- Guests can create addresses during checkout
- Orders use standard schema with `userId`, `shippingAddressId`, `billingAddressId`
- No guest-specific fields in orders table

### 4. Account Merge (Login After Guest Usage)

When a guest logs in:

1. **Cart Merge**: Merges items from guest cart to authenticated cart
   - Combines quantities if same product exists
   - Adds new items if product doesn't exist

2. **Data Reassignment**:
   - Orders: `userId` updated to authenticated user
   - Addresses: `userId` updated to authenticated user

3. **Cleanup**:
   - Guest cart items deleted
   - Guest user record deleted
   - Guest UID cookie cleared

## Security Considerations

### RLS Policies

Since we're using Drizzle ORM with direct database access, RLS policies need to be configured at the database level. However, our application logic ensures:

1. **User Isolation**: `getCurrentUserId()` ensures users only access their own data
2. **Guest Access**: Guests can only access data tied to their temporary `userId`
3. **Authenticated Access**: Authenticated users access only their own data

### Recommended RLS Policies

For Supabase RLS to work with guest users, you may need to update policies. However, since we're using Drizzle with direct postgres connection, these policies may not apply. The application-level checks in `getCurrentUserId()` provide the security layer.

If using Supabase RLS, consider:

```sql
-- Allow users to access their own data (authenticated or guest)
CREATE POLICY "Users access own data"
ON carts FOR ALL
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = carts.user_id AND is_guest = true));
```

**Note**: Since we're using direct database access with Drizzle, application-level security is enforced through `getCurrentUserId()` checks.

## Files Modified/Created

### New Files

- `apps/ecommerce/lib/guest-user.ts` - Guest user management
- `apps/ecommerce/lib/get-current-user-id.ts` - Current user ID utility
- `apps/ecommerce/actions/merge-guest-account.ts` - Account merge logic

### Modified Files

- `packages/db/src/drizzle/schema.ts` - Added `isGuest` field
- `apps/ecommerce/actions/cart.ts` - Updated to support guest users
- `apps/ecommerce/actions/checkout.ts` - Updated to support guest checkout
- `apps/ecommerce/actions/order.ts` - Updated to support guest orders
- `apps/ecommerce/actions/customer.ts` - Updated address creation for guests
- `apps/ecommerce/actions/auth.ts` - Added merge logic on sign-in

## Usage Examples

### Guest Adds Item to Cart

```typescript
// Automatically creates guest user if needed
await addToCart(productId, quantity)
```

### Guest Checks Out

```typescript
// Create address for guest
await addAddress({...addressData})

// Create order (uses guest userId)
await createOrder({
  cartId,
  shippingAddressId,
  paymentMethod: 'cash',
})
```

### Guest Logs In

```typescript
// Automatically merges guest data
await signInAction({ email, password })
// Cart items, orders, addresses merged automatically
```

## Testing Checklist

- [ ] Guest can add items to cart
- [ ] Guest cart persists across page refreshes
- [ ] Guest can create address during checkout
- [ ] Guest can complete checkout and create order
- [ ] Guest order appears in orders (with guest userId)
- [ ] Guest logs in → cart items merged
- [ ] Guest logs in → orders reassigned
- [ ] Guest logs in → addresses reassigned
- [ ] Guest user deleted after merge
- [ ] Cookie expires after 30 days

## Next Steps

1. **Run Migration**: Generate and run database migration for `isGuest` field
2. **Test Flow**: Test complete guest checkout flow
3. **Test Merge**: Test account merge when guest logs in
4. **Monitor**: Monitor guest user creation and cleanup

## Notes

- Guest users are real database records (not session-based)
- Cookie-based UID ensures persistence across sessions
- All data uses standard schema (no guest-specific fields)
- Account merge is automatic on login
- Guest users are deleted after successful merge

