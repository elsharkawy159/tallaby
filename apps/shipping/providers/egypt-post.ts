import { manualAdapter } from "./manual";
import type { ShippingProviderAdapter } from "./types";

/**
 * Egypt Post. Currently a manual provider: shipments are tracked by the assigned
 * rider inside this app.
 *
 * TODO: implement createShipment/trackShipment/cancelShipment against the
 * Egypt Post API. Only this file needs to change — server actions call through
 * getProviderAdapter().
 */
export const egyptPostAdapter: ShippingProviderAdapter = {
  ...manualAdapter,
  code: "egypt_post",
};
