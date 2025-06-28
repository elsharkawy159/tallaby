"use server";

import { z } from "zod";
import { orderUpdateSchema } from "@/lib/validations/vendor-schemas";

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  updates: orderUpdateSchema,
});

export async function updateOrderStatus(
  input: z.infer<typeof updateOrderStatusSchema>
) {
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }
  try {
    const res = await fetch("/api/vendor/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: input.orderId, updates: input.updates }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        error: data.error || "Failed to update order",
        details: data.details,
      };
    }
    return { success: true, ...data };
  } catch (error) {
    return { error: "Network or server error", details: error };
  }
}
