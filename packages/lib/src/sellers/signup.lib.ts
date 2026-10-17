/**
 * Pure rules for the minimal seller signup (PLAN.md §6, P2-01). No DB imports.
 */
import { z } from "zod";
import { EGYPT_MOBILE_REGEX } from "../fulfillment";
import { normalizeSubdomain, validateSubdomain } from "../storefront";

/** `faster-eg` → `Faster Eg`. Used as the initial business and store name; editable later. */
export function displayNameFromSubdomain(subdomain: string): string {
  return subdomain
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 100);
}

/** `+20 101 234 5678` / `0101-234-5678` → `01012345678`. */
export function normalizeEgyptianMobile(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+20")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  return digits;
}

export const signupInputSchema = z.object({
  subdomain: z
    .string()
    .transform(normalizeSubdomain)
    .refine((s) => validateSubdomain(s) === null, { message: "invalid_subdomain" }),
  // Kept at signup for the WhatsApp ops rule (D6). No OTP.
  phone: z.string().transform(normalizeEgyptianMobile).pipe(z.string().regex(EGYPT_MOBILE_REGEX, "phone_invalid")),
});
export type SignupInput = z.input<typeof signupInputSchema>;
