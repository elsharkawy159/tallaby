"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  and,
  count,
  db,
  deliveries,
  eq,
  orders,
  payments,
  shipments,
  sql,
  users,
} from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";
import { getTranslations } from "next-intl/server";

import { actionError, type ActionResult } from "@/lib/action-result";
import { requireShippingAdmin } from "@/lib/auth";
import type { RiderDelivery } from "@/app/rider/rider.server";
import {
  createRiderSchema,
  setRiderActiveSchema,
  setRiderAvailableSchema,
  updateRiderSchema,
} from "./riders.dto";

/**
 * Riders are ordinary platform users with role = 'driver' (see
 * apps/shipping/README.md). Creating one means creating an auth account —
 * there's no separate rider auth system — so this uses the service-role
 * client, gated behind requireShippingAdmin(), never exposed to the browser.
 */
export async function createRider(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireShippingAdmin();
    const t = await getTranslations("riders");
    const { fullName, email, phone, avatarUrl } = createRiderSchema.parse(input);

    const supabase = getServiceClient();
    const tempPassword = randomUUID();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      return { success: false, error: error?.message ?? t("couldNotCreate") };
    }

    // Upserted rather than relying on a possible auth->public.users trigger —
    // this is the source of truth for role/phone/availability regardless.
    await db
      .insert(users)
      .values({
        id: data.user.id,
        email,
        fullName,
        phone,
        avatarUrl,
        role: "driver",
        isVerified: true,
        isSuspended: false,
        isAvailable: true,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { fullName, phone, avatarUrl, role: "driver", isVerified: true },
      });

    revalidatePath("/riders");
    return { success: true, data: { id: data.user.id }, message: t("riderCreated") };
  } catch (error) {
    return { success: false, error: actionError("createRider", error) };
  }
}

export async function updateRider(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const t = await getTranslations("riders");
    const { riderId, fullName, phone, avatarUrl } = updateRiderSchema.parse(input);

    const updated = await db
      .update(users)
      .set({ fullName, phone, avatarUrl, updatedAt: new Date().toISOString() })
      .where(and(eq(users.id, riderId), eq(users.role, "driver")))
      .returning({ id: users.id });

    if (updated.length === 0) return { success: false, error: t("riderNotFound") };

    revalidatePath("/riders");
    revalidatePath(`/riders/${riderId}`);
    return { success: true, message: t("riderUpdated") };
  } catch (error) {
    return { success: false, error: actionError("updateRider", error) };
  }
}

/** Activate/deactivate — reuses `isSuspended`, the same field every other
 * surface already reads (e.g. getRiders in orders.server.ts). */
export async function setRiderActive(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const t = await getTranslations("riders");
    const { riderId, isActive } = setRiderActiveSchema.parse(input);

    const updated = await db
      .update(users)
      .set({ isSuspended: !isActive, updatedAt: new Date().toISOString() })
      .where(and(eq(users.id, riderId), eq(users.role, "driver")))
      .returning({ id: users.id });

    if (updated.length === 0) return { success: false, error: t("riderNotFound") };

    revalidatePath("/riders");
    revalidatePath(`/riders/${riderId}`);
    revalidatePath("/orders");
    return {
      success: true,
      message: isActive ? t("riderActivated") : t("riderDeactivated"),
    };
  } catch (error) {
    return { success: false, error: actionError("setRiderActive", error) };
  }
}

export async function setRiderAvailable(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const t = await getTranslations("riders");
    const tCommon = await getTranslations("common");
    const { riderId, isAvailable } = setRiderAvailableSchema.parse(input);

    const updated = await db
      .update(users)
      .set({ isAvailable, updatedAt: new Date().toISOString() })
      .where(and(eq(users.id, riderId), eq(users.role, "driver")))
      .returning({ id: users.id });

    if (updated.length === 0) return { success: false, error: t("riderNotFound") };

    revalidatePath("/riders");
    revalidatePath(`/riders/${riderId}`);
    return { success: true, message: tCommon("saved") };
  } catch (error) {
    return { success: false, error: actionError("setRiderAvailable", error) };
  }
}

export interface RiderDetail {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isSuspended: boolean;
  isAvailable: boolean;
  createdAt: string | null;
}

export interface RiderDetailStats {
  activeDeliveries: number;
  todayDeliveries: number;
  deliveredToday: number;
  failedToday: number;
  codHeld: number;
  codCollectedToday: number;
}

export interface RiderDetailResult extends ActionResult<RiderDetail> {
  stats?: RiderDetailStats;
  activeOrders?: RiderDelivery[];
  completedOrders?: RiderDelivery[];
}

