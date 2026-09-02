/**
 * Order access tokens live in `@workspace/lib/orders` so the Hono backend can
 * mint the same signed links for transactional emails. Re-exported here to
 * keep the existing `@/lib/order-access-token` import path working.
 */
export {
  buildOrderPagePath,
  buildOrderPageUrl,
  signOrderAccess,
  verifyOrderAccess,
} from "@workspace/lib/orders";
