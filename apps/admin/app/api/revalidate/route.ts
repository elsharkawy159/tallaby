import { createRevalidateRouteHandler } from "@workspace/cache";

/**
 * Receives cross-app cache invalidation broadcasts from apps/ecommerce and
 * apps/dashboard (see packages/cache/src/broadcast.ts). POST only,
 * header-only secret — see packages/cache/src/handler.ts.
 */
export const { POST } = createRevalidateRouteHandler();
