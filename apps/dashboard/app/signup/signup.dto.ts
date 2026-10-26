import { z } from "zod";
import { signupInputSchema } from "@workspace/lib/sellers";

/**
 * Signup form payloads (PLAN.md §6.1). Error messages are i18n keys under
 * `signup.errors`. The server re-validates with the same schemas.
 */
export const storeChoiceSchema = signupInputSchema;
export type StoreChoiceInput = z.input<typeof storeChoiceSchema>;

/** The setup step for a signed-in user: the store choice plus an industry id (STORE_INDUSTRIES). */
export type StoreSetupInput = StoreChoiceInput & { industry: string };

export const emailSignupSchema = z.object({
  subdomain: z.string(),
  phone: z.string(),
  email: z.email("invalidEmail").max(254),
  password: z.string().min(8, "passwordTooShort").max(72, "passwordTooLong"),
});
export type EmailSignupInput = z.input<typeof emailSignupSchema>;

export type SignupErrorKey =
  | "invalidInput"
  | "invalidSubdomain"
  | "phoneInvalid"
  | "industryRequired"
  | "subdomainTaken"
  | "emailTaken"
  | "rateLimited"
  | "notSignedIn"
  | "alreadySeller"
  | "generic";

export type SignupResult =
  | { status: "done"; storeUrl: string }
  | { status: "confirm_email" }
  | { status: "ok" }
  | { status: "error"; error: SignupErrorKey };

export type { SubdomainCheckResult } from "@/components/stores/subdomain-field.client";
