import { z } from "zod";

export const CONTACT_ROLES = ["seller", "new", "shopper", "partner"] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const contactSchema = z.object({
  role: z.enum(CONTACT_ROLES),
  topic: z.string().trim().min(1).max(80),
  fullName: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  storeLink: z.string().trim().max(64).optional(),
  message: z.string().trim().min(10).max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult = { ok: true } | { ok: false; error: "invalid" | "rateLimited" | "generic" };
