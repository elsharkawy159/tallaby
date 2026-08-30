import {
  ProviderNotImplementedError,
  type CreateShipmentResult,
  type ProviderTracking,
  type ShippingProviderAdapter,
} from "./types";

/**
 * The default adapter: the provider is a label on a record, and the shipment is
 * driven entirely by the rider updating its status in this app. Every concrete
 * provider spreads this so an unimplemented operation fails loudly rather than
 * silently doing nothing.
 */
export const manualAdapter: ShippingProviderAdapter = {
  code: "manual",

  async createShipment(): Promise<CreateShipmentResult> {
    return { trackingNumber: null, labelUrl: null };
  },

  async trackShipment(): Promise<ProviderTracking | null> {
    throw new ProviderNotImplementedError("manual", "trackShipment");
  },

  async cancelShipment(): Promise<void> {
    throw new ProviderNotImplementedError("manual", "cancelShipment");
  },
};
