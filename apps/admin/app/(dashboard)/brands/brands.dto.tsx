import { z } from "zod";

export const brandSchema = z.object({
  name: z
    .string()
    .min(1, "Brand name is required")
    .min(2, "Brand name must be at least 2 characters")
    .max(100, "Brand name must be less than 100 characters")
    .trim(),

  slug: z
    .string()
    .min(1, "Brand slug is required")
    .min(2, "Brand slug must be at least 2 characters")
    .max(100, "Brand slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .trim(),

  logoUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .url("Please enter a valid website URL")
    .optional()
    .or(z.literal("")),

  isVerified: z.boolean().default(false),

  isOfficial: z.boolean().default(false),
});

export type BrandFormData = z.infer<typeof brandSchema>;

export const brandDefaults: Partial<BrandFormData> = {
  name: "",
  slug: "",
  logoUrl: "",
  description: "",
  website: "",
  isVerified: false,
  isOfficial: false,
};

// Helper function to generate slug from name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
};
