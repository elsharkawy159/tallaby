/**
 * Store payment methods (PLAN.md §8.6, P3-07): the catalog every app shows and
 * the rules for stores.settings.payments. Pure; no DB imports.
 *
 * Storefront checkout offers the store's enabled methods and, for the manual
 * transfers (InstaPay, Vodafone Cash, e& Cash), shows the SELLER's own details
 * (owner, 2026-10-31; PLAN.md P3-07 Part B, ROADMAP.md F-21p). The order keeps
 * a snapshot of them and `metadata.paymentCollector = 'seller'`, so delivery
 * posts only the fee, never a `sale` (PLAN.md §13.4).
 */
import { z } from "zod";
import { EGYPT_MOBILE_REGEX } from "../fulfillment/validate";
import type { OrderGatewayMeta } from "./store-gateways.lib";

export type PaymentCollector = "seller" | "tallaby" | "delivery";
export type PaymentMethodStatus = "live" | "soon";
export type PaymentMethodKind = "cod" | "wallet" | "instapay" | "other";

export type StorePaymentMethod = {
  key: string;
  kind: PaymentMethodKind;
  status: PaymentMethodStatus;
  collector: PaymentCollector;
  /**
   * Public path (same in ecommerce and dashboard public/), or null → initials badge.
   * `/icons/payments/*.png` are 96px tall; storefront footers draw the same files
   * (`PAYMENTS` in packages/store-sections/src/elements/store-payments.tsx).
   */
  logo: string | null;
  /** Brand initials + colour for methods without a logo file yet. */
  badge?: { text: string; color: string };
};

export const STORE_PAYMENT_METHODS = [
  { key: "cod", kind: "cod", status: "live", collector: "delivery", logo: null, badge: { text: "COD", color: "#0a5c4f" } },
  { key: "vodafone_cash", kind: "wallet", status: "live", collector: "seller", logo: "/icons/payments/vodafone-cash.png" },
  { key: "e_cash", kind: "wallet", status: "live", collector: "seller", logo: "/icons/payments/e-cash.png" },
  // Official brand assets still needed for these two (owner action).
  { key: "we_pay", kind: "wallet", status: "live", collector: "seller", logo: null, badge: { text: "WE", color: "#5c2d91" } },
  { key: "orange_cash", kind: "wallet", status: "live", collector: "seller", logo: null, badge: { text: "OC", color: "#ff7900" } },
  { key: "instapay", kind: "instapay", status: "live", collector: "seller", logo: "/icons/payments/instapay.png" },
  { key: "card", kind: "other", status: "soon", collector: "tallaby", logo: null, badge: { text: "VISA", color: "#1a1f71" } },
  { key: "fawry", kind: "other", status: "soon", collector: "tallaby", logo: null, badge: { text: "F", color: "#f7c600" } },
  { key: "installments", kind: "other", status: "soon", collector: "tallaby", logo: null, badge: { text: "÷", color: "#00a19a" } },
  { key: "apple_google_pay", kind: "other", status: "soon", collector: "tallaby", logo: null, badge: { text: "Pay", color: "#111111" } },
  { key: "bank_transfer", kind: "other", status: "soon", collector: "seller", logo: null, badge: { text: "BT", color: "#475569" } },
  { key: "tallaby_wallet", kind: "other", status: "soon", collector: "tallaby", logo: null, badge: { text: "T", color: "#0a5c4f" } },
] as const satisfies readonly StorePaymentMethod[];

export type StorePaymentMethodKey = (typeof STORE_PAYMENT_METHODS)[number]["key"];
export type LivePaymentMethodKey = "cod" | "vodafone_cash" | "e_cash" | "we_pay" | "orange_cash" | "instapay";

const LIVE_KEYS: LivePaymentMethodKey[] = ["cod", "vodafone_cash", "e_cash", "we_pay", "orange_cash", "instapay"];
const WALLET_KEYS = ["vodafone_cash", "e_cash", "we_pay", "orange_cash"] as const;

export function getStorePaymentMethod(key: string) {
  return STORE_PAYMENT_METHODS.find((m) => m.key === key);
}

// Tallaby has its own InstaPay, Vodafone Cash and e& Cash accounts only.
const TALLABY_RECEIVED_METHODS: readonly string[] = ["online_payment", "card", "wallet", "instapay", "vodafone_cash", "e_cash"];

