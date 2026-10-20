import type { AdminPaymentsOverview } from "@workspace/lib/admin/server";

/** Order payment statuses grouped the way the Payments page reports them. */
export const PAYMENT_GROUPS = {
  received: ["paid", "collected"],
  pending: ["pending", "authorized"],
  failed: ["failed"],
  refunded: ["refunded", "partially_refunded"],
} as const;

export type PaymentGroup = keyof typeof PAYMENT_GROUPS;

export function paymentGroupOf(status: string): PaymentGroup | null {
  for (const [group, statuses] of Object.entries(PAYMENT_GROUPS) as [PaymentGroup, readonly string[]][]) {
    if (statuses.includes(status)) return group;
  }
  return null;
}

type Totals = Record<PaymentGroup, { orders: number; amount: number }>;

const emptyTotals = (): Totals => ({
  received: { orders: 0, amount: 0 },
  pending: { orders: 0, amount: 0 },
  failed: { orders: 0, amount: 0 },
  refunded: { orders: 0, amount: 0 },
});

export interface PaymentMethodSummary {
  method: string;
  orders: number;
  amount: number;
  groups: Totals;
}

/** Per-status totals for the cards and one row per payment method, busiest first. */
export function summarizePayments(byMethod: AdminPaymentsOverview["byMethod"]) {
  const totals = emptyTotals();
  const methods = new Map<string, PaymentMethodSummary>();
  for (const row of byMethod) {
    const group = paymentGroupOf(row.paymentStatus);
    const entry = methods.get(row.method) ?? { method: row.method, orders: 0, amount: 0, groups: emptyTotals() };
    entry.orders += row.orders;
    entry.amount += row.amount;
    if (group) {
      entry.groups[group].orders += row.orders;
      entry.groups[group].amount += row.amount;
      totals[group].orders += row.orders;
      totals[group].amount += row.amount;
    }
    methods.set(row.method, entry);
  }
  return { totals, methods: [...methods.values()].sort((a, b) => b.orders - a.orders) };
}
