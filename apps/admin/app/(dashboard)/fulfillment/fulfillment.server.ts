"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import type { FulfillmentServiceStatus, FulfillmentServiceType } from "@workspace/lib/fulfillment";
import {
  FulfillmentError,
  activateSellerService,
  createFulfillmentPlan,
  getSellerFulfillmentOverview,
  listFulfillmentPlans,
  listOpenFulfillmentRequests,
  setFulfillmentPlanActive,
  setSellerServiceStatus,
  updateFulfillmentPlan,
  updateSellerFulfillmentReview,
  uniqueViolationConstraint,
  upsertSellerFulfillmentAgreement,
} from "@workspace/lib/fulfillment/server";
import {
  activateServiceSchema,
  agreementSchema,
  planFormSchema,
  reviewSchema,
  serviceStatusSchema,
  type PlanFormData,
} from "./fulfillment.dto";

type Result<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

function failure(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof FulfillmentError) return { success: false, error: error.message };
  if (uniqueViolationConstraint(error)?.includes("code")) {
    return { success: false, error: "A plan with this code already exists" };
  }
  console.error(`[admin/fulfillment] ${fallback}`, error);
  return { success: false, error: fallback };
}

function revalidateSeller(sellerId: string) {
  revalidatePath("/fulfillment");
  revalidatePath(`/sellers/${sellerId}`);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function getFulfillmentPlans() {
  await getCurrentAdminUser();
  return listFulfillmentPlans();
}

function toPlanValues(data: PlanFormData) {
  const hasPricing =
    data.pricingAmount !== null || data.pricingNoteEn !== null || data.pricingNoteAr !== null;
  return {
    nameEn: data.nameEn,
    nameAr: data.nameAr,
    descriptionEn: data.descriptionEn,
    descriptionAr: data.descriptionAr,
    features: data.features,
    limits: data.limits,
    pricing: hasPricing
      ? {
          model: data.pricingModel ?? undefined,
          amount: data.pricingAmount,
          unit: data.pricingUnit,
          noteEn: data.pricingNoteEn,
          noteAr: data.pricingNoteAr,
        }
      : null,
    shippingSpeed: data.serviceType === "delivery" ? data.shippingSpeed : null,
    availability: data.availabilityGovernorates.length
      ? { governorates: data.availabilityGovernorates }
      : null,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };
}

export async function savePlan(input: unknown, planId?: string): Promise<Result> {
  try {
    await getCurrentAdminUser();
    const parsed = planFormSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid plan" };
    }
    if (planId) {
      await updateFulfillmentPlan(planId, toPlanValues(parsed.data));
    } else {
      await createFulfillmentPlan({
        code: parsed.data.code,
        serviceType: parsed.data.serviceType,
        ...toPlanValues(parsed.data),
      });
    }
    revalidatePath("/fulfillment/plans");
    return { success: true, message: planId ? "Plan updated" : "Plan created" };
  } catch (error) {
    return failure(error, "Failed to save plan");
  }
}

export async function togglePlanActive(planId: string, isActive: boolean): Promise<Result> {
  try {
    await getCurrentAdminUser();
    await setFulfillmentPlanActive(planId, isActive);
    revalidatePath("/fulfillment/plans");
    return { success: true, message: isActive ? "Plan activated" : "Plan deactivated" };
  } catch (error) {
    return failure(error, "Failed to update plan");
  }
}

// ---------------------------------------------------------------------------
// Requests queue
// ---------------------------------------------------------------------------

export async function getFulfillmentRequests(filters: {
  status?: FulfillmentServiceStatus;
  serviceType?: FulfillmentServiceType;
}) {
  await getCurrentAdminUser();
  const [rows, plans] = await Promise.all([
    listOpenFulfillmentRequests(filters),
    listFulfillmentPlans(),
  ]);
  return { rows, plans };
}

// ---------------------------------------------------------------------------
// Per seller
// ---------------------------------------------------------------------------

/** Null when the id is malformed or the query fails, so the seller page still renders. */
export async function getSellerFulfillment(sellerId: string) {
  await getCurrentAdminUser();
  if (!/^[0-9a-f-]{36}$/i.test(sellerId)) return null;
  try {
    return await getSellerFulfillmentOverview(sellerId, { includeAgreements: true });
  } catch (error) {
    console.error("[admin/fulfillment] failed to load seller fulfillment", error);
    return null;
  }
}

export async function activateService(input: unknown): Promise<Result> {
  try {
    const admin = await getCurrentAdminUser();
    const parsed = activateServiceSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid request" };
    await activateSellerService({ ...parsed.data, adminId: admin.id });
    revalidateSeller(parsed.data.sellerId);
    return { success: true, message: "Service activated" };
  } catch (error) {
    return failure(error, "Failed to activate service");
  }
}

export async function updateServiceStatus(input: unknown): Promise<Result> {
  try {
    const admin = await getCurrentAdminUser();
    const parsed = serviceStatusSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid request" };
    await setSellerServiceStatus({ ...parsed.data, adminId: admin.id });
    revalidateSeller(parsed.data.sellerId);
    return { success: true, message: "Status updated" };
  } catch (error) {
    return failure(error, "Failed to update status");
  }
}

export async function updateReview(input: unknown): Promise<Result> {
  try {
    const admin = await getCurrentAdminUser();
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid request" };
    await updateSellerFulfillmentReview({ ...parsed.data, adminId: admin.id });
    revalidateSeller(parsed.data.sellerId);
    return { success: true, message: "Review updated" };
  } catch (error) {
    return failure(error, "Failed to update review");
  }
}

export async function saveAgreement(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await getCurrentAdminUser();
    const parsed = agreementSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid agreement" };
    }
    const row = await upsertSellerFulfillmentAgreement({ ...parsed.data, adminId: admin.id });
    revalidateSeller(parsed.data.sellerId);
    return { success: true, data: row, message: "Agreement saved" };
  } catch (error) {
    return failure(error, "Failed to save agreement");
  }
}
