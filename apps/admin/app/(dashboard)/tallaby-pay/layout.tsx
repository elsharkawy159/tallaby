import type { ReactNode } from "react";
import { TallabyPayTabs } from "./tallaby-pay.client";
import { loadTallabyPayQueueCounts } from "./tallaby-pay.data";

export const dynamic = "force-dynamic";

/**
 * Admin › Tallaby Pay (ROADMAP.md F-100g; design §8). Shoppers of stores with
 * the «طلبي باي» app pay on Tallaby's EasyKash account; Tallaby keeps its fee
 * and owes each store the rest until it is withdrawn. Never cached.
 */
export default async function TallabyPayLayout({ children }: { children: ReactNode }) {
  const counts = await loadTallabyPayQueueCounts();
  const c = counts.data ?? { openPayouts: 0, refunds: 0, kyc: 0 };
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Tallaby Pay</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Customers of stores with Tallaby Pay pay into Tallaby&apos;s EasyKash account. Tallaby keeps its fee and holds the
          rest for the store until the seller withdraws it. Every action here is logged.
        </p>
      </div>
      <TallabyPayTabs counts={{ payouts: c.openPayouts, refunds: c.refunds, kyc: c.kyc }} />
      {children}
    </div>
  );
}