/**
 * Who holds the shipping money of a store-website order whose store delivers
 * itself (store shipping spec §6.8), from the checkout value
 * (orders.payment_method as placed, before a wallet-partial split).
 *
 * - `seller`: the customer pays cash to the deliverer (`cash_on_delivery`, or
 *   a wallet-partial order whose remainder is cash on delivery).
 * - `tallaby`: every method Tallaby receives on the marketplace: online /
 *   card, the customer wallet, and the manual transfers (InstaPay, Vodafone
 *   Cash, e& Cash, paid to Tallaby's own accounts there), alone or as a
 *   wallet-partial remainder. A storefront transfer is paid to the seller
 *   (`sellerTransferFor`), and place-order sets the collector to `seller`
 *   for it, like the seller's own card gateway.
 * - anything unknown: `seller`, so shipping is never over-credited.
 */
export function storeShippingCollector(paymentMethod: string): "tallaby" | "seller" {
  if (paymentMethod === "cash_on_delivery") return "seller";
  if (TALLABY_RECEIVED_METHODS.includes(paymentMethod)) return "tallaby";
  const remainder = paymentMethod.startsWith("wallet_") ? paymentMethod.slice("wallet_".length) : null;
  if (remainder && TALLABY_RECEIVED_METHODS.includes(remainder)) return "tallaby";
  return "seller";
}

/** Usual operator by mobile prefix. A HINT only: numbers can be ported between operators. */
export function operatorHint(phone: string): (typeof WALLET_KEYS)[number] | null {
  const p = phone.replace(/[\s-]/g, "").replace(/^\+?20/, "0");
  if (!/^01\d{9}$/.test(p)) return null;
  return ({ "010": "vodafone_cash", "011": "e_cash", "012": "orange_cash", "015": "we_pay" } as const)[p.slice(0, 3) as "010"] ?? null;
}

/** ISO 13616 mod-97 check. */
export function ibanChecksumValid(iban: string): boolean {
  const v = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(v)) return false;
  const rearranged = v.slice(4) + v.slice(0, 4);
  let rest = 0;
  for (const ch of rearranged) {
    const n = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of n) rest = (rest * 10 + Number(d)) % 97;
  }
  return rest === 1;
}

const holderName = z.string().trim().min(2).max(120);
const mobile = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(EGYPT_MOBILE_REGEX, "phone_invalid"));

export const walletDetailsSchema = z.object({ holderName, phone: mobile }).strict();

/**
 * How a store receives InstaPay: one identifier, picked from a dropdown in the
 * dashboard (owner, 2026-10-31). `ipa` is the InstaPay address, which looks
 * like an email (name@instapay).
 */
export const INSTAPAY_RECEIVE_TYPES = ["ipa", "phone", "iban", "paymentLink"] as const;
export type InstapayReceiveType = (typeof INSTAPAY_RECEIVE_TYPES)[number];

/** The identifier saved details use; the first one set for older multi-field details. */
export function instapayReceiveType(details: Partial<Record<InstapayReceiveType, unknown>> | null | undefined): InstapayReceiveType {
  return INSTAPAY_RECEIVE_TYPES.find((type) => typeof details?.[type] === "string" && details[type]) ?? "ipa";
}

export const instapayDetailsSchema = z
  .object({
    holderName,
    ipa: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{2,60}@instapay$/, "ipa_invalid").optional(),
    phone: mobile.optional(),
    iban: z
      .string()
      .transform((v) => v.replace(/\s+/g, "").toUpperCase())
      .pipe(z.string().regex(/^EG\d{27}$/, "iban_invalid").refine(ibanChecksumValid, "iban_checksum"))
      .optional(),
    paymentLink: z
      .string()
      .trim()
      .regex(/^https:\/\/ipn\.eg\/[^\s]+$/, "link_invalid")
      .optional(),
    qrMediaId: z.uuid().optional(),
  })
  .strict()
  .refine((d) => d.ipa || d.phone || d.iban || d.paymentLink, { message: "identifier_required", path: ["ipa"] });

export const codSettingsSchema = z
  .object({
    enabled: z.boolean(),
    fee: z.number().int().min(0).max(500),
    minOrder: z.number().min(0).max(1_000_000).optional(),
    maxOrder: z.number().min(0).max(1_000_000).optional(),
    note: z.string().trim().max(300).optional(),
  })
  .strict();

const walletEntry = z.object({ enabled: z.boolean(), details: walletDetailsSchema.optional() }).strict();
const instapayEntry = z.object({ enabled: z.boolean(), details: instapayDetailsSchema.optional() }).strict();

