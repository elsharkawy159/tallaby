/**
 * Tallaby Pay ledger rules, pure (ROADMAP.md F-100a; design §4.3, §4.5).
 *
 * These mirror the database: `tallabyPayEntryProblem` is the shape check of
 * `tallaby_pay_entries_deltas_check` (0175), and `balanceViolation` is the
 * WHERE clause of the guarded balance UPDATE in `postTallabyPayEntry`. The
 * database stays the backstop; these give a clear error before a round trip
 * and are unit-tested. All amounts are integer piastres.
 */

export const TALLABY_PAY_ENTRY_KINDS = [
  "sale",
  "release",
  "refund",
  "payout_reserve",
  "payout_unreserve",
  "payout",
  "payout_reversal",
  "adjustment",
] as const;

export type TallabyPayEntryKind = (typeof TALLABY_PAY_ENTRY_KINDS)[number];

export function isTallabyPayEntryKind(value: unknown): value is TallabyPayEntryKind {
  return typeof value === "string" && (TALLABY_PAY_ENTRY_KINDS as readonly string[]).includes(value);
}

/** Signed moves of the three buckets, in piastres. */
export interface TallabyPayDeltas {
  pending: number;
  available: number;
  reserved: number;
}

export interface TallabyPayEntryShape extends TallabyPayDeltas {
  kind: TallabyPayEntryKind;
  saleId: string | null;
  payoutId: string | null;
  /** Required for an adjustment (stored as metadata.reason). */
  reason: string | null;
}

const SALE_KINDS: readonly TallabyPayEntryKind[] = ["sale", "release", "refund"];
const PAYOUT_KINDS: readonly TallabyPayEntryKind[] = ["payout_reserve", "payout_unreserve", "payout", "payout_reversal"];

/**
 * Only these may take `available` below `reserved` (and so below zero):
 * a refund after release, and an admin adjustment such as a chargeback fee
 * (owner 2026-11-18, Q8).
 */
export function mayPushAvailableNegative(kind: TallabyPayEntryKind): boolean {
  return kind === "refund" || kind === "adjustment";
}

/** Why an entry is malformed, or null when it is well-formed. */
export function tallabyPayEntryProblem(e: TallabyPayEntryShape): string | null {
  if (!isTallabyPayEntryKind(e.kind)) return `unknown kind ${String(e.kind)}`;
  const { pending: p, available: a, reserved: r } = e;
  if (![p, a, r].every(Number.isSafeInteger)) return "deltas must be integer piastres";
  if (p === 0 && a === 0 && r === 0) return "an entry must move a balance";
  if (SALE_KINDS.includes(e.kind) && !e.saleId) return `${e.kind} needs its sale`;
  if (PAYOUT_KINDS.includes(e.kind) && !e.payoutId) return `${e.kind} needs its payout`;

  const ok = (() => {
    switch (e.kind) {
      case "sale":
        return p > 0 && a === 0 && r === 0;
      case "release":
        return p < 0 && a === -p && r === 0;
      case "refund":
        return r === 0 && ((p < 0 && a === 0) || (p === 0 && a < 0));
      case "payout_reserve":
        return p === 0 && a === 0 && r > 0;
      case "payout_unreserve":
        return p === 0 && a === 0 && r < 0;
      case "payout":
        return p === 0 && a < 0 && r === a;
      case "payout_reversal":
        return p === 0 && a > 0 && r === 0;
      case "adjustment":
        return r === 0;
      default: {
        const never: never = e.kind;
        return never;
      }
    }
  })();
  if (!ok) return `deltas do not fit a ${e.kind} entry`;
  if (e.kind === "adjustment" && !e.reason?.trim()) return "an adjustment needs a reason";
  return null;
}

/**
 * Which bucket a move would break, or null. Pending and reserved never go
 * below zero. Unless the kind may push it negative, a move that lowers
 * `available` or raises `reserved` must leave `available ≥ reserved`; a move
 * that only adds (a sale, a release, an unreserve) is always allowed, so a
 * negative wallet can still receive money.
 */
export function balanceViolation(
  wallet: TallabyPayDeltas,
  delta: TallabyPayDeltas,
  kind: TallabyPayEntryKind,
): "pending" | "reserved" | "available" | null {
  if (wallet.pending + delta.pending < 0) return "pending";
  if (wallet.reserved + delta.reserved < 0) return "reserved";
  const lowersFree = delta.available < 0 || delta.reserved > 0;
  if (lowersFree && !mayPushAvailableNegative(kind) && wallet.available + delta.available < wallet.reserved + delta.reserved) {
    return "available";
  }
  return null;
}
