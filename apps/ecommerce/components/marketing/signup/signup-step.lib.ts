import { emailSignupSchema, type SignupErrorKey } from "./signup.dto";

/**
 * The dialog's two steps: `email` (Google or an address), then `details`
 * (password, store link, phone). `google` is step 2 for a hero intake
 * (F-82d) signing up with Google: store link and phone only.
 */
export type SignupStage = "email" | "details" | "google";

/** The address passes the dialog's own check and the DTO's (`emailSignupSchema.email`). */
export function isSignupEmail(raw: string): boolean {
  const email = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && emailSignupSchema.shape.email.safeParse(email).success;
}

/** Server errors about the address: shown back on step 1, next to the email field. */
export function isEmailError(error: SignupErrorKey | null): boolean {
  return error === "emailTaken";
}
