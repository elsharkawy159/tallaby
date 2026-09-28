"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { db, sellers, users, eq, and, or, isNull } from "@workspace/db";
import {
  collectCatalogIssues,
  fulfillmentRequestSchema,
  plansForService,
  type FulfillmentPlanView,
} from "@workspace/lib/fulfillment";
import {
  createSellerFulfillmentSetup,
  listFulfillmentPlans,
  uniqueViolationConstraint,
} from "@workspace/lib/fulfillment/server";
import {
  businessInfoSchema,
  legalAddressSchema,
  type OnboardingSubmission,
} from "./become-seller.dto";
import type { SellerApplicationResult } from "./become-seller.types";
import { createDisplayName, generateSlug } from "./become-seller.lib";

/** Active catalog for the wizard. Plans are admin-managed; nothing is hard-coded in the UI. */
export async function getOnboardingCatalog(): Promise<FulfillmentPlanView[]> {
  return listFulfillmentPlans({ activeOnly: true });
}

type IssueList = { path: PropertyKey[]; message: string }[];

const toErrorMap = (issues: IssueList, prefix: string, target: Record<string, string>) => {
  for (const issue of issues) {
    const path = [prefix, ...issue.path.map(String)].filter(Boolean).join(".");
    target[path] ??= issue.message;
  }
};

export const submitSellerApplication = async (
  submission: OnboardingSubmission
): Promise<SellerApplicationResult> => {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, messageKey: "submitErrors.notSignedIn" };
  }

  // 2. Validate everything server-side; the wizard's step checks are UX only.
  const errors: Record<string, string> = {};

  const business = businessInfoSchema.safeParse(submission?.business);
  if (!business.success) toErrorMap(business.error.issues, "", errors);

  const legalAddress = legalAddressSchema.safeParse(submission?.legalAddress);
  if (!legalAddress.success) toErrorMap(legalAddress.error.issues, "legalAddress", errors);

  const fulfillment = fulfillmentRequestSchema.safeParse(submission?.fulfillment);
  if (!fulfillment.success) toErrorMap(fulfillment.error.issues, "", errors);

  if (submission?.acceptTerms !== true) errors.acceptTerms = "terms_required";

  if (fulfillment.success) {
    const catalog = await listFulfillmentPlans({ activeOnly: true });
    toErrorMap(collectCatalogIssues(fulfillment.data.services, catalog), "", errors);

    // A model of "Tallaby handles it" must be backed by a plan in every service.
    if (fulfillment.data.model === "tallaby_fulfillment") {
      for (const type of ["storage", "packaging", "delivery", "customer_service", "returns"] as const) {
        if (plansForService(catalog, type).length === 0) {
          errors[`services.${type}.planId`] ??= "plan_unavailable";
        }
      }
    }
  }

  if (!business.success || !legalAddress.success || !fulfillment.success || Object.keys(errors).length) {
    return { success: false, messageKey: "submitErrors.validation", errors };
  }

  // 3. One seller per user
  const [existingSeller] = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.id, user.id))
    .limit(1);
  if (existingSeller) {
    return { success: false, messageKey: "submitErrors.alreadySeller" };
  }

  // 4. Unique slug. Arabic-only names slugify to "", so fall back to an id-based one.
  const baseSlug =
    generateSlug(business.data.businessName) || `seller-${user.id.slice(0, 8)}`;
  let uniqueSlug = baseSlug;
  for (let counter = 1; ; counter++) {
    const [taken] = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.slug, uniqueSlug))
      .limit(1);
    if (!taken) break;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  const now = new Date().toISOString();

  try {
    // 5. Seller + role + fulfillment request, atomically.
    await db.transaction(async (tx) => {
      await tx.insert(sellers).values({
        id: user.id,
        businessName: business.data.businessName,
        displayName: createDisplayName(business.data.businessName),
        slug: uniqueSlug,
        businessType: business.data.businessType,
        description: business.data.description || undefined,
        logoUrl: business.data.logoUrl || undefined,
        bannerUrl: business.data.bannerUrl || undefined,
        legalAddress: {
          ...legalAddress.data,
          postalCode: legalAddress.data.postalCode ?? "",
        },
        supportEmail: business.data.supportEmail,
        supportPhone: business.data.supportPhone,
        // Sellers can start selling right away. Fulfillment services they
        // requested stay "requested" until Tallaby activates them, and until
        // then orders run exactly as they do today.
        status: "approved",
        onboardingStep: 7,
        onboardingComplete: true,
      });

      // Promote plain customers only (same rule as the 0041 backfill). Any
      // other role - admin, support, and especially driver, which the shipping
      // app matches on - is kept; seller access is decided by the sellers row.
      await tx
        .update(users)
        .set({ role: "seller", updatedAt: now })
        .where(and(eq(users.id, user.id), or(isNull(users.role), eq(users.role, "customer"))));

      await createSellerFulfillmentSetup(tx, {
        sellerId: user.id,
        request: fulfillment.data,
        termsAcceptedAt: now,
      });
    });
  } catch (error) {
    console.error("[onboarding] seller creation failed", error);
    const constraint = uniqueViolationConstraint(error);
    if (constraint?.includes("slug")) {
      return { success: false, messageKey: "submitErrors.nameTaken", errors: { businessName: "business_name_taken" } };
    }
    if (constraint?.startsWith("sellers_pkey")) {
      return { success: false, messageKey: "submitErrors.alreadySeller" };
    }
    return { success: false, messageKey: "submitErrors.generic" };
  }

  // 6. user_metadata.is_seller is a fast-path cache for the storefront
  // middleware. Nothing depends on it for authorization (authorization reads
  // the sellers row), so it is set through the user's own session - no
  // service-role key needed - and a failure is logged, not surfaced.
  const { error: metadataError } = await supabase.auth.updateUser({
    data: { is_seller: true },
  });
  if (metadataError) {
    console.error("[onboarding] failed to set is_seller metadata", metadataError);
  }

  revalidatePath("/onboarding");
  return { success: true, messageKey: "submitSuccess" };
};

/**
 * Checks if a business name slug is available.
 * Returns null when the check itself failed, so the UI can stay neutral
 * instead of reporting the name as taken.
 */
export const checkBusinessNameAvailability = async (
  businessName: string
): Promise<boolean | null> => {
  try {
    if (!businessName.trim()) return false;

    const slug = generateSlug(businessName);
    // Arabic-only names get an id-based slug at submit time, so they never collide.
    if (!slug) return true;

    const existingSeller = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.slug, slug))
      .limit(1);

    return existingSeller.length === 0;
  } catch (error) {
    console.error("[onboarding] business name check failed", error);
    return null;
  }
};
