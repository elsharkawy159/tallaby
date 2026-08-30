/**
 * Provider adapter contract.
 *
 * The MVP manages providers as database records and does not call any carrier
 * API. This interface exists so that wiring a real Bosta / ShipBlu / Egypt Post
 * integration later is a change inside one adapter file, with no churn at the
 * call sites in the server actions.
 */

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  /** Cash to collect on delivery, in EGP. Zero for prepaid orders. */
  codAmount: number;
  recipient: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode?: string | null;
    country?: string | null;
  };
}

export interface CreateShipmentResult {
  trackingNumber: string | null;
  labelUrl: string | null;
}

export interface ProviderTracking {
  /** Carrier-native status string, left untranslated on purpose. */
  status: string;
  updatedAt: string;
  raw?: unknown;
}

export interface ShippingProviderAdapter {
  readonly code: string;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  trackShipment(trackingNumber: string): Promise<ProviderTracking | null>;
  cancelShipment(trackingNumber: string): Promise<void>;
}

export class ProviderNotImplementedError extends Error {
  constructor(code: string, operation: string) {
    super(`Provider "${code}" does not implement ${operation} yet`);
    this.name = "ProviderNotImplementedError";
  }
}
