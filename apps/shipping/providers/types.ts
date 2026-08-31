import type { EgyptPostOrderInput, EgyptPostRow, PackageVolume } from "@workspace/lib/shipping";

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

/** A driver eligible to receive orders from a bulk assignment. */
export interface EligibleRider {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  /** Open (assigned | out_for_delivery) shipments this rider already carries, before this batch. */
  activeDeliveries: number;
}

/** One order being bulk-assigned. A superset of what an Egypt Post sheet row needs. */
export type BulkAssignOrder = EgyptPostOrderInput;

export interface BulkAssignDefaults {
  /** Applied to any order whose shipment has no package_weight yet. */
  weightKg: number;
  volume: PackageVolume;
  merchantCode: string;
  merchantName: string;
  warehouseName: string;
}

export interface BulkAssignContext {
  orders: BulkAssignOrder[];
  /** On-duty, non-suspended riders — empty when none are available. */
  riders: EligibleRider[];
  defaults: BulkAssignDefaults;
}

export interface BulkAssignError {
  orderId: string;
  orderNumber: string;
  reason: string;
}

export interface BulkAssignPlan {
  /** orderId -> riderId. Empty for a provider that doesn't split across our own fleet. */
  riderByOrderId: Record<string, string>;
  /** Set when the provider hands off via a generated sheet (e.g. Egypt Post). */
  export: { format: "egypt_post_xlsx"; rows: EgyptPostRow[] } | null;
  /**
   * Any order that couldn't be planned. A non-empty array blocks the whole
   * batch — bulkAssignProvider writes nothing when this is non-empty, so a
   * half-uploadable sheet or a half-split batch never reaches the database.
   */
  errors: BulkAssignError[];
}

export interface ShippingProviderAdapter {
  readonly code: string;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  trackShipment(trackingNumber: string): Promise<ProviderTracking | null>;
  cancelShipment(trackingNumber: string): Promise<void>;
  /** Only providers that need bulk-assign-time work (a sheet export, a rider split) implement this. */
  planBulkAssign?(ctx: BulkAssignContext): BulkAssignPlan;
}

export class ProviderNotImplementedError extends Error {
  constructor(code: string, operation: string) {
    super(`Provider "${code}" does not implement ${operation} yet`);
    this.name = "ProviderNotImplementedError";
  }
}
