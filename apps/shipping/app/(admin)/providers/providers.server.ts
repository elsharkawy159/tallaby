"use server";

import { revalidatePath } from "next/cache";
import { asc, db, eq, shippingProviders, sql } from "@workspace/db";

import {
  actionError,
  type ActionResult,
  type ListResult,
} from "@/lib/action-result";
import { requireShippingAdmin } from "@/lib/auth";
import { toggleProviderSchema } from "../orders/orders.dto";

export interface ProviderRow {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  shipmentCount: number;
}

export async function getProviders(): Promise<ListResult<ProviderRow>> {
  try {
    await requireShippingAdmin();

    const data = await db
      .select({
        id: shippingProviders.id,
        name: shippingProviders.name,
        code: shippingProviders.code,
        isActive: shippingProviders.isActive,
        shipmentCount: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."provider_id" = ${shippingProviders.id}
        )`,
      })
      .from(shippingProviders)
      .orderBy(asc(shippingProviders.name));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: actionError("getProviders", error), data: [] };
  }
}

export async function toggleProvider(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const { providerId, isActive } = toggleProviderSchema.parse(input);

    const updated = await db
      .update(shippingProviders)
      .set({ isActive, updatedAt: new Date().toISOString() })
      .where(eq(shippingProviders.id, providerId))
      .returning({ id: shippingProviders.id });

    if (updated.length === 0) {
      return { success: false, error: "Provider not found" };
    }

    revalidatePath("/providers");
    revalidatePath("/orders");
    return {
      success: true,
      message: isActive ? "Provider enabled" : "Provider disabled",
    };
  } catch (error) {
    return { success: false, error: actionError("toggleProvider", error) };
  }
}
