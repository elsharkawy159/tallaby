export type WalletKpiState = "negative" | "zero" | "positive";

/**
 * The home "Store wallet" card's footer (PLAN.md §13.4): below zero asks for a
 * top-up, since platform fees keep being taken from a negative balance.
 */
export function walletKpiState(balance: number): WalletKpiState {
  if (balance < 0) return "negative";
  return balance > 0 ? "positive" : "zero";
}
