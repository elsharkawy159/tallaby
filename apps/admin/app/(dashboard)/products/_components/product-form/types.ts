import type { z } from "zod";

import type { productSchema } from "../../../_lib/validations/product-schema";

export type ProductFormValues = z.infer<typeof productSchema>;

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", hint: "Hidden. Still being prepared." },
  { value: "pending", label: "Pending", hint: "Waiting for review. Hidden from the store." },
  { value: "active", label: "Active", hint: "Live on the storefront." },
  { value: "rejected", label: "Rejected", hint: "Sent back to the seller." },
] as const;

export const CONDITION_OPTIONS = [
  { label: "New", value: "new" },
  { label: "Renewed", value: "renewed" },
  { label: "Refurbished", value: "refurbished" },
  { label: "Used, like new", value: "used_like_new" },
  { label: "Used, very good", value: "used_very_good" },
  { label: "Used, good", value: "used_good" },
  { label: "Used, acceptable", value: "used_acceptable" },
] as const;

export const FULFILLMENT_OPTIONS = [
  { label: "Seller fulfilled", value: "seller_fulfilled" },
  { label: "Platform fulfilled", value: "platform_fulfilled" },
  { label: "FBA", value: "fba" },
  { label: "Digital", value: "digital" },
] as const;

export const TAX_CLASS_OPTIONS = [
  { label: "Standard", value: "standard" },
  { label: "Reduced", value: "reduced" },
  { label: "Zero", value: "zero" },
  { label: "Exempt", value: "exempt" },
] as const;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
