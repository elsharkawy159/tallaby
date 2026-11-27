"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { getTranslations } from "next-intl/server";
import { updateSellerProfile } from "@/actions/seller";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { sellerProfileSchema } from "./contact.dto";

/**
 * Store settings › Business & contact (moved from /settings, owner 2026-11-27).
 * Account fields of the session seller only (updateSellerProfile reads the
 * session); store fields are edited (and mirrored) via Store settings › General.
 */
export async function handleUpdateSellerProfile(input: unknown) {
  const t = await getTranslations("settings.messages");
  try {
    await requireSeller({ forWrite: true });
    const data = sellerProfileSchema.parse(input);
    const res = await updateSellerProfile({
      businessName: data.businessName,
      supportEmail: data.supportEmail || undefined,
      supportPhone: data.supportPhone || undefined,
    });
    if (!res.success) {
      return {
        success: false,
        message: t("updateFailed"),
      } as const;
    }
    revalidateDashboardPath("/stores/[storeId]/settings/contact", "page");
    revalidatePath("/", "layout");
    return { success: true, message: t("profileUpdated") } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const e of error.issues) {
        const field = e.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(e.message);
      }
      return {
        success: false,
        message: t("fixErrors"),
        errors: fieldErrors,
      } as const;
    }
    if (isAccessError(error)) return { success: false, message: t("updateFailed") } as const;
    return { success: false, message: t("somethingWentWrong") } as const;
  }
}
