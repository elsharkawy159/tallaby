"use server";

import { revalidatePath } from "next/cache";
import { asc, count, db, eq, shipments, shippingProviders, sql } from "@workspace/db";

import {
  actionError,
  type ActionResult,
  type ListResult,
} from "@/lib/action-result";
import { requireShippingAdmin } from "@/lib/auth";
import { toggleProviderSchema } from "../orders/orders.dto";
import {
  createProviderSchema,
  deleteProviderSchema,
  updateProviderSchema,
} from "./providers.dto";

export interface ProviderRow {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  logoUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  notes: string | null;
  shipmentCount: number;
  activeCount: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
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
        logoUrl: shippingProviders.logoUrl,
        contactName: shippingProviders.contactName,
        contactPhone: shippingProviders.contactPhone,
        contactEmail: shippingProviders.contactEmail,
        website: shippingProviders.website,
        notes: shippingProviders.notes,
        shipmentCount: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."provider_id" = ${shippingProviders.id}
        )`,
        activeCount: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."provider_id" = ${shippingProviders.id}
            and "shipments"."status" in ('assigned', 'out_for_delivery')
        )`,
        deliveredCount: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."provider_id" = ${shippingProviders.id}
            and "shipments"."status" = 'delivered'
        )`,
        failedCount: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."provider_id" = ${shippingProviders.id}
            and "shipments"."status" = 'failed'
        )`,
        returnedCount: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."provider_id" = ${shippingProviders.id}
            and "shipments"."status" = 'returned'
        )`,
      })
      .from(shippingProviders)
      .orderBy(asc(shippingProviders.name));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: actionError("getProviders", error), data: [] };
  }
}

export async function createProvider(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const values = createProviderSchema.parse(input);

    const [existing] = await db
      .select({ id: shippingProviders.id })
      .from(shippingProviders)
      .where(eq(shippingProviders.code, values.code))
      .limit(1);
    if (existing) {
      return { success: false, error: "A provider with this code already exists" };
    }

    await db.insert(shippingProviders).values(values);

    revalidatePath("/providers");
    return { success: true, message: "Provider created" };
  } catch (error) {
    return { success: false, error: actionError("createProvider", error) };
  }
}

export async function updateProvider(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const { providerId, ...values } = updateProviderSchema.parse(input);

    const updated = await db
      .update(shippingProviders)
      .set({ ...values, updatedAt: new Date().toISOString() })
      .where(eq(shippingProviders.id, providerId))
      .returning({ id: shippingProviders.id });

    if (updated.length === 0) {
      return { success: false, error: "Provider not found" };
    }

    revalidatePath("/providers");
    return { success: true, message: "Provider updated" };
  } catch (error) {
    return { success: false, error: actionError("updateProvider", error) };
  }
}

export async function deleteProvider(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const { providerId } = deleteProviderSchema.parse(input);

    const [row] = await db
      .select({ value: count() })
      .from(shipments)
      .where(eq(shipments.providerId, providerId));
    const shipmentCount = row?.value ?? 0;

    if (shipmentCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${shipmentCount} shipment(s) use this provider. Deactivate it instead.`,
      };
    }

    await db.delete(shippingProviders).where(eq(shippingProviders.id, providerId));

    revalidatePath("/providers");
    return { success: true, message: "Provider deleted" };
  } catch (error) {
    return { success: false, error: actionError("deleteProvider", error) };
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