export async function getRiderDetail(riderId: string): Promise<RiderDetailResult> {
  try {
    await requireShippingAdmin();

    const [rider] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isSuspended: users.isSuspended,
        isAvailable: users.isAvailable,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, riderId), eq(users.role, "driver")))
      .limit(1);

    if (!rider) {
      const t = await getTranslations("riders");
      return { success: false, error: t("riderNotFound") };
    }

    const [statsRow] = await db
      .select({
        activeDeliveries: sql<number>`count(*) filter (where ${shipments.status} in ('assigned', 'out_for_delivery'))`,
        todayDeliveries: sql<number>`count(*) filter (where ${shipments.assignedAt}::date = current_date)`,
        deliveredToday: sql<number>`count(*) filter (where ${shipments.status} = 'delivered' and ${shipments.deliveredAt}::date = current_date)`,
        codHeld: sql<number>`coalesce(sum(${orders.totalAmount}) filter (
          where ${shipments.status} in ('assigned', 'out_for_delivery')
            and ${orders.paymentStatus} not in ('paid', 'collected')
        ), 0)::numeric`,
      })
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .where(eq(shipments.riderId, riderId));

    const [failedRow] = await db
      .select({ value: count() })
      .from(deliveries)
      .where(
        and(
          eq(deliveries.driverId, riderId),
          eq(deliveries.status, "failed"),
          sql`${deliveries.createdAt}::date = current_date`
        )
      );

    const [codCollectedRow] = await db
      .select({ value: sql<number>`coalesce(sum(${payments.amount}), 0)::numeric` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "collected"),
          sql`${payments.paymentData} ->> 'collectedBy' = ${riderId}`,
          sql`${payments.capturedAt}::date = current_date`
        )
      );

    const rows = await db.query.shipments.findMany({
      where: eq(shipments.riderId, riderId),
      orderBy: (shipments, { desc }) => [desc(shipments.updatedAt)],
      limit: 100,
      with: {
        order: {
          columns: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paymentStatus: true,
          },
          with: { userAddress_shippingAddressId: true },
        },
      },
    });

    const toDelivery = (row: (typeof rows)[number]): RiderDelivery => ({
      shipmentId: row.id,
      orderId: row.orderId,
      orderNumber: row.order?.orderNumber ?? "",
      status: row.status,
      subtotal: "0",
      shippingCost: null,
      discountAmount: null,
      couponCode: null,
      totalAmount: row.order?.totalAmount ?? "0",
      paymentMethod: "",
      paymentStatus: row.order?.paymentStatus ?? null,
      customerName: row.order?.userAddress_shippingAddressId?.fullName ?? null,
      phone: row.order?.userAddress_shippingAddressId?.phone ?? null,
      addressLine1: row.order?.userAddress_shippingAddressId?.addressLine1 ?? null,
      addressLine2: row.order?.userAddress_shippingAddressId?.addressLine2 ?? null,
      city: row.order?.userAddress_shippingAddressId?.city ?? null,
      state: row.order?.userAddress_shippingAddressId?.state ?? null,
      postalCode: row.order?.userAddress_shippingAddressId?.postalCode ?? null,
      country: row.order?.userAddress_shippingAddressId?.country ?? null,
      deliveryInstructions:
        row.order?.userAddress_shippingAddressId?.deliveryInstructions ?? null,
      providerName: null,
      assignedAt: row.assignedAt,
      deliveredAt: row.deliveredAt,
      latitude: row.order?.userAddress_shippingAddressId?.latitude ?? null,
      longitude: row.order?.userAddress_shippingAddressId?.longitude ?? null,
    });

    const OPEN = ["assigned", "out_for_delivery"];

    return {
      success: true,
      data: {
        ...rider,
        isSuspended: rider.isSuspended ?? false,
        isAvailable: rider.isAvailable ?? true,
      },
      stats: {
        activeDeliveries: Number(statsRow?.activeDeliveries ?? 0),
        todayDeliveries: Number(statsRow?.todayDeliveries ?? 0),
        deliveredToday: Number(statsRow?.deliveredToday ?? 0),
        failedToday: Number(failedRow?.value ?? 0),
        codHeld: Number(statsRow?.codHeld ?? 0),
        codCollectedToday: Number(codCollectedRow?.value ?? 0),
      },
      activeOrders: rows.filter((r) => OPEN.includes(r.status)).map(toDelivery),
      completedOrders: rows.filter((r) => !OPEN.includes(r.status)).map(toDelivery),
    };
  } catch (error) {
    return { success: false, error: actionError("getRiderDetail", error) };
  }
}

