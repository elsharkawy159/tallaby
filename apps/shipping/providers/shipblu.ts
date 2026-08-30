import { manualAdapter } from "./manual";
import type { ShippingProviderAdapter } from "./types";

/**
 * ShipBlu. Currently a manual provider: shipments are tracked by the assigned
 * rider inside this app.
 *
 * TODO: implement createShipment/trackShipment/cancelShipment against the
 * ShipBlu API. Only this file needs to change — server actions call through
 * getProviderAdapter().
 */
export const shipBluAdapter: ShippingProviderAdapter = {
  ...manualAdapter,
  code: "shipblu",
};
