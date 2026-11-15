import { OrdersLocked } from "@/components/orders/orders-locked";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { FinancialSection } from "./financial.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Account statements. The store wallet has its own page at /wallet. */
export default async function FinancialPage() {
  // Sales totals wait for activation like the orders behind them (ROADMAP.md F-68).
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  return <FinancialSection />;
}
