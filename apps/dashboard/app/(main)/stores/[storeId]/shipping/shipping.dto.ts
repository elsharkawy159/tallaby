/** Error keys live under `storeShipping.errors`. */
export type StoreShippingErrorKey =
  | "invalidInput"
  | "overlap"
  | "tooManyZones"
  | "noZones"
  | "readOnly"
  | "notFound"
  | "rateLimited"
  | "generic";

export type StoreShippingResult<T> = { success: true; data: T } | { success: false; error: StoreShippingErrorKey };

/** The zone sheet's values as edited in the browser (numbers as text, "" = empty). */
export type ZoneFormValues = {
  nameAr: string;
  nameEn: string;
  governorates: string[];
  price: string;
  perKgSurcharge: string;
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
    governorates: v.governorates,
    price: num(v.price),
    perKgSurcharge: v.perKgSurcharge.trim() === "" ? 0 : num(v.perKgSurcharge),
    freeOver: v.freeOver.trim() === "" ? null : num(v.freeOver),
    deliveryDaysMin: num(v.deliveryDaysMin),
    deliveryDaysMax: num(v.deliveryDaysMax),
    codEnabled: v.codEnabled,
    enabled: v.enabled,
  };
}
