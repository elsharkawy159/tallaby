"use server";

import { getTallabyPayOrderSales } from "@workspace/lib/tallaby-pay/server";
import { isAccessError, requireOrderSeller } from "@/lib/auth/require-seller.server";
import { saleState, type SaleState } from "../stores/[storeId]/earnings/earnings.lib";

export type OrderTallabyPaySale = {
  purpose: "order" | "deposit";
  storeId: string;
  gross: string;
  fee: string;
  net: string;
  state: SaleState;
  releaseAt: string | null;
};

/**
 * The Tallaby Pay sale(s) of an order for the order panel (ROADMAP.md
 * F-100f): paid amount, fee, the seller's net and its earnings status. Only
 * this seller's rows (rule 5); empty for any other order. Never cached.
 */
export async function getOrderTallabyPay(orderId: string): Promise<OrderTallabyPaySale[]> {
  try {
    const { sellerId } = await requireOrderSeller(String(orderId));
    const sales = await getTallabyPayOrderSales({ sellerId, orderId: String(orderId) });
    return sales.map((sale) => ({
      purpose: sale.purpose,
      storeId: sale.storeId,
      gross: sale.gross,
      fee: sale.fee,
      net: sale.net,
      state: saleState(sale),
      releaseAt: sale.releaseAt,
    }));
  } catch (error) {
    if (!isAccessError(error)) console.error("[tallaby-pay] order sales read failed", (error as Error)?.name);
    return [];
  }
}
