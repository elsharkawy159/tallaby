"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  getSellerDocuments,
  getSellerProfile,
  uploadSellerDocument,
  updateSellerProfile,
} from "@/actions/seller";
import { sellerProfileSchema } from "./seller-settings.schema";

export async function fetchSellerSettings() {
  const [profileRes, docsRes] = await Promise.all([
    getSellerProfile(),
    getSellerDocuments(),
  ]);

  return {
    profile: profileRes.success ? profileRes.data : null,
    documents: docsRes.success ? docsRes.data : [],
    error: !profileRes.success ? profileRes.error : null,
  };
}

export async function handleUpdateSellerProfile(input: unknown) {
  try {
    const data = sellerProfileSchema.parse(input);
    const res = await updateSellerProfile({
      businessName: data.businessName,
      displayName: data.displayName,
      description: data.description || undefined,
      logoUrl: data.logoUrl || undefined,
      bannerUrl: data.bannerUrl || undefined,
      supportEmail: data.supportEmail || undefined,
      supportPhone: data.supportPhone || undefined,
      returnPolicy: data.returnPolicy || undefined,
      shippingPolicy: data.shippingPolicy || undefined,
    });
    if (!res.success) {
      return {
        success: false,
        message: res.error ?? "Failed to update",
      } as const;
    }
    revalidatePath("/settings");
    return { success: true, message: "Profile updated" } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const e of error.errors) {
        const field = e.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(e.message);
      }
      return {
        success: false,
        message: "Please fix the validation errors",
        errors: fieldErrors,
      } as const;
    }
    return { success: false, message: "Something went wrong" } as const;
  }
}

const uploadDocSchema = z.object({
  documentType: z.string().min(1),
  fileUrl: z.string().min(1),
  expiryDate: z.string().optional(),
});

export async function handleUploadDocument(input: unknown) {
  try {
    const data = uploadDocSchema.parse(input);
    const res = await uploadSellerDocument({
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      expiryDate: data.expiryDate || undefined,
    });
    if (!res.success) {
      return {
        success: false,
        message: res.error ?? "Failed to upload",
      } as const;
    }
    revalidatePath("/settings");
    return { success: true, message: "Document uploaded" } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const e of error.errors) {
        const field = e.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(e.message);
      }
      return {
        success: false,
        message: "Please fix the validation errors",
        errors: fieldErrors,
      } as const;
    }
    return { success: false, message: "Something went wrong" } as const;
  }
}
