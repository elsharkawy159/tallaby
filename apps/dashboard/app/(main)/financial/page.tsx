import { OrdersLocked } from "@/components/orders/orders-locked";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { FinancialSection } from "./financial.data";

export const dynamic = "force-dynamic";

/** Account statements. The store wallet has its own page at /wallet. */
export default async function FinancialPage() {
  // Sales totals wait for activation like the orders behind them (ROADMAP.md F-68).
  const lock = await currentOrderLock();
  if (lock.locked) return <OrdersLocked lock={lock} />;
  return <FinancialSection />;
}
