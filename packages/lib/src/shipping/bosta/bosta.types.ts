/**
 * Bosta API v2 shapes used by the per-store Bosta integration
 * (docs/superpowers/plans/2026-10-26-bosta-shipping.md). Taken from Bosta's
 * OpenAPI spec (https://docs.bosta.co/api/api.yaml) and how-to pages; only
 * the fields Tallaby sends or reads are typed.
 */

/** Same values as the `shipment_status` DB enum. */
export type BostaShipmentStatus =
  | "pending"
  | "assigned"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

export type BostaPackageSize = "SMALL" | "MEDIUM" | "LARGE";

/** Deliver (10). Cash collection (15), CRP (25) and exchange (30) are unused. */
export const BOSTA_DELIVERY_TYPE_DELIVER = 10;

/** Bosta's COD ceiling (errors 3007/3008). */
export const BOSTA_MAX_COD_EGP = 30_000;

export type BostaDropOffAddress = {
  /** City name from Bosta's city list (required). */
  city: string;
  cityId?: string;
  districtId?: string;
  districtName?: string;
  zoneId?: string;
  /** Must be more than 5 characters. */
  firstLine: string;
  secondLine?: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
  isWorkAddress?: boolean;
};

export type BostaReceiver = {
  firstName: string;
  lastName?: string;
  phone: string;
  secondPhone?: string;
  email?: string;
};

export type BostaCreateDeliveryRequest = {
  type: typeof BOSTA_DELIVERY_TYPE_DELIVER;
  cod: number;
  specs: {
    packageType: "Parcel";
    size: BostaPackageSize;
    packageDetails: { itemsCount: number; description: string };
  };
  dropOffAddress: BostaDropOffAddress;
  receiver: BostaReceiver;
  businessReference: string;
  uniqueBusinessReference: string;
  notes?: string;
  businessLocationId?: string;
  goodsInfo?: { amount: number };
  allowToOpenPackage?: boolean;
  deliveryImages?: Array<{ type: "ALLOW_TO_OPEN_THE_PACKAGE"; images: string[] }>;
  webhookUrl?: string;
  webhookCustomHeaders?: { Authorization: string };
  escrowInfo?: { isExcluded: boolean };
};

export type BostaState = { code: number; value?: string };

export type BostaCreatedDelivery = {
  _id: string;
  trackingNumber: string;
  businessReference?: string;
  state?: BostaState;
};

export type BostaDelivery = {
  _id: string;
  trackingNumber: string;
  state: BostaState;
  maskedState?: string;
  cod?: number;
  businessReference?: string;
};

export type BostaPickupLocation = {
  _id: string;
  locationName: string;
  isDefault: boolean;
  /** "firstLine, district, city" for display. */
  addressLine: string;
};

/** Body Bosta POSTs to the webhook on every status change (not on creation). */
export type BostaWebhookPayload = {
  _id: string;
  trackingNumber: string | number;
  state: number;
  type?: string;
  cod?: number;
  timeStamp?: number;
  isConfirmedDelivery?: boolean;
  deliveryPromiseDate?: string;
  exceptionReason?: string;
  exceptionCode?: number;
  businessReference?: string;
  numberOfAttempts?: number;
};
