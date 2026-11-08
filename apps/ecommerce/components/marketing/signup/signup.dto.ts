import { z } from "zod";

/** Same rule as the dashboard signup (`EGYPT_MOBILE` in signup.client.tsx). */
export const EGYPT_MOBILE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;

export const emailSignupSchema = z.object({
  subdomain: z.string(),
  phone: z.string(),
  email: z.email().max(254),
  password: z.string().min(8).max(72),
});
export type EmailSignupInput = z.input<typeof emailSignupSchema>;
export type StoreChoiceInput = { subdomain: string; phone: string };
/** The hero composer intake (F-82d) the dialog was opened with; the server checks the token. */
export type SignupIntakeRef = { intakeId: string; token: string };

/** Keys under `signup.errors` in the messages. */
export type SignupErrorKey =
  | "invalidInput"
  | "invalidSubdomain"
  | "phoneInvalid"
  | "subdomainTaken"
  | "emailTaken"
  | "rateLimited"
  | "googleNeedsStore"
  | "generic";

export type SignupResult =
  /** `signupEvent`: a new account was created (Meta CompleteRegistration in the dialog). */
  | {
      status: "done";
      storeUrl: string;
      subdomain: string;
      signupEvent?: { id: string; method: "email" | "google" };
      /** Set when a hero intake was claimed: the AI Store Builder link on the dashboard. */
      builderUrl?: string;
    }
  | { status: "confirm_email" }
  | { status: "ok" }
  | { status: "error"; error: SignupErrorKey };
