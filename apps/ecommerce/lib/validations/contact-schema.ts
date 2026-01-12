import { z } from "zod"

// Contact form schema for logged-in users
export const contactFormAuthenticatedSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must not exceed 200 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must not exceed 5000 characters"),
  requestCall: z.boolean().default(false),
})

// Contact form schema for guest users
export const contactFormGuestSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .min(8, "Phone number must be at least 8 characters")
    .max(20, "Phone number must not exceed 20 characters"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must not exceed 200 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must not exceed 5000 characters"),
  requestCall: z.boolean().default(false),
})

// Export the inferred types
export type ContactFormAuthenticatedData = z.infer<
  typeof contactFormAuthenticatedSchema
>
export type ContactFormGuestData = z.infer<typeof contactFormGuestSchema>
