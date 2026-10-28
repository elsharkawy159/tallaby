import type { SellerCouponInput, SellerCouponRow } from "@/actions/coupons";
import type { CouponChannel } from "@workspace/lib/orders/coupon-scope";
import { COUPON_POPUP_MAX_MINUTES, type CouponPopupTrigger } from "@workspace/lib/orders/coupon-popup";

export type CouponStatus = "running" | "scheduled" | "ended" | "usedUp" | "off";
export type CouponFilter = "all" | "running" | "scheduled" | "ended" | "off";

export const COUPON_FILTERS: CouponFilter[] = ["all", "running", "scheduled", "ended", "off"];

export function getCouponStatus(coupon: SellerCouponRow, now: number): CouponStatus {
  if (!coupon.isActive) return "off";
  if (new Date(coupon.expiresAt).getTime() < now) return "ended";
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return "usedUp";
  if (new Date(coupon.startsAt).getTime() > now) return "scheduled";
  return "running";
}

export function matchesFilter(status: CouponStatus, filter: CouponFilter) {
  if (filter === "all") return true;
  if (filter === "ended") return status === "ended" || status === "usedUp";
  return status === filter;
}

/** Message key under `coupons.row.channels` for a channel set. */
export function channelsKey(channels: CouponChannel[]): "both" | CouponChannel {
  return channels.length === 1 ? channels[0]! : "both";
}

/** Form state keeps raw strings so inputs can be empty while typing. */
export type CouponFormState = {
  code: string;
  name: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  maximumDiscount: string;
  minimumPurchase: string;
  usageLimit: string;
  perUserLimit: string;
  productScope: "all" | "selected";
  productIds: string[];
  channels: CouponChannel[];
  startDate: string;
  endDate: string;
  /** Store pop-up: "off", or when it opens. */
  popupTrigger: "off" | CouponPopupTrigger;
  /** How long the visitor has to use the code, in `popupUnit`s. */
  popupDuration: string;
  popupUnit: PopupUnit;
};

export type PopupUnit = "minutes" | "hours" | "days";

export const POPUP_UNITS: PopupUnit[] = ["minutes", "hours", "days"];

const UNIT_MINUTES: Record<PopupUnit, number> = { minutes: 1, hours: 60, days: 24 * 60 };

/** Minutes shown in the largest unit they divide evenly into. */
export function minutesToDuration(minutes: number): { popupDuration: string; popupUnit: PopupUnit } {
  const unit: PopupUnit =
    minutes % UNIT_MINUTES.days === 0 ? "days" : minutes % UNIT_MINUTES.hours === 0 ? "hours" : "minutes";
  return { popupDuration: String(minutes / UNIT_MINUTES[unit]), popupUnit: unit };
}

export type CouponFormField =
  | "code"
  | "name"
  | "discountValue"
  | "productIds"
  | "channels"
  | "dates"
  | "popupDuration";

const CODE_PATTERN = /^[A-Z0-9_-]{3,24}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** yyyy-mm-dd in the seller's own timezone, for <input type="date">. */
export function toDateInput(value: string | number | Date) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emptyCouponForm(): CouponFormState {
  const now = Date.now();
  return {
    code: "",
    name: "",
    discountType: "percentage",
    discountValue: "10",
    maximumDiscount: "",
    minimumPurchase: "",
    usageLimit: "",
    perUserLimit: "1",
    productScope: "all",
    productIds: [],
    channels: ["storefront"],
    startDate: toDateInput(now),
    endDate: toDateInput(now + 30 * DAY_MS),
    popupTrigger: "off",
    popupDuration: "1",
    popupUnit: "hours",
  };
}

export function couponToForm(coupon: SellerCouponRow): CouponFormState {
  const str = (n: number | null) => (n == null ? "" : String(n));
  return {
    code: coupon.code,
    name: coupon.name,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    maximumDiscount: str(coupon.maximumDiscount),
    minimumPurchase: str(coupon.minimumPurchase),
    usageLimit: str(coupon.usageLimit),
    perUserLimit: str(coupon.perUserLimit),
    productScope: coupon.productIds ? "selected" : "all",
    productIds: coupon.productIds ?? [],
    // Saving moves an older marketplace coupon onto the store only.
    channels: ["storefront"],
    startDate: toDateInput(coupon.startsAt),
    endDate: toDateInput(coupon.expiresAt),
    ...(coupon.popup
      ? { popupTrigger: coupon.popup.trigger, ...minutesToDuration(coupon.popup.durationMinutes) }
      : { popupTrigger: "off" as const, popupDuration: "1", popupUnit: "hours" as const }),
  };
}

export function normalizeCode(raw: string) {
  return raw.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9_-]/g, "");
}

/** A readable code: letters from the coupon name, then 4 unambiguous characters. */
export function generateCode(name: string) {
  const prefix = normalizeCode(name).replace(/[^A-Z]/g, "").slice(0, 6) || "SAVE";
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${prefix}${suffix}`;
}

const toAmount = (raw: string) => {
  const n = Number(raw.replace(",", "."));
  return raw.trim() && Number.isFinite(n) && n > 0 ? n : null;
};
const toCount = (raw: string) => {
  const n = Number(raw);
  return raw.trim() && Number.isInteger(n) && n > 0 ? n : null;
};

/** Field key → message key under `coupons.errors`. */
export type CouponFormErrors = Partial<Record<CouponFormField, string>>;

export function validateCouponForm(
  form: CouponFormState
): { errors: CouponFormErrors; input: SellerCouponInput | null } {
  const errors: CouponFormErrors = {};
  const code = normalizeCode(form.code);
  const value = toAmount(form.discountValue);

  if (!CODE_PATTERN.test(code)) errors.code = "code";
  if (!form.name.trim()) errors.name = "name";
  if (value == null) errors.discountValue = "value";
  else if (form.discountType === "percentage" && value > 90) errors.discountValue = "percentMax";
  if (form.productScope === "selected" && form.productIds.length === 0) errors.productIds = "products";
  if (!form.startDate || !form.endDate) errors.dates = "dates";
  else if (form.endDate < form.startDate) errors.dates = "invalid_dates";
  const popupMinutes = toCount(form.popupDuration) == null ? null : Number(form.popupDuration) * UNIT_MINUTES[form.popupUnit];
  if (form.popupTrigger !== "off" && (popupMinutes == null || popupMinutes > COUPON_POPUP_MAX_MINUTES)) {
    errors.popupDuration = "popupDuration";
  }

  if (Object.keys(errors).length > 0) return { errors, input: null };

  return {
    errors,
    input: {
      code,
      name: form.name.trim(),
      discountType: form.discountType,
      discountValue: value!,
      maximumDiscount: form.discountType === "percentage" ? toAmount(form.maximumDiscount) : null,
      minimumPurchase: toAmount(form.minimumPurchase),
      usageLimit: toCount(form.usageLimit),
      perUserLimit: toCount(form.perUserLimit),
      productIds: form.productScope === "selected" ? form.productIds : null,
      channels: ["storefront"],
      popup:
        form.popupTrigger === "off" ? null : { trigger: form.popupTrigger, durationMinutes: popupMinutes! },
      // Whole days in the seller's timezone: from the first moment of the
      // start day to the last moment of the end day.
      startsAt: new Date(`${form.startDate}T00:00:00`).toISOString(),
      expiresAt: new Date(`${form.endDate}T23:59:59.999`).toISOString(),
    },
  };
}
