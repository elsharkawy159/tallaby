import { createRevalidateRouteHandler } from "@workspace/cache";

/**
 * Receives cross-app cache invalidation broadcasts from apps/dashboard and
 * apps/admin (see packages/cache/src/broadcast.ts). POST only, header-only
 * secret — see packages/cache/src/handler.ts for what changed vs. the
 * previous version of this route (which also accepted a GET with the
 * secret in the query string).
 */
export const { POST } = createRevalidateRouteHandler();
