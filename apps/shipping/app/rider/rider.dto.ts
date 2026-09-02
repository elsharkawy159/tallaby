import { z } from "zod";

export const updateMyProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  avatarUrl: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.url().optional()
    ),
});
