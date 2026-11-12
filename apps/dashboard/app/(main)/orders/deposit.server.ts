"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { confirmOrderDeposit, rejectOrderDeposit } from "@workspace/lib/orders/cod-deposit/server";
import { AccessError, requireOrderSeller } from "@/lib/auth/require-seller.server";

/**
 * "Deposit received" / "Not received" on a COD order (ROADMAP.md F-21). The
 * seller comes from the session and must own the order (requireOrderSeller,
 * which also applies the F-84 order lock); the lib then checks that the
 * order's store is theirs and every line is theirs, and guards the status, so
 * a repeat press or a stale panel changes nothing. No money moves: the
 * deposit went to the seller's own account.
 */

const inputSchema = z.object({ orderId: z.uuid(), decision: z.enum(["received", "not_received"]) });

type DepositResult = { success: true } | { success: false; error: string };

export async function decideOrderDeposit(input: unknown): Promise<DepositResult> {
  const t = await getTranslations("orders.deposit.errors");
  try {
    const { orderId, decision } = inputSchema.parse(input);
    const { sellerId } = await requireOrderSeller(orderId);
    const result =
      decision === "received" ? await confirmOrderDeposit(sellerId, orderId) : await rejectOrderDeposit(sellerId, orderId);
    if (!result.success) return { success: false, error: t(result.error) };
    revalidatePath("/orders", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof AccessError) return { success: false, error: t("not_found") };
    if (error instanceof z.ZodError) return { success: false, error: t("not_found") };
    console.error("decideOrderDeposit:", (error as Error)?.message);
    return { success: false, error: t("generic") };
  }
}