export const storePaymentsSchema = z
  .object({
    cod: codSettingsSchema.optional(),
    vodafone_cash: walletEntry.optional(),
    e_cash: walletEntry.optional(),
    we_pay: walletEntry.optional(),
    orange_cash: walletEntry.optional(),
    instapay: instapayEntry.optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    for (const key of LIVE_KEYS) {
      const entry = p[key] as { enabled: boolean; details?: unknown } | undefined;
      if (key !== "cod" && entry?.enabled && !entry.details) {
        ctx.addIssue({ code: "custom", message: "details_required", path: [key, "details"] });
      }
    }
    if (!LIVE_KEYS.some((key) => p[key]?.enabled)) {
      ctx.addIssue({ code: "custom", message: "last_method", path: [] });
    }
  });

export type StorePayments = z.output<typeof storePaymentsSchema>;

/** New stores: cash on delivery only (D30). */
export function defaultStorePayments(): StorePayments {
  return { cod: { enabled: true, fee: 0 } };
}

/** stores.settings.payments as stored, or the defaults when missing/invalid. */
export function parseStorePayments(raw: unknown): StorePayments {
  const parsed = storePaymentsSchema.safeParse(raw);
  return parsed.success ? parsed.data : defaultStorePayments();
}

export type MethodChange = {
  enabled: boolean;
  details?: unknown;
  /** COD only. */
  fee?: number;
  /** COD only: the method is hidden for orders above this (EGP); null clears it. */
  maxOrder?: number | null;
  note?: string;
};

export type MethodChangeError = "not_available" | "invalid_details" | "last_method";

/**
 * Applies one method change to the current settings and validates the result.
 * Details are kept when a method is only switched off, so switching it back on
 * does not ask for them again.
 */
export function validateMethodChange(
  current: StorePayments,
  key: string,
  change: MethodChange,
): { success: true; data: StorePayments } | { success: false; error: MethodChangeError } {
  if (!LIVE_KEYS.includes(key as LivePaymentMethodKey)) return { success: false, error: "not_available" };
  const next: Record<string, unknown> = { ...current };

  if (key === "cod") {
    const prev = current.cod ?? { enabled: false, fee: 0 };
    const cod = codSettingsSchema.safeParse({
      ...prev,
      enabled: change.enabled,
      ...(change.fee !== undefined && { fee: change.fee }),
      ...(change.maxOrder !== undefined && { maxOrder: change.maxOrder ?? undefined }),
      ...(change.note !== undefined && { note: change.note || undefined }),
    });
    if (!cod.success) return { success: false, error: "invalid_details" };
    next.cod = cod.data;
  } else {
    const prev = current[key as Exclude<LivePaymentMethodKey, "cod">] as { details?: unknown } | undefined;
    const details = change.details ?? prev?.details;
    if (change.enabled || change.details !== undefined) {
      const schema = key === "instapay" ? instapayDetailsSchema : walletDetailsSchema;
      const parsed = schema.safeParse(details);
      if (!parsed.success) return { success: false, error: "invalid_details" };
      next[key] = { enabled: change.enabled, details: parsed.data };
    } else {
      next[key] = { enabled: false, ...(details !== undefined && { details }) };
    }
  }

  const result = storePaymentsSchema.safeParse(next);
  if (!result.success) {
    const last = result.error.issues.some((i) => i.message === "last_method");
    return { success: false, error: last ? "last_method" : "invalid_details" };
  }
  return { success: true, data: result.data };
}

/** Checkout values (orders.payment_method) a storefront may offer. */
export type StorefrontCheckoutMethod =
  | "cash_on_delivery"
  | "instapay"
  | "vodafone_cash"
  | "e_cash"
  | "we_pay"
  | "orange_cash"
  | "online_payment";

/**
 * Storefront manual transfers, paid to the seller's own details. WE Pay and
 * Orange Cash exist only here: the marketplace has no Tallaby account for them
 * (owner, 2026-10-31).
 */
export type SellerTransferMethod = "instapay" | "vodafone_cash" | "e_cash" | "we_pay" | "orange_cash";
export const SELLER_TRANSFER_METHODS: readonly SellerTransferMethod[] = ["instapay", "vodafone_cash", "e_cash", "we_pay", "orange_cash"];
/** Transfer methods only a storefront offers (refused on the marketplace). */
export const STOREFRONT_ONLY_METHODS: readonly SellerTransferMethod[] = ["we_pay", "orange_cash"];

/**
 * Where the customer sends a storefront transfer: the seller's saved details
 * (public: they are shown at checkout). Snapshotted into
 * `orders.metadata.sellerPayment` so a later edit never changes a placed order.
 */
export type SellerPaymentDetails = {
  method: SellerTransferMethod;
  holderName: string;
  phone?: string;
  ipa?: string;
  iban?: string;
  paymentLink?: string;
};

