import type { ShippingTemplate } from "@workspace/lib/shipping/store-zones";
import type { StoreShippingZone } from "@workspace/lib/stores/server";

/** Error keys live under `storeShipping.errors`. */
export type StoreShippingErrorKey =
  | "invalidInput"
  | "overlap"
  | "tooManyZones"
  | "noZones"
  | "tallabyUnavailable"
  | "zonesExist"
  | "readOnly"
  | "notFound"
  | "rateLimited"
  | "generic";

export type StoreShippingResult<T> = { success: true; data: T } | { success: false; error: StoreShippingErrorKey };

/** The zone sheet's values as edited in the browser (numbers as text, "" = empty). */
export type ZoneFormValues = {
  nameAr: string;
  nameEn: string;
  /** Place keys: `EG`, `EG/CAIRO`, `EG/CAIRO/nasr-city`, `SA/RIYADH`… */
  places: string[];
  price: string;
  freeOver: string;
  deliveryDaysMin: string;
  deliveryDaysMax: string;
  codEnabled: boolean;
  enabled: boolean;
};

const num = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(",", ".")));

/** Form values → the strict zone schema input. */
export function toZoneInput(v: ZoneFormValues) {
  return {
    nameAr: v.nameAr.trim(),
    ...(v.nameEn.trim() && { nameEn: v.nameEn.trim() }),
    places: v.places,
    price: num(v.price),
    freeOver: v.freeOver.trim() === "" ? null : num(v.freeOver),
    deliveryDaysMin: num(v.deliveryDaysMin),
    deliveryDaysMax: num(v.deliveryDaysMax),
    codEnabled: v.codEnabled,
    enabled: v.enabled,
  };
}

/** A saved zone as the list shows it; labels and the override hint are computed on the server. */
export type ZoneView = {
  zone: StoreShippingZone;
  /** Place key → label with its parent ("New Cairo · Cairo"), in the page locale. */
  chips: { key: string; label: string }[];
  /** Name of the enabled zone this one carves places out of (one of its places sits inside that zone's place), or null. */
  overrides: string | null;
};

/** One applicable template, with the zone names (both languages) the server will save. */
export type TemplateOption = {
  id: ShippingTemplate;
  names: { nameAr: string; nameEn: string }[];
  /** Price range of the template's zones; null for "one price for all Egypt" (the seller types it). */
  prices: { min: number; max: number } | null;
};

/** A courier app (Bosta) as the Shipping page shows it; the key itself never reaches the page. */
export type CourierView = {
  connected: boolean;
  /** Bosta refused the saved key on the last call. */
  failing: boolean;
  pickupLocationName: string | null;
  shippedOrders: number;
};
