import { normalizeBlockedPhone } from "@workspace/lib/stores/blocked-phones";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Store-website checkout rate limit (ROADMAP.md F-02e). Counts placed orders
 * per store: per visitor IP, per shipping phone and per signed-in (or guest)
 * user. A request is refused when any of its keys is at the limit; only a
 * successful order is counted, so a customer fixing a refused checkout
 * (address, minimum order, stock) never uses up the allowance. In-memory per
 * server instance, like the other limiters (rate-limit.lib.ts).
 */
export const ORDER_RATE_LIMITS = {
  /** Many shoppers can share one mobile-carrier IP, so this one is the loosest. */
  ip: { limit: 5, windowMs: 10 * 60_000 },
  phone: { limit: 3, windowMs: 60 * 60_000 },
  user: { limit: 5, windowMs: 10 * 60_000 },
} as const;

export type OrderRateKind = keyof typeof ORDER_RATE_LIMITS;
export type OrderRateKeys = Partial<Record<OrderRateKind, string>>;

/** Phone digits for the key: `01XXXXXXXXX` for an Egyptian mobile, else the bare digits (null if too short). */
export function orderRatePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = normalizeBlockedPhone(phone);
  if (normalized) return normalized;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 6 ? digits : null;
}

/** The keys for one checkout, all scoped to the store; unknown parts are left out. */
export function orderRateLimitKeys(input: {
  storeId: string;
  ip?: string | null;
  phone?: string | null;
  userId?: string | null;
}): OrderRateKeys {
  const keys: OrderRateKeys = {};
  const ip = input.ip?.trim();
  if (ip && ip !== "unknown") keys.ip = `${input.storeId}:ip:${ip}`;
  const phone = orderRatePhone(input.phone);
  if (phone) keys.phone = `${input.storeId}:phone:${phone}`;
  if (input.userId) keys.user = `${input.storeId}:user:${input.userId}`;
  return keys;
}

export type OrderRateLimit = {
  /** True when no key is at its limit (counts nothing). */
  allows: (keys: OrderRateKeys, now?: number) => boolean;
  /** Counts one placed order against every key. */
  record: (keys: OrderRateKeys, now?: number) => void;
};

export function createOrderRateLimit(limits: Record<OrderRateKind, { limit: number; windowMs: number }> = ORDER_RATE_LIMITS): OrderRateLimit {
  const limiters = {
    ip: createRateLimiter(limits.ip),
    phone: createRateLimiter(limits.phone),
    user: createRateLimiter(limits.user),
  };
  const entries = (keys: OrderRateKeys) =>
    (Object.keys(limiters) as OrderRateKind[]).flatMap((kind) => (keys[kind] ? [[kind, keys[kind]!] as const] : []));

  return {
    allows: (keys, now = Date.now()) => entries(keys).every(([kind, key]) => limiters[kind].peek(key, now)),
    record: (keys, now = Date.now()) => {
      for (const [kind, key] of entries(keys)) limiters[kind].check(key, now);
    },
  };
}
