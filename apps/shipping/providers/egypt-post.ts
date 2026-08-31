import { toEgyptPostRows } from "@workspace/lib/shipping";

import {
  EGYPT_POST_MERCHANT_CODE,
  EGYPT_POST_MERCHANT_NAME,
  EGYPT_POST_WAREHOUSE_NAME,
} from "./egypt-post.constants";
import { manualAdapter } from "./manual";
import type { BulkAssignContext, BulkAssignPlan, ShippingProviderAdapter } from "./types";

/**
 * Egypt Post (Wassalha). They have no API — the handover is a `.xlsx` sheet
 * on their fixed template, uploaded by hand to their dashboard. createShipment
 * stays the manual no-op below; the real integration point is planBulkAssign,
 * which builds that sheet.
 *
 * TODO: implement createShipment/trackShipment/cancelShipment if Egypt Post
 * ever exposes an API. Only this file needs to change — server actions call
 * through getProviderAdapter().
 */
export const egyptPostAdapter: ShippingProviderAdapter = {
  ...manualAdapter,
  // Matches the live `shipping_providers.code` row (name "Wassalha Egypt
  // Post") — not the original migration 0009 seed value ("egypt_post"),
  // which was renamed via the Providers admin page before this adapter
  // shipped. getProviderAdapter() falls back to manualAdapter on any
  // mismatch here, silently — so this string must track that row exactly.
  code: "wassalha_egypt_post",

  planBulkAssign(ctx: BulkAssignContext): BulkAssignPlan {
    const { rows, errors } = toEgyptPostRows(ctx.orders, {
      weightKg: ctx.defaults.weightKg,
      volume: ctx.defaults.volume,
      merchantCode: EGYPT_POST_MERCHANT_CODE,
      merchantName: EGYPT_POST_MERCHANT_NAME,
      warehouseName: EGYPT_POST_WAREHOUSE_NAME,
    });

    return {
      riderByOrderId: {},
      export: errors.length === 0 ? { format: "egypt_post_xlsx", rows } : null,
      errors,
    };
  },
};
