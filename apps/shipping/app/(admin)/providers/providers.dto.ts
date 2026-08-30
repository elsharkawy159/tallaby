import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const providerFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
  logoUrl: z.preprocess(emptyToUndefined, z.url().optional()),
  contactName: z.string().trim().max(200).optional(),
  contactPhone: z.string().trim().max(50).optional(),
  contactEmail: z.preprocess(emptyToUndefined, z.email().optional()),
  website: z.preprocess(emptyToUndefined, z.url().optional()),
  notes: z.string().trim().max(1000).optional(),
});

export type ProviderFormValues = z.infer<typeof providerFormSchema>;

export const createProviderSchema = providerFormSchema;

export const updateProviderSchema = providerFormSchema.extend({
  providerId: z.uuid(),
});

export const deleteProviderSchema = z.object({
  providerId: z.uuid(),
});
