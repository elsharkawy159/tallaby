import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.email().max(200),
  locale: z.enum(["ar", "en"]),
  /** A honeypot field: people leave it empty, bots tend to fill it. */
  website: z.string().max(0).optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export type NewsletterResult = { ok: true } | { ok: false; error: "invalid" | "rateLimited" | "generic" };