export type StorefrontCheckoutPayments = {
  methods: StorefrontCheckoutMethod[];
  /**
   * The seller's own connected card gateway (ROADMAP.md F-39), or null. When
   * set, `online_payment` is offered and the order is paid to the seller.
   */
  gateway?: OrderGatewayMeta | null;
  /** COD is refused for order totals above this (EGP). */
  codMaxOrder: number | null;
  codNote: string | null;
  /** The seller's receiving details for each offered manual transfer. */
  transfers: Partial<Record<SellerTransferMethod, SellerPaymentDetails>>;
};

/**
 * What a storefront's checkout offers, from its saved settings. An enabled
 * InstaPay or mobile wallet (Vodafone Cash, e& Cash, WE Pay, Orange Cash) is
 * paid to the seller's own details (`transfers`). Tallaby's card checkout and the customer wallet are not store options, so
 * storefronts never offer them. Card payment (`online_payment`) is offered
 * only through the seller's own connected gateway (`gateway`), which the
 * caller reads from store_integrations.
 */
export function storefrontCheckoutMethods(
  payments: StorePayments,
  gateway: OrderGatewayMeta | null = null,
): StorefrontCheckoutPayments {
  const methods: StorefrontCheckoutMethod[] = [];
  const transfers: StorefrontCheckoutPayments["transfers"] = {};
  if (payments.cod?.enabled) methods.push("cash_on_delivery");
  if (gateway) methods.push("online_payment");
  for (const method of SELLER_TRANSFER_METHODS) {
    const entry = payments[method];
    // Enabling requires details (storePaymentsSchema), so this always has them.
    if (!entry?.enabled || !entry.details) continue;
    methods.push(method);
    const { holderName, ...ids } = entry.details as Record<string, string | undefined>;
    const details: SellerPaymentDetails = { method, holderName: holderName ?? "" };
    for (const key of ["phone", "ipa", "iban", "paymentLink"] as const) {
      if (ids[key]) details[key] = ids[key];
    }
    transfers[method] = details;
  }
  return {
    methods,
    gateway,
    codMaxOrder: payments.cod?.enabled ? (payments.cod.maxOrder ?? null) : null,
    codNote: payments.cod?.enabled ? (payments.cod.note ?? null) : null,
    transfers,
  };
}

/** The seller details a storefront order placed with `method` is paid to, or null. */
export function sellerTransferFor(
  checkout: StorefrontCheckoutPayments | null | undefined,
  method: string,
): SellerPaymentDetails | null {
  if (!checkout || !(SELLER_TRANSFER_METHODS as readonly string[]).includes(method)) return null;
  return checkout.transfers?.[method as SellerTransferMethod] ?? null;
}

/** `orders.metadata.sellerPayment` when it is a valid snapshot, else null (marketplace orders). */
export function readSellerPayment(metadata: unknown): SellerPaymentDetails | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).sellerPayment;
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (!(SELLER_TRANSFER_METHODS as readonly unknown[]).includes(d.method) || typeof d.holderName !== "string") return null;
  const out: SellerPaymentDetails = { method: d.method as SellerTransferMethod, holderName: d.holderName };
  for (const key of ["phone", "ipa", "iban", "paymentLink"] as const) {
    if (typeof d[key] === "string" && d[key]) out[key] = d[key] as string;
  }
  return out;
}

/** Server-side check for a storefront order: the method, and COD's max order. */
export function isStorefrontCheckoutMethodAllowed(
  checkout: StorefrontCheckoutPayments,
  method: string,
  orderTotal?: number,
): boolean {
  if (!(checkout.methods as string[]).includes(method)) return false;
  if (method === "cash_on_delivery" && checkout.codMaxOrder != null && orderTotal != null) {
    return orderTotal <= checkout.codMaxOrder;
  }
  return true;
}

/** For the audit log: identifiers reduced to their last 4 characters. */
export function maskPaymentDetails(details: unknown): Record<string, unknown> | null {
  if (!details || typeof details !== "object") return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
    out[k] = ["phone", "iban", "ipa"].includes(k) && typeof v === "string" ? `•••${v.slice(-4)}` : v;
  }
  return out;
}

/**
 * The store's checkout methods for website footers (`StoreProfile.paymentMethods`
 * in @workspace/store-sections), from a stores.settings value: the same list
 * storefront checkout offers, cash on delivery alone by default.
 */
export function storeProfilePaymentMethods(settings: unknown): { key: StorefrontCheckoutMethod }[] {
  const payments = settings && typeof settings === "object" ? (settings as Record<string, unknown>).payments : undefined;
  return storefrontCheckoutMethods(parseStorePayments(payments)).methods.map((key) => ({ key }));
}
