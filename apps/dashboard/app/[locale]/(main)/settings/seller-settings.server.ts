"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { getTranslations } from "next-intl/server";
import { uploadSellerDocument, updateSellerProfile } from "@/actions/seller";
import { getSessionUser } from "@/lib/auth/session.server";
import { sellerProfileSchema } from "./seller-settings.schema";
import { isOwnSellerDocumentUrl } from "./seller-documents.lib";

// fetchSellerSettings moved to seller-settings.data.tsx: an export of this
// "use server" file is a public action, and it returned the full sellers row.

export async function handleUpdateSellerProfile(input: unknown) {
  const t = await getTranslations("settings.messages");
  try {
    const data = sellerProfileSchema.parse(input);
    // Account fields only: store fields are edited (and mirrored) via Store settings.
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
    revalidateDashboardPath("/settings");
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
    return { success: false, message: t("somethingWentWrong") } as const;
  }
}

const uploadDocSchema = z.object({
  documentType: z.string().min(1),
  fileUrl: z.string().min(1),
  expiryDate: z.string().optional(),
});

export async function handleUploadDocument(input: unknown) {
  const t = await getTranslations("settings.messages");
  try {
    const data = uploadDocSchema.parse(input);
    // The browser sends the file URL: accept only a file in this seller's own
    // documents folder (no other seller's file, bucket, host or `..`).
    const user = await getSessionUser();
    if (!user) return { success: false, message: t("uploadFailed") } as const;
    if (!isOwnSellerDocumentUrl(user.id, data.fileUrl, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
      return { success: false, message: t("uploadFailed") } as const;
    }
    const res = await uploadSellerDocument({
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      expiryDate: data.expiryDate || undefined,
    });
    if (!res.success) {
      return {
        success: false,
        message: t("uploadFailed"),
      } as const;
    }
    revalidateDashboardPath("/settings");
    return {
      success: true,
      message: t("documentUploaded"),
      document: res.data,
    } as const;
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
    return { success: false, message: t("somethingWentWrong") } as const;
  }
}
