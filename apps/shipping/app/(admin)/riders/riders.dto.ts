import { z } from "zod";

export const createRiderSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(200),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  avatarUrl: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.url().optional()
    ),
});

export const updateRiderSchema = z.object({
  riderId: z.uuid(),
  fullName: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  avatarUrl: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.url().optional()
    ),
});

export const setRiderActiveSchema = z.object({
  riderId: z.uuid(),
  isActive: z.boolean(),
});

export const setRiderAvailableSchema = z.object({
  riderId: z.uuid(),
  isAvailable: z.boolean(),
});
